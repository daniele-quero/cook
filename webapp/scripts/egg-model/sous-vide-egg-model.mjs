// Two-layer heat-conduction model of an egg in a sous-vide bath, used to derive the
// per-profile coefficients of the calculator in src/components/sous-vide-egg-calculator-model.ts.
// Yolk sphere + white shell (finite volumes, backward Euler), eggshell as a lumped resistance,
// convective bath, then immediate ice water. Properties: Abbasnezhad et al. 2015,
// Food Sci Nutr 4(1):42-49, https://doi.org/10.1002/fsn3.257.
// Usage: node scripts/egg-model/sous-vide-egg-model.mjs

import { pathToFileURL } from "node:url";

export const DEFAULTS = {
  massG: 60,
  initialC: 5,
  bathC: 88.5,
  cookS: 450,
  shellFraction: 0.105,
  yolkFraction: 0.28,
  shellThicknessM: 0.00033,
  shellConductivity: 2.25,
  bathH: 1000,
  iceH: 400,
  iceC: 1,
  iceS: 480,
  yolkNodes: 50,
  whiteNodes: 30,
  stepS: 0.25,
};

const yolkDensity = (t) => -0.0023 * t * t - 0.1386 * t + 1037.1;
const whiteDensity = (t) => -0.0041 * t * t - 0.0115 * t + 1043.3;
const yolkConductivity = (t) => 0.0008 * t + 0.395;
const whiteConductivity = (t) => 0.0013 * t + 0.5125;
const YOLK_CP = 3120;
const WHITE_CP = 3800;

function solveTridiagonal(lower, diagonal, upper, rhs) {
  const n = rhs.length;
  const c = new Float64Array(n);
  const d = new Float64Array(n);
  c[0] = upper[0] / diagonal[0];
  d[0] = rhs[0] / diagonal[0];
  for (let i = 1; i < n; i += 1) {
    const m = diagonal[i] - lower[i] * c[i - 1];
    c[i] = upper[i] / m;
    d[i] = (rhs[i] - lower[i] * d[i - 1]) / m;
  }
  const x = new Float64Array(n);
  x[n - 1] = d[n - 1];
  for (let i = n - 2; i >= 0; i -= 1) x[i] = d[i] - c[i] * x[i + 1];
  return x;
}

export function simulate(options = {}) {
  const o = { ...DEFAULTS, ...options };
  const yolkVolume = (o.massG * o.yolkFraction) / 1000 / yolkDensity(20);
  const whiteVolume = (o.massG * (1 - o.shellFraction - o.yolkFraction)) / 1000 / whiteDensity(20);
  const yolkRadius = Math.cbrt((3 * yolkVolume) / (4 * Math.PI));
  const radius = Math.cbrt((3 * (yolkVolume + whiteVolume)) / (4 * Math.PI));
  const n = o.yolkNodes + o.whiteNodes;
  const faces = new Float64Array(n + 1);
  for (let i = 0; i <= o.yolkNodes; i += 1) faces[i] = (yolkRadius * i) / o.yolkNodes;
  for (let j = 1; j <= o.whiteNodes; j += 1) faces[o.yolkNodes + j] = yolkRadius + ((radius - yolkRadius) * j) / o.whiteNodes;
  const centers = new Float64Array(n);
  const volumes = new Float64Array(n);
  for (let i = 0; i < n; i += 1) {
    centers[i] = 0.5 * (faces[i] + faces[i + 1]);
    volumes[i] = (4 / 3) * Math.PI * (faces[i + 1] ** 3 - faces[i] ** 3);
  }
  const isYolk = (i) => i < o.yolkNodes;
  const conductivity = (i, t) => (isYolk(i) ? yolkConductivity(t) : whiteConductivity(t));
  const capacity = (i, t) => (isYolk(i) ? yolkDensity(t) * YOLK_CP : whiteDensity(t) * WHITE_CP) * volumes[i];
  const temperature = new Float64Array(n).fill(o.initialC);
  const peak = new Float64Array(n).fill(o.initialC);
  const lower = new Float64Array(n);
  const diagonal = new Float64Array(n);
  const upper = new Float64Array(n);
  const rhs = new Float64Array(n);
  const cookSteps = Math.round(o.cookS / o.stepS);
  const steps = cookSteps + Math.round(o.iceS / o.stepS);
  const centerHistory = [];
  for (let s = 0; s < steps; s += 1) {
    const cooking = s < cookSteps;
    const surroundingC = cooking ? o.bathC : o.iceC;
    const u = 1 / (1 / (cooking ? o.bathH : o.iceH) + o.shellThicknessM / o.shellConductivity);
    for (let i = 0; i < n; i += 1) {
      const inertia = capacity(i, temperature[i]) / o.stepS;
      let left = 0;
      let right = 0;
      let outside = 0;
      if (i > 0) {
        const r = faces[i];
        left = (4 * Math.PI * r * r) / ((r - centers[i - 1]) / conductivity(i - 1, temperature[i - 1]) + (centers[i] - r) / conductivity(i, temperature[i]));
      }
      if (i < n - 1) {
        const r = faces[i + 1];
        right = (4 * Math.PI * r * r) / ((r - centers[i]) / conductivity(i, temperature[i]) + (centers[i + 1] - r) / conductivity(i + 1, temperature[i + 1]));
      } else {
        outside = (4 * Math.PI * radius * radius) / ((radius - centers[i]) / conductivity(i, temperature[i]) + 1 / u);
      }
      lower[i] = -left;
      upper[i] = -right;
      diagonal[i] = inertia + left + right + outside;
      rhs[i] = inertia * temperature[i] + outside * surroundingC;
    }
    const next = solveTridiagonal(lower, diagonal, upper, rhs);
    for (let i = 0; i < n; i += 1) {
      temperature[i] = next[i];
      if (next[i] > peak[i]) peak[i] = next[i];
    }
    centerHistory.push([(s + 1) * o.stepS, next[0]]);
  }
  return { yolkRadius, radius, centers, peak, yolkNodes: o.yolkNodes, centerHistory };
}

