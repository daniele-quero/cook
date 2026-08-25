"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { GuideSummary } from "@/lib/guides";
import type { RecipeSummary } from "@/lib/recipes";
import { getRecentItemsRawSafe, parseRecentItemsRaw } from "@/lib/recent-items";
import { RecentGrid, type RecentCardEntry } from "@/components/recent-grid";

type RecentBrowserProps = {
  recipes: RecipeSummary[];
  guides: GuideSummary[];
};

function subscribeToRecentItemsStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  // Copre l'aggiornamento cross-tab (evento "storage" nativo del browser);
  // la visita registrata nella stessa tab avviene su un'altra pagina
  // (dettaglio ricetta/guida), quindi non serve un canale aggiuntivo qui.
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getRecentItemsServerRaw() {
  return null;
}

function noopSubscribe() {
  return () => {};
}

function getIsClientSnapshot() {
  return true;
}

function getIsClientServerSnapshot() {
  return false;
}

/**
 * Rileva in modo idiomatico (via useSyncExternalStore, non un setState in
 * useEffect) quando siamo oltre l'hydration: il valore differisce sempre tra
 * server (`false`) e client (`true`), cosi' React garantisce un secondo
 * render sul client anche se il contenuto di localStorage e' vuoto (nel qual
 * caso `raw` resterebbe `null` sia prima che dopo il mount).
 */
function useIsHydrated() {
  return useSyncExternalStore(noopSubscribe, getIsClientSnapshot, getIsClientServerSnapshot);
}

export function RecentBrowser({ recipes, guides }: RecentBrowserProps) {
  const isHydrated = useIsHydrated();

  // localStorage e' un "external store" letto in modo idiomatico con
  // useSyncExternalStore invece che con un setState dentro un useEffect:
  // durante SSR/hydration restituisce `null` (nessun mismatch), poi React
  // ri-esegue il render sul client con il contenuto reale non appena montato
  // o quando un altro tab modifica la stessa chiave di storage.
  const raw = useSyncExternalStore(subscribeToRecentItemsStorage, getRecentItemsRawSafe, getRecentItemsServerRaw);

  // `null` = non ancora montati sul client (SSR e primo render client
  // coincidono per evitare un mismatch di hydration); dopo il mount, anche se
  // il contenuto di localStorage e' vuoto, viene risolto in un array (che puo'
  // essere vuoto).
  const entries = useMemo<RecentCardEntry[] | null>(() => {
    if (!isHydrated) {
      return null;
    }

    const recipeBySlug = new Map(recipes.map((recipe) => [recipe.slug, recipe]));
    const guideBySlug = new Map(guides.map((guide) => [guide.slug, guide]));

    return parseRecentItemsRaw(raw).reduce<RecentCardEntry[]>((acc, item) => {
      if (item.kind === "recipe") {
        const recipe = recipeBySlug.get(item.slug);
        if (recipe) {
          acc.push({ kind: "recipe", visitedAt: item.visitedAt, recipe });
        }
        return acc;
      }

      const guide = guideBySlug.get(item.slug);
      if (guide) {
        acc.push({ kind: "guide", visitedAt: item.visitedAt, guide });
      }
      return acc;
    }, []);
  }, [isHydrated, raw, recipes, guides]);

  return (
    <section id="recenti" className="recent-section" aria-live="polite" aria-labelledby="recent-list-heading">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Cronologia personale</p>
          <h2 id="recent-list-heading">Recenti</h2>
        </div>
        {entries && entries.length ? (
          <span>{entries.length} {entries.length === 1 ? "elemento" : "elementi"}</span>
        ) : null}
      </div>
      <p className="recent-intro">
        Le ultime ricette e guide che hai aperto su questo dispositivo, dalla più recente: l&apos;elenco si aggiorna
        da solo e mostra al massimo le ultime dieci visite.
      </p>

      {entries === null ? (
        <p className="recent-loading">Caricamento delle visite recenti…</p>
      ) : (
        <RecentGrid entries={entries} />
      )}
    </section>
  );
}
