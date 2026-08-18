"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useEffect, useState } from "react";

const SCROLL_THRESHOLD_PX = 200;

export function HomeMethodologyCta() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsVisible(window.scrollY >= SCROLL_THRESHOLD_PX);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <Link
      className={`home-methodology-cta${isVisible ? " is-visible" : ""}`}
      href="/supporto#chi-siamo"
      aria-label="Scopri chi sono e la metodologia"
      title="Chi sono / Metodologia"
    >
      <span>Chi sono / Metodologia</span>
      <ArrowUpRight size={16} aria-hidden="true" />
    </Link>
  );
}
