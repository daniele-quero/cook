"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Menu, Search, Settings2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchOverlay, type SearchScope } from "@/components/search-overlay";
import { Tooltip } from "@/components/tooltip";

const supportLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Cookie", href: "/cookie" },
  { label: "Termini d'uso", href: "/termini" },
  { label: "Supporto", href: "/supporto" },
];

const infoLinks = [
  { label: "Chi sono / Metodologia", href: "/supporto#chi-siamo" },
  { label: "FAQ", href: "/faq" },
  { label: "Istruzioni", href: "/istruzioni" },
];

const footerLinks = [...supportLinks, { label: "Chi sono", href: "/supporto#chi-siamo" }];

export function SiteHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const pathname = usePathname();
  const [activeNav, setActiveNav] = useState<"home" | "ricettario" | "guide">("home");
  const [searchScope, setSearchScope] = useState<SearchScope>(() => pathname.startsWith("/guides") ? "guide" : "recipe");
  const activeSearchScope: SearchScope = pathname.startsWith("/guides") ? "guide" : searchScope;

  useEffect(() => {
    const updateActiveNav = () => {
      if (pathname.startsWith("/guides")) {
        setActiveNav("guide");
        return;
      }
      const hash = typeof window !== "undefined" ? window.location.hash : "";
      setActiveNav(pathname === "/" && (hash === "#esplora" || hash === "#cerca") ? "ricettario" : "home");
    };

    updateActiveNav();
    window.addEventListener("hashchange", updateActiveNav);
    window.addEventListener("popstate", updateActiveNav);
    return () => {
      window.removeEventListener("hashchange", updateActiveNav);
      window.removeEventListener("popstate", updateActiveNav);
    };
  }, [pathname]);

  const closeDrawer = () => setIsDrawerOpen(false);
  const selectNav = (nextNav: "home" | "ricettario" | "guide") => {
    setActiveNav(nextNav);
    closeDrawer();
  };
  const openSearch = (nextScope = activeSearchScope) => {
    setSearchScope(nextScope);
    setIsSearchOpen(true);
    closeDrawer();
  };

  const isHome = pathname === "/" && activeNav === "home";
  const isRicettario = pathname === "/" && activeNav === "ricettario";
  const isGuide = pathname.startsWith("/guides") || activeNav === "guide";

  return (
    <>
      <aside className="desktop-rail">
        <Link className="brand" href="/" aria-label="Danio Cooks, pagina principale">
          <Image src="/logo-mark.png" alt="" width={44} height={44} priority />
          <span>Danio Cooks</span>
        </Link>
        <nav className="rail-nav" aria-label="Navigazione principale">
          <Tooltip content="Torna alla pagina principale e alla presentazione di Danio Cooks.">
            <Link className={isHome ? "nav-active" : ""} href="/#mi-chiamo-danio" onClick={() => setActiveNav("home")}>
              <Sparkles size={19} aria-hidden="true" />
              Home
            </Link>
          </Tooltip>
          <Tooltip content="Apri il ricettario e sfoglia tutte le ricette disponibili.">
            <Link className={isRicettario ? "nav-active" : ""} href="/#esplora" onClick={() => setActiveNav("ricettario")}>
              <BookOpenText size={19} aria-hidden="true" />
              Ricettario
            </Link>
          </Tooltip>
          <Tooltip content="Esplora le guide tematiche su tecniche, strumenti e principi di cucina.">
            <Link className={isGuide ? "nav-active" : ""} href="/guides" onClick={() => setActiveNav("guide")}>
              <BookOpenText size={19} aria-hidden="true" />
              Guide
            </Link>
          </Tooltip>
          <Tooltip content="Apri la ricerca per trovare rapidamente ricette o guide.">
            <button type="button" onClick={() => openSearch(searchScope)} aria-label="Apri ricerca">
              <Search size={19} aria-hidden="true" />
              Cerca
            </button>
          </Tooltip>
        </nav>

        <div className="rail-section" aria-label="Link utili">
          <p className="rail-section-label">Supporto</p>
          {supportLinks.map((link) => (
            <Tooltip key={link.href} content={`Apri la pagina ${link.label}.`}>
              <Link className="rail-link" href={link.href}>{link.label}</Link>
            </Tooltip>
          ))}
        </div>

        <div className="rail-section" aria-label="Pagina di contenuto">
          <p className="rail-section-label">Metodologia</p>
          {infoLinks.map((link) => (
            <Tooltip key={link.href} content={`Apri la pagina ${link.label}.`}>
              <Link className="rail-link" href={link.href}>{link.label}</Link>
            </Tooltip>
          ))}
        </div>

        <Tooltip content="Apri le impostazioni disponibili per il sito.">
          <a className="rail-settings" href="#impostazioni">
            <Settings2 size={18} aria-hidden="true" />
            Impostazioni
          </a>
        </Tooltip>
      </aside>

      <header className="site-header">
        <Link className="brand" href="/" aria-label="Danio Cooks, pagina principale">
          <Image src="/logo-mark.png" alt="" width={44} height={44} priority />
          <span>Danio Cooks</span>
        </Link>
        <div className="header-actions">
          <Tooltip content="Apri la ricerca di ricette o guide.">
            <button className="header-search" type="button" onClick={() => openSearch()} aria-label="Apri ricerca">
              <Search size={19} aria-hidden="true" />
            </button>
          </Tooltip>
          <Tooltip content="Apri il menu con la navigazione, il supporto e i link legali.">
            <button
              className="header-menu"
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              aria-label="Apri menu"
              aria-expanded={isDrawerOpen}
            >
              <Menu size={20} aria-hidden="true" />
            </button>
          </Tooltip>
        </div>
      </header>

      <div
        className={`mobile-drawer-backdrop ${isDrawerOpen ? "is-open" : ""}`}
        aria-hidden={!isDrawerOpen}
        onClick={closeDrawer}
      />

      <aside className={`mobile-drawer ${isDrawerOpen ? "is-open" : ""}`} aria-label="Menu di navigazione">
        <div className="mobile-drawer-header">
          <Link className="brand" href="/" aria-label="Danio Cooks, pagina principale" onClick={closeDrawer}>
            <Image src="/logo-mark.png" alt="" width={44} height={44} priority />
            <span>Danio Cooks</span>
          </Link>
          <Tooltip content="Chiudi il menu e torna alla pagina senza cambiare sezione.">
            <button className="drawer-close" type="button" onClick={closeDrawer} aria-label="Chiudi il menu">
              <X size={20} aria-hidden="true" />
            </button>
          </Tooltip>
        </div>

        <nav className="drawer-nav" aria-label="Navigazione mobile">
          <Tooltip content="Torna alla pagina principale e alla sua presentazione.">
            <Link className={isHome ? "nav-active" : ""} href="/#mi-chiamo-danio" onClick={() => selectNav("home")}>
              <Sparkles size={19} aria-hidden="true" />
              <span>Home</span>
            </Link>
          </Tooltip>
          <Tooltip content="Apri il ricettario e sfoglia tutte le ricette.">
            <Link className={isRicettario ? "nav-active" : ""} href="/#esplora" onClick={() => selectNav("ricettario")}>
              <BookOpenText size={19} aria-hidden="true" />
              <span>Ricettario</span>
            </Link>
          </Tooltip>
          <Tooltip content="Esplora le guide tematiche di cucina.">
            <Link className={isGuide ? "nav-active" : ""} href="/guides" onClick={() => selectNav("guide")}>
              <BookOpenText size={19} aria-hidden="true" />
              <span>Guide</span>
            </Link>
          </Tooltip>
          <Tooltip content="Apri la ricerca per trovare ricette o guide.">
            <button type="button" onClick={() => openSearch()}>
              <Search size={19} aria-hidden="true" />
              <span>Cerca</span>
            </button>
          </Tooltip>

          <div className="drawer-section">
            <p className="drawer-section-label">Supporto</p>
            {supportLinks.map((link) => (
              <Tooltip key={link.href} content={`Apri la pagina ${link.label}.`}>
                <Link href={link.href} onClick={closeDrawer}>{link.label}</Link>
              </Tooltip>
            ))}
          </div>

          <div className="drawer-section">
            <p className="drawer-section-label">Metodologia</p>
            {infoLinks.map((link) => (
              <Tooltip key={link.href} content={`Apri la pagina ${link.label}.`}>
                <Link href={link.href} onClick={closeDrawer}>{link.label}</Link>
              </Tooltip>
            ))}
          </div>

          <div className="drawer-section">
            <p className="drawer-section-label">Altro</p>
            {footerLinks.map((link) => (
              <Tooltip key={link.href} content={`Apri la pagina ${link.label}.`}>
                <Link href={link.href} onClick={closeDrawer}>{link.label}</Link>
              </Tooltip>
            ))}
          </div>
        </nav>
      </aside>

      <nav className={`mobile-nav ${isDrawerOpen ? "is-hidden" : ""}`} aria-label="Navigazione mobile">
        <Tooltip content="Torna alla pagina principale.">
          <Link className={isHome ? "nav-active" : ""} href="/#mi-chiamo-danio" onClick={() => setActiveNav("home")}>
            <Sparkles size={19} aria-hidden="true" />
            <span>Home</span>
          </Link>
        </Tooltip>
        <Tooltip content="Apri il ricettario e sfoglia tutte le ricette.">
          <Link className={isRicettario ? "nav-active" : ""} href="/#esplora" onClick={() => setActiveNav("ricettario")}>
            <BookOpenText size={19} aria-hidden="true" />
            <span>Ricettario</span>
          </Link>
        </Tooltip>
        <Tooltip content="Esplora le guide tematiche di cucina.">
          <Link className={isGuide ? "nav-active" : ""} href="/guides" onClick={() => setActiveNav("guide")}>
            <BookOpenText size={19} aria-hidden="true" />
            <span>Guide</span>
          </Link>
        </Tooltip>
        <Tooltip content="Apri la ricerca per trovare ricette o guide.">
          <button type="button" onClick={() => openSearch()}>
            <Search size={19} aria-hidden="true" />
            <span>Cerca</span>
          </button>
        </Tooltip>
      </nav>
      <SearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} scope={activeSearchScope} onScopeChange={setSearchScope} />
    </>
  );
}
