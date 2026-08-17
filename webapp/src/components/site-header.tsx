"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Search, Settings2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchOverlay } from "@/components/search-overlay";

export function SiteHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<"home" | "ricettario">("home");
  const pathname = usePathname();

  useEffect(() => {
    const updateActiveNav = () => {
      const hash = window.location.hash;
      setActiveNav(hash === "#esplora" || hash === "#cerca" ? "ricettario" : "home");
    };

    updateActiveNav();
    window.addEventListener("hashchange", updateActiveNav);

    return () => window.removeEventListener("hashchange", updateActiveNav);
  }, []);

  const isHome = pathname === "/" && activeNav === "home";
  const isRicettario = pathname === "/" && activeNav === "ricettario";

  return (
    <>
      <aside className="desktop-rail">
        <Link className="brand" href="/" aria-label="Danio Cooks, pagina principale">
          <Image src="/logo-mark.png" alt="" width={44} height={44} priority />
          <span>Danio Cooks</span>
        </Link>
        <nav className="rail-nav" aria-label="Navigazione principale">
          <Link className={isHome ? "nav-active" : ""} href="/#mi-chiamo-danio">
            <Sparkles size={19} aria-hidden="true" />
            Home
          </Link>
          <Link className={isRicettario ? "nav-active" : ""} href="/#esplora">
            <BookOpenText size={19} aria-hidden="true" />
            Ricettario
          </Link>
          <button type="button" onClick={() => setIsSearchOpen(true)}>
            <Search size={19} aria-hidden="true" />
            Cerca
          </button>
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
        <Link className={isHome ? "nav-active" : ""} href="/#mi-chiamo-danio">
          <Sparkles size={19} aria-hidden="true" />
          <span>Home</span>
        </Link>
        <Link className={isRicettario ? "nav-active" : ""} href="/#esplora">
          <BookOpenText size={19} aria-hidden="true" />
          <span>Ricettario</span>
        </Link>
        <button type="button" onClick={() => setIsSearchOpen(true)}>
          <Search size={19} aria-hidden="true" />
          <span>Cerca</span>
        </button>
      </nav>
      <SearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}