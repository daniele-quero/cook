"use client";

import { useEffect } from "react";
import { recordRecentVisit, type RecentItemKind } from "@/lib/recent-items";

type RecordRecentVisitProps = {
  kind: RecentItemKind;
  slug: string;
};

/**
 * Componente invisibile montato nelle pagine di dettaglio ricetta/guida: al mount
 * registra la visita in localStorage cosi' che compaia nella sezione "Recenti".
 */
export function RecordRecentVisit({ kind, slug }: RecordRecentVisitProps) {
  useEffect(() => {
    recordRecentVisit(kind, slug);
  }, [kind, slug]);

  return null;
}
