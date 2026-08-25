export type RecentItemKind = "recipe" | "guide";

export type RecentItem = {
  kind: RecentItemKind;
  slug: string;
  visitedAt: number;
};

export const STORAGE_KEY = "danio-cooks:recent-items";
export const MAX_RECENT_ITEMS = 10;

function isRecentItem(value: unknown): value is RecentItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return (
    (candidate.kind === "recipe" || candidate.kind === "guide") &&
    typeof candidate.slug === "string" &&
    candidate.slug.length > 0 &&
    typeof candidate.visitedAt === "number" &&
    Number.isFinite(candidate.visitedAt)
  );
}

/**
 * Parsifica una stringa raw (o `null`) proveniente da localStorage in un
 * elenco di RecentItem, tollerando dati mancanti, corrotti o scritti da una
 * versione precedente del formato: in ogni caso diverso da un array di
 * RecentItem validi restituisce semplicemente un array vuoto. Il risultato e'
 * sempre ordinato per `visitedAt` decrescente (piu' recente prima),
 * indipendentemente dall'ordine in cui le voci sono state scritte in storage, e
 * limitato a MAX_RECENT_ITEMS voci.
 */
export function parseRecentItemsRaw(raw: string | null): RecentItem[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(isRecentItem)
      .sort((a, b) => b.visitedAt - a.visitedAt)
      .slice(0, MAX_RECENT_ITEMS);
  } catch {
    return [];
  }
}

/**
 * Legge l'elenco delle visite recenti da localStorage. Vedi
 * `parseRecentItemsRaw` per la logica di tolleranza a dati mancanti/corrotti.
 */
export function readRecentItems(): RecentItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseRecentItemsRaw(getRecentItemsRawSafe());
}

/**
 * Legge la stringa raw da localStorage in modo resiliente: restituisce
 * `null` sia quando la chiave non esiste sia quando l'accesso a localStorage
 * stesso lancia (es. navigazione privata di Safari, storage disabilitato da
 * policy, quota/permessi). Va usata ovunque si legga il valore grezzo, in
 * particolare come snapshot per useSyncExternalStore, dove un'eccezione non
 * gestita farebbe fallire il render.
 */
export function getRecentItemsRawSafe(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeRecentItems(items: RecentItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage non disponibile (navigazione privata, quota superata, ecc.): ignora silenziosamente.
  }
}

/**
 * Registra la visita di una ricetta o guida: rimuove eventuali voci precedenti
 * per lo stesso slug/kind cosi' da evitare duplicati, poi la reinserisce in
 * cima all'elenco (piu' recente prima) e mantiene al massimo MAX_RECENT_ITEMS voci.
 */
export function recordRecentVisit(kind: RecentItemKind, slug: string): RecentItem[] {
  if (typeof window === "undefined" || !slug) {
    return [];
  }

  const existing = readRecentItems().filter((item) => !(item.kind === kind && item.slug === slug));
  const next = [{ kind, slug, visitedAt: Date.now() }, ...existing].slice(0, MAX_RECENT_ITEMS);
  writeRecentItems(next);
  return next;
}
