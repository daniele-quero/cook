"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, Menu, Search, Settings2, Sparkles, X } from "lucide-react";
import { useEffect, useState } from "react";
import { SearchOverlay } from "@/components/search-overlay";

const supportLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Cookie", href: "/cookie" },
  { label: "Termini d'uso", href: "/termini" },
  { label: "Supporto", href: "/supporto" },
];

const infoLinks = [
  { label: "Chi siamo / Metodologia", href: "/supporto#chi-siamo" },
  { label: "FAQ", href: "/faq" },
  { label: "Istruzioni", href: "/istruzioni" },
];

const footerLinks = [...supportLinks, { label: "Chi sono", href: "/supporto#chi-siamo" }];

export function SiteHeader() {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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

  const closeDrawer = () => setIsDrawerOpen(false);
  const openSearch = () => {
    setIsSearchOpen(true);
    closeDrawer();
  };

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
          <button type="button" onClick={openSearch} aria-label="Apri ricerca">
            <Search size={19} aria-hidden="true" />
            Cerca
          </button>
        </nav>

        <div className="rail-section" aria-label="Link utili">
          <p className="rail-section-label">Supporto</p>
          {supportLinks.map((link) => (
            <Link key={link.href} className="rail-link" href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="rail-section" aria-label="Pagina di contenuto">
          <p className="rail-section-label">Metodologia</p>
          {infoLinks.map((link) => (
            <Link key={link.href} className="rail-link" href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>

        <div className="rail-section rail-footer-links" aria-label="Link footer">
          <p className="rail-section-label">Altro</p>
          {footerLinks.map((link) => (
            <Link key={link.href} className="rail-link" href={link.href}>
              {link.label}
            </Link>
          ))}
        </div>

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
        <div className="header-actions">
          <button className="header-search" type="button" onClick={openSearch} aria-label="Apri ricerca">
            <Search size={19} aria-hidden="true" />
          </button>
          <button
            className="header-menu"
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            aria-label="Apri menu"
            aria-expanded={isDrawerOpen}
          >
            <Menu size={20} aria-hidden="true" />
          </button>
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
          <button className="drawer-close" type="button" onClick={closeDrawer} aria-label="Chiudi il menu">
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <nav className="drawer-nav" aria-label="Navigazione mobile">
          <Link className={isHome ? "nav-active" : ""} href="/#mi-chiamo-danio" onClick={closeDrawer}>
            <Sparkles size={19} aria-hidden="true" />
            <span>Home</span>
          </Link>
          <Link className={isRicettario ? "nav-active" : ""} href="/#esplora" onClick={closeDrawer}>
            <BookOpenText size={19} aria-hidden="true" />
            <span>Ricettario</span>
          </Link>
          <button type="button" onClick={openSearch}>
            <Search size={19} aria-hidden="true" />
            <span>Cerca</span>
          </button>

          <div className="drawer-section">
            <p className="drawer-section-label">Supporto</p>
            {supportLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={closeDrawer}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="drawer-section">
            <p className="drawer-section-label">Metodologia</p>
            {infoLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={closeDrawer}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="drawer-section">
            <p className="drawer-section-label">Altro</p>
            {footerLinks.map((link) => (
              <Link key={link.href} href={link.href} onClick={closeDrawer}>
                {link.label}
              </Link>
            ))}
          </div>
        </nav>
      </aside>

      <nav className={`mobile-nav ${isDrawerOpen ? "is-hidden" : ""}`} aria-label="Navigazione mobile">
        <Link className={isHome ? "nav-active" : ""} href="/#mi-chiamo-danio">
          <Sparkles size={19} aria-hidden="true" />
          <span>Home</span>
        </Link>
        <Link className={isRicettario ? "nav-active" : ""} href="/#esplora">
          <BookOpenText size={19} aria-hidden="true" />
          <span>Ricettario</span>
        </Link>
        <button type="button" onClick={openSearch}>
          <Search size={19} aria-hidden="true" />
          <span>Cerca</span>
        </button>
      </nav>
      <SearchOverlay open={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}

