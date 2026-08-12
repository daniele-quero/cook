"use client";

import { useEffect, useState } from "react";

/**
 * Traccia se la pagina sta attualmente scrollando. Torna a `false` dopo
 * `idleDelayMs` millisecondi senza nuovi eventi `scroll` su `window`.
 */
export function useIsScrolling(idleDelayMs = 180): boolean {
  const [isScrolling, setIsScrolling] = useState(false);

  useEffect(() => {
    let idleTimeoutId: ReturnType<typeof setTimeout> | undefined;

    function handleScroll() {
      setIsScrolling(true);
      if (idleTimeoutId) clearTimeout(idleTimeoutId);
      idleTimeoutId = setTimeout(() => setIsScrolling(false), idleDelayMs);
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (idleTimeoutId) clearTimeout(idleTimeoutId);
    };
  }, [idleDelayMs]);

  return isScrolling;
}
