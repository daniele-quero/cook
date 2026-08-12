"use client";

import { Table2 } from "lucide-react";
import { useRef, useSyncExternalStore } from "react";

import { useIsScrolling } from "@/lib/use-is-scrolling";

const tableSelector = "article.markdown-content table";

function subscribeToMount() {
  return () => {};
}

function getClientSnapshot() {
  return true;
}

function getServerSnapshot() {
  return false;
}

export function TableJumpButton() {
  const nextTableIndexRef = useRef(0);
  const hasMounted = useSyncExternalStore(subscribeToMount, getClientSnapshot, getServerSnapshot);
  const tableCount = hasMounted ? document.querySelectorAll<HTMLTableElement>(tableSelector).length : 0;
  const isScrolling = useIsScrolling();

  function jumpToNextTable() {
    const tables = Array.from(document.querySelectorAll<HTMLTableElement>(tableSelector));
    if (tables.length === 0) return;

    const table = tables[nextTableIndexRef.current];
    const target = table.closest<HTMLElement>(".table-scroll") ?? table;
    target.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
    nextTableIndexRef.current = (nextTableIndexRef.current + 1) % tables.length;
  }

  if (tableCount === 0) return null;

  const tableLabel = tableCount === 1 ? "tabella" : "tabelle";

  return (
    <button
      className={`recipe-table-trigger${isScrolling ? " is-scrolling" : ""}`}
      type="button"
      aria-label={`Vai alla tabella successiva (${tableCount} ${tableLabel})`}
      title="Vai alla tabella successiva"
      onClick={jumpToNextTable}
    >
      <span aria-hidden="true">{tableCount}</span>
      <Table2 size={18} aria-hidden="true" />
    </button>
  );
}