"use client";

import Image from "next/image";
import Link from "next/link";
import { BookOpenText, Search, Settings2, Sparkles } from "lucide-react";
import { useState } from "react";
import { SearchOverlay } from "@/components/search-overlay";

export function SiteHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <>
      <aside className="desktop-rail">
        <Link className="brand" href="/" aria-label="Danio Cooks, pagina principale">
          <Image src="/logo-mark.png" alt="" width={44} height={44} priority />
          <span>Danio Cooks</span>
        </Link>
        <nav className="rail-nav" aria-label="Navigazione principale">
          <Link className="nav-active" href="/">
            <BookOpenText size={19} aria-hidden="true" />
            Ricettario
          </Link>
          <button type="button" onClick={() => setIsSearchOpen(true)}>
            <Search size={19} aria-hidden="true" />
            Cerca
          </button>
          <Link href="/#esplora">
            <Sparkles size={19} aria-hidden="true" />
            Esplora
          </Link>
        </nav>
        <a className="rail-settings" href="#impostazioni">
          <Settings2 size={18} aria-hidden="true" />
          Impostazioni
        </a>
      </aside>

      <header className="site-header">
        <Link className="brand" href="/" aria-label="Danio Cooks, pagina principale">
          <Image src="/logo-mark.png" alt="" width={44} height={44} priority />
          <span>Danio Cooks</span>
        </Link>
        <button className="header-search" type="button" onClick={() => setIsSearchOpen(true)} aria-label="Apri ricerca">
          <Search size={19} aria-hidden="true" />
        </button>
      </header>

      <nav className="mobile-nav" aria-label="Navigazione mobile">
        <Link className="nav-active" href="/">
          <BookOpenText size={19} aria-hidden="true" />
          <span>Ricette</span>
        </Link>
        <button type="button" onClick={() => setIsSearchOpen(true)}>
          <Search size={19} aria-hidden="true" />
          <span>Cerca</span>
        </button>
        <Link href="/#esplora">
          <Sparkles size={19} aria-hidden="true" />
          <span>Esplora</span>
        </Link>
      </nav>
      <SearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}