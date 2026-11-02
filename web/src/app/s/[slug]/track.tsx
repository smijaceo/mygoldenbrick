"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const KEY = "imp_visitor";

function visitorId() {
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

/** Counts one page view. Skipped inside the editor’s preview frame. */
export function Track({ slug }: { slug: string }) {
  const pathname = usePathname();
  useEffect(() => {
    if (window.self !== window.top || location.search.includes("preview=1")) return;
    const body = JSON.stringify({ slug, path: pathname.replace(`/s/${slug}`, "") || "/", visitor: visitorId() });
    navigator.sendBeacon?.("/api/track", new Blob([body], { type: "application/json" }));
  }, [slug, pathname]);
  return null;
}
