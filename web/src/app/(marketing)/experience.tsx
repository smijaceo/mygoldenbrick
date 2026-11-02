"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { previewCopy } from "@/lib/builder";
import { HERO_PHOTOS, SitePreview, type BuilderListing } from "./site-preview";
import { Story } from "./story";

/**
 * The preview's photo changes when the visitor pauses typing, so the change answers what
 * they wrote and nothing moves on its own. The same pause sends one short note to screen
 * readers instead of re-reading the whole preview on every keystroke.
 */
function usePauseAfterTyping(name: string, area: string, title: string) {
  const [index, setIndex] = useState(0);
  const [note, setNote] = useState("");
  const first = useRef(true);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    const id = window.setTimeout(() => {
      setIndex((i) => (i + 1) % HERO_PHOTOS.length);
      setNote(`Preview updated for ${title}.`);
    }, 800);
    return () => window.clearTimeout(id);
  }, [name, area, title]);
  return { index, note };
}

/**
 * The hero and the scroll story share one state, so the name typed at the top carries through
 * the whole demonstration. The form starts the real sign-up with what was typed.
 */
export function Experience({ listings }: { listings: BuilderListing[] }) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const copy = previewCopy(name, area);
  const { index, note } = usePauseAfterTyping(name, area, copy.title);
  const named = name.trim().length > 0;

  // Homes in the typed area come first, so the preview answers what the visitor wrote.
  const shown = useMemo(() => {
    const q = area.trim().toLowerCase();
    if (!q) return listings;
    const match = (l: BuilderListing) => l.area.toLowerCase().includes(q) || l.street.toLowerCase().includes(q);
    return [...listings.filter(match), ...listings.filter((l) => !match(l))];
  }, [area, listings]);

  return (
    <>
      <section aria-labelledby="hero-heading" className="px-gutter pt-6 lg:pt-5">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-end lg:gap-10">
          <h1 id="hero-heading" className="landing-title lg:col-span-7">A website worthy<br />of your name.</h1>

          <form action="/signup" className="min-w-0 lg:col-span-5">
            <p className="max-w-[44ch] text-body">Build your real estate presence and keep every buyer inquiry in one place.</p>
            <label htmlFor="hero-name" className="landing-sub mt-5 block">Start with your name.</label>
            <div className="mt-3 flex gap-2">
              <input
                id="hero-name"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name…"
                autoComplete="name"
                maxLength={60}
                className="h-14 w-full min-w-0 flex-1 rounded-lg border border-ink bg-white px-4 text-lg text-ink caret-accent-text placeholder:text-faint"
              />
              <button type="submit" className="press h-14 shrink-0 rounded-lg bg-ink px-4 text-base font-semibold text-white hover:bg-ink/85 sm:px-7">Make my site</button>
            </div>
            {/*
              The town improves the preview only once there is a name. On desktop its place is
              held, so the preview never jumps; on phones it opens smoothly to save the space.
            */}
            <div className={`town-row grid ${named ? "grid-rows-[1fr] opacity-100" : "invisible grid-rows-[0fr] opacity-0 lg:grid-rows-[1fr]"}`}>
              <label className="flex min-h-0 items-center gap-3 overflow-hidden p-0.5 pt-3">
                <span className="shrink-0 text-small font-semibold">Where you sell</span>
                <input
                  name="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Town, optional…"
                  autoComplete="off"
                  maxLength={80}
                  className="h-11 w-full min-w-0 flex-1 rounded-lg border border-input bg-white px-3 text-base text-ink caret-accent-text placeholder:text-faint"
                />
              </label>
            </div>
            <p className="sr-only" aria-live="polite">{note}</p>
          </form>
        </div>

        <div className="mt-6 lg:mt-5">
          <SitePreview name={name} area={area} copy={copy} photoIndex={index} shown={shown} />
        </div>
      </section>

      <Story name={name} home={shown[0]} />
    </>
  );
}