// Thickness (m) of the outer yolk layer whose peak temperature reached thresholdC.
export function coronaThickness(result, thresholdC) {
  const { centers, peak, yolkNodes, yolkRadius } = result;
  for (let i = 0; i < yolkNodes; i += 1) {
    if (peak[i] >= thresholdC) {
      if (i === 0) return yolkRadius;
      const r = centers[i - 1] + ((thresholdC - peak[i - 1]) * (centers[i] - centers[i - 1])) / (peak[i] - peak[i - 1]);
      return yolkRadius - r;
    }
  }
  return 0;
}

export function solveCookTime(metric, target, options, low = 60, high = 3600) {
  let lo = low;
  let hi = high;
  const below = metric(simulate({ ...options, cookS: lo })) < target;
  for (let k = 0; k < 40 && hi - lo > 0.05; k += 1) {
    const mid = 0.5 * (lo + hi);
    if ((metric(simulate({ ...options, cookS: mid })) < target) === below) lo = mid;
    else hi = mid;
  }
  return 0.5 * (lo + hi);
}

// Yolk gelation threshold calibrated on the user's tasting anchor (88.5 C x 7:30, 60 g, 5 C).
export const GEL_THRESHOLD_C = 65;
const ANCHOR = { massG: 60, initialC: 5, bathC: 88.5, cookS: 450 };

function heatUpTime(massG, initialC, bathC) {
  const { centerHistory } = simulate({ massG, initialC, bathC, cookS: 3600, iceS: 0 });
  const target = bathC - 2;
  for (let i = 1; i < centerHistory.length; i += 1) {
    if (centerHistory[i][1] >= target) {
      const [t0, y0] = centerHistory[i - 1];
      const [t1, y1] = centerHistory[i];
      return t0 + ((target - y0) * (t1 - t0)) / (y1 - y0);
    }
  }
  return Number.NaN;
}

export function profileDefinitions() {
  const anchorCorona = coronaThickness(simulate(ANCHOR), GEL_THRESHOLD_C);
  const centerPeak = (result) => result.peak[0];
  const corona = (result) => coronaThickness(result, GEL_THRESHOLD_C);
  const byCenterPeak = (bathC, offset) => (massG, initialC) => solveCookTime(centerPeak, GEL_THRESHOLD_C + offset, { massG, initialC, bathC }, 300, 1500);
  return [
    { id: "1", bathC: 68.5, time: (massG, initialC) => 1860 + heatUpTime(massG, initialC, 68.5) - heatUpTime(60, 5, 68.5) },
    { id: "2", bathC: 79, time: byCenterPeak(79, -1) },
    { id: "3", bathC: 83, time: byCenterPeak(83, 1) },
    { id: "4", bathC: 88.5, time: (massG, initialC) => solveCookTime(corona, anchorCorona, { massG, initialC, bathC: 88.5 }, 250, 900) },
    { id: "5", bathC: 90, time: byCenterPeak(90, 3) },
  ];
}

// Least squares fit of ln t = a + p ln(m / 60) + q (5 - T0).
export function fitScaling(points) {
  const s = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  const v = [0, 0, 0];
  for (const { massG, initialC, seconds } of points) {
    const x = [1, Math.log(massG / 60), 5 - initialC];
    for (let i = 0; i < 3; i += 1) {
      v[i] += x[i] * Math.log(seconds);
      for (let j = 0; j < 3; j += 1) s[i][j] += x[i] * x[j];
    }
  }
  const det = (m) => m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) - m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) + m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);
  const d = det(s);
  const [a, p, q] = [0, 1, 2].map((k) => det(s.map((row, i) => row.map((value, j) => (j === k ? v[i] : value)))) / d);
  return { referenceSeconds: Math.exp(a), p, q };
}

function main() {
  const anchor = simulate(ANCHOR);
  console.log(`Anchor 88.5 C x 7:30 (60 g, 5 C): corona ${(coronaThickness(anchor, GEL_THRESHOLD_C) * 1000).toFixed(2)} mm, yolk centre peak ${anchor.peak[0].toFixed(1)} C`);
  for (const profile of profileDefinitions()) {
    const points = [];
    for (const massG of [45, 52.5, 60, 67.5, 75]) {
      for (const initialC of [0, 4, 8]) points.push({ massG, initialC, seconds: profile.time(massG, initialC) });
    }
    const fit = fitScaling(points);
    const maxError = Math.max(...points.map((pt) => Math.abs(fit.referenceSeconds * (pt.massG / 60) ** fit.p * Math.exp(fit.q * (5 - pt.initialC)) - pt.seconds)));
    console.log(`Profile ${profile.id} (${profile.bathC} C): t_ref ${fit.referenceSeconds.toFixed(1)} s, p ${fit.p.toFixed(3)}, q ${fit.q.toFixed(4)} /C, max fit error ${maxError.toFixed(1)} s`);
  }
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
