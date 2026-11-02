"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * The phone menu. The layout stays mounted between pages, so the menu closes itself on
 * navigation, on a tapped link, on Escape (returning focus to its button) and on a tap outside.
 */
export function SiteMenu({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    ref.current?.removeAttribute("open");
  }, [pathname]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const menu = ref.current;
      if (e.key !== "Escape" || !menu?.open) return;
      menu.open = false;
      menu.querySelector("summary")?.focus();
    };
    const onPointer = (e: PointerEvent) => {
      const menu = ref.current;
      if (menu?.open && !menu.contains(e.target as Node)) menu.open = false;
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, []);

  return (
    <details
      ref={ref}
      className="relative md:hidden"
      onClick={(e) => {
        if ((e.target as Element).closest("a") && ref.current) ref.current.open = false;
      }}
    >
      {children}
    </details>
  );
}
