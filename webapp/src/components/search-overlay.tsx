"use client";

import { Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useRef, useState } from "react";

type SearchOverlayProps = {
  open: boolean;
  onClose: () => void;
};

export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
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
    onClose();
    router.push(normalizedQuery ? `/?q=${encodeURIComponent(normalizedQuery)}#esplora` : "/#esplora");
  }

  if (!open) {
    return null;
  }

  return (
    <div className="search-overlay" role="dialog" aria-modal="true" aria-labelledby="search-overlay-title">
      <button className="search-overlay-backdrop" type="button" onClick={onClose} aria-label="Chiudi ricerca" />
      <form className="search-dialog" onSubmit={submitSearch}>
        <div className="search-dialog-heading">
          <div>
            <p className="eyebrow">Ricettario</p>
            <h2 id="search-overlay-title">Cerca una ricetta</h2>
          </div>
          <button className="dialog-close" type="button" onClick={onClose} aria-label="Chiudi ricerca">
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <label className="search-field search-dialog-input">
          <Search size={20} aria-hidden="true" />
          <span className="sr-only">Parole chiave della ricetta</span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Ingrediente, tecnica o ricetta"
          />
        </label>
        <button className="search-submit" type="submit">Mostra ricette</button>
      </form>
    </div>
  );
}