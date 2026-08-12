"use client";

import { useEffect } from "react";

export function PwaRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || process.env.NEXT_PUBLIC_PLAYWRIGHT_TEST === "1" || !("serviceWorker" in navigator)) {
      return;
    }

    navigator.serviceWorker.register("/sw.js").catch((error: unknown) => {
      console.error("Impossibile registrare il service worker", error);
    });
  }, []);

  return null;
}