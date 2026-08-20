"use client";

import { cloneElement, isValidElement, useEffect, useId, useRef, useState, type ReactNode } from "react";

const TOOLTIP_DELAY_MS = 1500;

type TooltipProps = {
  content: string;
  children: ReactNode;
};

export function Tooltip({ content, children }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();
  const childProps = (isValidElement(children) ? children.props : {}) as { disabled?: boolean };
  const isDisabled = childProps.disabled === true;
  const enhancedChild = isValidElement(children)
    ? cloneElement(children, { "aria-describedby": tooltipId } as Record<string, unknown>)
    : children;

  function clearTimer() {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }

  function hide() {
    clearTimer();
    setIsVisible(false);
  }

  function schedule() {
    clearTimer();
    timerRef.current = setTimeout(() => setIsVisible(true), TOOLTIP_DELAY_MS);
  }

  useEffect(() => () => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
  }, []);

  return (
    <span
      className="has-tooltip"
      tabIndex={isDisabled ? 0 : undefined}
      aria-describedby={isDisabled ? tooltipId : undefined}
      aria-disabled={isDisabled || undefined}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch") schedule();
      }}
      onPointerLeave={hide}
      onFocus={schedule}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) hide();
      }}
      onTouchStart={schedule}
      onTouchEnd={() => {
        clearTimer();
        if (isVisible) window.setTimeout(() => setIsVisible(false), 2200);
      }}
      onTouchCancel={hide}
      onKeyDown={(event) => {
        if (event.key === "Escape") hide();
      }}
    >
      {enhancedChild}
      <span id={tooltipId} className={`tooltip-content${isVisible ? " is-visible" : ""}`} role="tooltip">
        {content}
      </span>
    </span>
  );
}
