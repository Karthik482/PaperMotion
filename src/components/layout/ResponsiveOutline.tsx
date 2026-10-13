"use client";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

export function ResponsiveOutline({
  children,
  label,
  count,
  collapseAt = 767,
}: {
  children: ReactNode;
  label: string;
  count: number;
  collapseAt?: number;
}) {
  const outline = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const mobile = window.matchMedia(`(max-width: ${collapseAt}px)`);
    const update = () => {
      if (outline.current) outline.current.open = !mobile.matches;
    };
    update();
    mobile.addEventListener("change", update);
    return () => mobile.removeEventListener("change", update);
  }, [collapseAt]);
  return (
    <details className="lesson-outline" ref={outline} open>
      <summary>
        {label}
        <span>{count} steps</span>
      </summary>
      {children}
    </details>
  );
}
