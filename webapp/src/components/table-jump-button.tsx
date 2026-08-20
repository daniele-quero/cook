"use client";

import { Table } from "lucide-react";
import { useRef, useSyncExternalStore } from "react";

import { useIsScrolling } from "@/lib/use-is-scrolling";
import { Tooltip } from "@/components/tooltip";

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
    const scrollMarginTop = Number.parseFloat(window.getComputedStyle(target).scrollMarginTop) || 0;
    const targetTop = target.getBoundingClientRect().top + window.scrollY - scrollMarginTop;
    window.scrollTo({ top: Math.max(0, targetTop), behavior: "smooth" });
    nextTableIndexRef.current = (nextTableIndexRef.current + 1) % tables.length;
  }

  if (tableCount === 0) return null;

  const tableLabel = tableCount === 1 ? "tabella" : "tabelle";

  return (
    <Tooltip content="Scorri alla tabella successiva del documento. Dopo l’ultima tabella, il pulsante riparte dalla prima.">
      <button
        className={`recipe-table-trigger${isScrolling ? " is-scrolling" : ""}`}
        type="button"
        aria-label={`Vai alla tabella successiva (${tableCount} ${tableLabel})`}
        onClick={jumpToNextTable}
      >
        <span aria-hidden="true">{tableCount}</span>
        <Table size={18} aria-hidden="true" />
      </button>
    </Tooltip>
  );
}