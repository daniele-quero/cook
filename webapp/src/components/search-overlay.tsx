"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";
import { Tooltip } from "@/components/tooltip";

export type SearchScope = "recipe" | "guide";

type SearchOverlayProps = {
  open: boolean;
  onClose: () => void;
  scope?: SearchScope;
  onScopeChange?: (scope: SearchScope) => void;
};

export function SearchOverlay({ open, onClose, scope = "recipe", onScopeChange }: SearchOverlayProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [onClose, open]);

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedQuery = query.trim();
    const targetPath = scope === "guide" ? "/guides" : "/";
    const path = normalizedQuery ? `${targetPath}?q=${encodeURIComponent(normalizedQuery)}` : targetPath;
    onClose();
    router.push(`${path}#esplora`);
  }

  if (!open) {
    return null;
  }

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-labelledby="search-overlay-title">
      <Tooltip content="Chiudi la ricerca e torna alla pagina precedente.">
        <button className="search-overlay-backdrop" type="button" onClick={onClose} aria-label="Chiudi ricerca" />
      </Tooltip>
      <form className="search-dialog" onSubmit={submitSearch}>
        <div className="search-dialog-heading">
          <div>
            <p className="eyebrow">{scope === "guide" ? "Guide tematiche" : "Ricettario"}</p>
            <h2 id="search-overlay-title">{scope === "guide" ? "Cerca una guida" : "Cerca una ricetta"}</h2>
          </div>
          <Tooltip content="Chiudi la ricerca senza applicare una nuova query.">
            <button className="dialog-close" type="button" onClick={onClose} aria-label="Chiudi ricerca">
              <X size={20} aria-hidden="true" />
            </button>
          </Tooltip>
        </div>

        <div className="search-scope" role="radiogroup" aria-label="Scegli dove cercare">
          <Tooltip content="Cerca tra ricette, ingredienti e tecniche applicate ai piatti.">
            <label className={scope === "recipe" ? "search-scope-option is-selected" : "search-scope-option"}>
              <input
                type="radio"
                name="search-scope"
                checked={scope === "recipe"}
                onChange={() => onScopeChange?.("recipe")}
              />
              <span>Ricette</span>
            </label>
          </Tooltip>
          <Tooltip content="Cerca tra guide tematiche, tecniche e principi di cucina.">
            <label className={scope === "guide" ? "search-scope-option is-selected" : "search-scope-option"}>
              <input
                type="radio"
                name="search-scope"
                checked={scope === "guide"}
                onChange={() => onScopeChange?.("guide")}
              />
              <span>Guide tematiche</span>
            </label>
          </Tooltip>
        </div>

        <Tooltip content="Inserisci una parola chiave: la ricerca trova anche tecniche e ingredienti correlati.">
          <label className="search-field search-dialog-input">
            <Search size={20} aria-hidden="true" />
            <span className="sr-only">{scope === "guide" ? "Parole chiave della guida" : "Parole chiave della ricetta"}</span>
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={scope === "guide" ? "Tecnica, ingrediente o tema" : "Ingrediente, tecnica o ricetta"}
            />
          </label>
        </Tooltip>
        <Tooltip content="Applica la ricerca e mostra i risultati della sezione scelta.">
          <button className="search-submit" type="submit">{scope === "guide" ? "Mostra guide" : "Mostra ricette"}</button>
        </Tooltip>
      </form>
    </div>
  );
}