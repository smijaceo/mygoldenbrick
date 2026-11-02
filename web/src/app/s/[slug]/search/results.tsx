"use client";

import { useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { List, Map as MapIcon } from "lucide-react";
import type { MapPin } from "./map";
import { cx } from "@/components/ui";

const ListingMap = dynamic(() => import("./map"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-surface" />,
});

/** Map + list side by side on desktop; a List/Map switch on phones. */
export function SearchResults({ pins, slug, cards }: { pins: MapPin[]; slug: string; cards: { id: number; node: ReactNode }[] }) {
  const [view, setView] = useState<"list" | "map">("list");
  const [activeId, setActiveId] = useState<number | null>(null);

  return (
    <div className="relative lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="px-5 pb-3 sm:px-10 lg:hidden"><div className="grid grid-cols-2 gap-1 rounded-xl bg-raised p-1" role="group" aria-label="Show homes as">
        {([["list", List, "List"], ["map", MapIcon, "Map"]] as const).map(([v, Icon, label]) => (
          <button
            key={v}
            type="button"
            aria-pressed={view === v}
            onClick={() => setView(v)}
            className={cx("flex h-10 items-center justify-center gap-2 rounded-lg text-body font-semibold", view === v ? "border border-rule bg-ground text-ink" : "border border-transparent text-muted")}
          >
            <Icon size={17} aria-hidden="true" /> {label}
          </button>
        ))}
      </div>
      </div>
      <div className={cx("lg:sticky lg:top-[8.75rem] lg:block lg:h-[calc(100dvh-8.75rem)]", view === "map" ? "block h-[calc(100dvh-12rem)]" : "hidden")}>
        <ListingMap pins={pins} activeId={activeId} slug={slug} />
      </div>
      <div className={cx("px-5 py-8 sm:px-10 lg:block", view === "list" ? "block" : "hidden")}>
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2">
          {cards.map((c) => (
            <div key={c.id} onMouseEnter={() => setActiveId(c.id)} onMouseLeave={() => setActiveId(null)} onFocus={() => setActiveId(c.id)} onBlur={() => setActiveId(null)}>
              {c.node}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
