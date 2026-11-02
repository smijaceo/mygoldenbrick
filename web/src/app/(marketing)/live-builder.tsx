"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { previewCopy } from "@/lib/builder";

export type BuilderListing = {
  id: number;
  photo: string;
  price: string;
  street: string;
  area: string;
  beds: number;
  baths: number;
};

/**
 * The preview's photo changes when the visitor pauses typing, so the change answers what
 * they wrote and nothing moves on its own. The same pause sends one short note to screen
 * readers instead of re-reading the whole preview on every keystroke.
 */
function usePauseAfterTyping(name: string, area: string, title: string, count: number) {
  const [index, setIndex] = useState(0);
  const [note, setNote] = useState("");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = window.setTimeout(() => {
      if (count > 1) setIndex((i) => (i + 1) % count);
      setNote(`Preview updated for ${title}.`);
    }, 700);
    return () => window.clearTimeout(id);
  }, [name, area, title, count]);
  return { index, note };
}

/**
 * The hero. The headline holds the real name field (typing your name is the product), the
 * buttons start sign-up with what was typed, and the picture below is the agent's own site
 * filling in as they type, with their inbox laid over its corner.
 */
export function LiveBuilder({ listings, heroPhotos }: { listings: BuilderListing[]; heroPhotos: string[] }) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const copy = previewCopy(name, area);
  const { index: active, note } = usePauseAfterTyping(name, area, copy.title, heroPhotos.length);

  // Homes in the typed area come first, so the preview answers what the visitor wrote.
  const shown = useMemo(() => {
    const q = area.trim().toLowerCase();
    if (!q) return listings;
    const match = (l: BuilderListing) => l.area.toLowerCase().includes(q) || l.street.toLowerCase().includes(q);
    return [...listings.filter(match), ...listings.filter((l) => !match(l))];
  }, [area, listings]);

  return (
    <div>
      <form action="/signup" className="mx-auto max-w-5xl text-center">
        <h1 className="text-display font-extrabold tracking-[-0.04em] text-balance">
          {/* Phones get the short line so the headline stays at two lines. */}
          <span className="sm:hidden">Your site and inbox for</span>
          <span className="hidden sm:inline">A website, home search and inbox for</span>{" "}
          <label className="inline-block max-w-full align-baseline">
            <span className="sr-only">Your name</span>
            <input
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="your name"
              autoComplete="name"
              maxLength={60}
              size={Math.max(9, name.length + 1)}
              className="headline-field max-w-full rounded-[0.22em] border-[3px] border-ink bg-ground px-[0.28em] pb-[0.06em] font-bold tracking-[-0.04em] text-ink caret-accent placeholder:text-[#9ca3af]"
            />
          </label>
        </h1>
        <p className="mx-auto mt-6 max-w-[56ch] text-body text-muted">
          Type your name and the town you sell in. Your site, your listings and the people who reach out to you are set up together.
        </p>
        <p className="sr-only" aria-live="polite">{note}</p>
        <div className="mx-auto mt-8 flex max-w-xl flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <label className="flex-1 sm:max-w-60">
            <span className="sr-only">Where you sell</span>
            <input
              name="area"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Where you sell…"
              autoComplete="off"
              maxLength={80}
              className="h-12 w-full rounded-lg border border-input bg-ground px-4 text-base text-ink placeholder:text-faint"
            />
          </label>
          <button type="submit" className="press h-12 rounded-lg bg-ink px-6 text-base font-semibold text-ground hover:bg-ink/90">Make my site</button>
          <Link href="/s/jordan-avery" className="press flex h-12 items-center justify-center rounded-lg bg-raised px-6 text-base font-semibold text-ink hover:bg-active">See Jordan’s site</Link>
        </div>
      </form>

      {/* The product as the picture: the agent's site filling in, with their inbox over its corner. */}
      <div className="relative mx-auto mt-14 max-w-5xl lg:mt-16 lg:pr-40" aria-label="Preview of your website" role="region">
        <div data-ui="" className="overflow-hidden rounded-xl border border-rule bg-ground shadow-[0_1px_2px_rgba(17,24,39,0.04),0_18px_40px_rgba(17,24,39,0.08)]">
          <div data-ui="" className="flex h-9 items-center gap-3 border-b border-rule bg-surface px-4 text-small text-faint">
            <span aria-hidden="true" className="flex gap-1.5"><span className="size-2.5 rounded-full bg-rule" /><span className="size-2.5 rounded-full bg-rule" /><span className="size-2.5 rounded-full bg-rule" /></span>
            <span className="min-w-0 truncate rounded-md border border-rule bg-ground px-3 py-0.5">imakepage.com/s/{copy.slug}</span>
          </div>
          <div className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="min-w-0 truncate text-lead font-bold tracking-[-0.02em]">{copy.title}</span>
            <span className="hidden shrink-0 gap-5 text-small text-muted sm:flex"><span>Homes for sale</span><span>About</span><span>Contact</span></span>
          </div>
          <div className="relative mx-5 h-56 overflow-hidden rounded-lg sm:h-64">
            {heroPhotos.map((src, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={src} src={src} alt="" width={1200} height={800} fetchPriority={i === 0 ? "high" : "low"} className="absolute inset-0 h-full w-full object-cover transition-opacity duration-700" style={{ opacity: i === active ? 1 : 0 }} />
            ))}
            <div className="absolute inset-x-4 bottom-4 flex max-w-lg gap-2">
              <span className="min-w-0 flex-1 truncate rounded-lg bg-ground px-4 py-2.5 text-small text-faint">{copy.heading}</span>
              <span className="rounded-lg bg-ink px-4 py-2.5 text-small font-semibold text-ground">Search</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 p-5 sm:grid-cols-3">
            {shown.slice(0, 3).map((l, i) => (
              <div key={l.id} className={i === 2 ? "hidden sm:block" : undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={l.photo} alt="" width={300} height={200} loading="lazy" className="aspect-[3/2] w-full rounded-lg object-cover" />
                <p className="mt-2 text-body font-bold tracking-[-0.02em]">{l.price}</p>
                <p className="truncate text-small text-muted">{l.street}, {l.area}</p>
              </div>
            ))}
          </div>
        </div>

        <div data-ui="" className="mt-4 overflow-hidden rounded-xl border border-rule bg-ground text-small shadow-[0_1px_2px_rgba(17,24,39,0.04),0_18px_40px_rgba(17,24,39,0.12)] lg:absolute lg:right-0 lg:top-24 lg:mt-0 lg:w-80">
          <div className="flex items-baseline justify-between px-4 pb-2 pt-4"><span className="text-body font-bold">Your inbox</span><span className="text-faint">2 waiting</span></div>
          <div data-ui="" className="border-t border-rule px-4 py-3">
            <div className="flex justify-between gap-3"><span className="font-semibold">Taylor Brooks</span><span className="text-faint">8h</span></div>
            <p className="mt-0.5 text-muted">Can we see 3540 Pine St on Saturday?</p>
            <div className="mt-2 flex gap-2"><span className="rounded-md bg-ink px-3 py-1 font-semibold text-ground">Reply</span><span className="rounded-md bg-raised px-3 py-1 font-semibold">Call</span></div>
          </div>
          <div data-ui="" className="border-t border-rule px-4 pb-4 pt-3">
            <div className="flex justify-between gap-3"><span className="font-semibold">Chris Nguyen</span><span className="text-faint">1d</span></div>
            <p className="mt-0.5 text-muted">What could my house sell for?</p>
          </div>
        </div>
      </div>
    </div>
  );
}
