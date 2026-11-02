"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { askLead, firstName } from "@/lib/demo";

export type BuilderListing = {
  id: number;
  photo: string;
  price: string;
  street: string;
  area: string;
  beds: number;
  baths: number;
};

export const HERO_PHOTOS = ["/landing/home-dusk.jpg", "/landing/home-modern.jpg", "/landing/home-shingle.jpg"];

const SAMPLE_LEADS = [
  { id: "taylor", name: "Taylor Brooks", when: "8h", message: "Is the basement finished?", waiting: true },
  { id: "chris", name: "Chris Nguyen", when: "1d", message: "What could my house sell for?", waiting: true },
];

/** Typed text: each new letter arrives gold and settles (see .live-char). */
export function LiveText({ value, placeholder }: { value: string; placeholder: string }) {
  if (!value) return <span key="placeholder" className="swap-in">{placeholder}</span>;
  return <>{[...value].map((ch, i) => <span key={`${i}-${ch}`} className="live-char">{ch}</span>)}</>;
}

type Copy = { title: string; heading: string; slug: string };

/**
 * The agent's site, in the real site's layout and type, opening from a gold brick. Pressing
 * "Try a buyer inquiry" plays a sample inquiry into a sample inbox. Nothing is saved or sent.
 */
export function SitePreview({ name, area, copy, photoIndex, shown }: { name: string; area: string; copy: Copy; photoIndex: number; shown: BuilderListing[] }) {
  const [count, setCount] = useState(0);
  const [asked, setAsked] = useState<{ id: string; name: string; message: string }[]>([]);
  const [phase, setPhase] = useState<"idle" | "sending" | "inbox">("idle");
  const [current, setCurrent] = useState<{ name: string; message: string } | null>(null);
  const [note, setNote] = useState("");
  const timer = useRef<number | undefined>(undefined);
  const tryButton = useRef<HTMLButtonElement>(null);
  const first = firstName(name);
  const trimmed = name.trim();

  // The other photographs load only once someone starts typing, and then stay.
  const [armed, setArmed] = useState(false);
  if (!armed && (name || area)) setArmed(true);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const tryInquiry = () => {
    if (phase === "sending") return;
    const lead = askLead(count, shown[0].street);
    const arrive = () => {
      setAsked((a) => [{ id: `asked-${count}`, ...lead }, ...a]);
      setPhase("inbox");
      setNote(`It reached your inbox. This is a demo, so nothing was saved or sent.`);
    };
    setCount((n) => n + 1);
    setCurrent(lead);
    setNote(`Sample inquiry from ${lead.name}: ${lead.message}`);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      arrive();
      return;
    }
    setPhase("sending");
    timer.current = window.setTimeout(arrive, 1100);
  };

  const close = () => {
    setPhase("idle");
    setNote("Inbox demo closed.");
    tryButton.current?.focus();
  };

  const rows = [...asked.map((l) => ({ ...l, when: "Now", waiting: true })), ...SAMPLE_LEADS].slice(0, 3);
  const waiting = asked.length + SAMPLE_LEADS.length;

  return (
    <div onKeyDown={(e) => { if (e.key === "Escape" && phase === "inbox") close(); }}>
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 pb-3">
        <p className="min-w-0 text-small text-muted">
          <span className="font-semibold text-ink">Sample preview.</span> Your address: <span className="text-ink [overflow-wrap:anywhere]">/s/<LiveText value={trimmed ? copy.slug : ""} placeholder="your-name" /></span>
        </p>
        <div className="flex items-center gap-x-5">
          <Link href="/s/jordan-avery" className="quiet-link py-2 text-small font-semibold">See a sample site</Link>
          <button ref={tryButton} type="button" onClick={tryInquiry} className="press h-11 rounded-lg bg-accent px-4 text-small font-semibold text-accent-ink hover:brightness-105">
            {count === 0 ? "Try a buyer inquiry" : "Try another inquiry"}
          </button>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">{note}</p>

      <div className="opening relative">
        <div data-ui="" className="site relative overflow-hidden rounded-2xl border border-rule" role="region" aria-label="Preview of your website">
          <div className="opening-rise flex items-center justify-between gap-6 px-5 py-3.5 sm:px-10 sm:py-4">
            <p className="min-w-0 truncate text-lg font-bold tracking-[-0.02em] sm:text-xl"><LiveText value={trimmed} placeholder="Your name" /></p>
            <span className="hidden shrink-0 gap-7 text-small text-muted md:flex"><span>Homes for sale</span><span>About</span><span>Contact</span></span>
          </div>

          <div className="px-5 sm:px-10">
            <p className="opening-rise max-w-[22ch] text-[clamp(1.875rem,3.6vw,3.25rem)] font-extrabold leading-[1.04] tracking-[-0.04em]">
              Homes for sale with <LiveText value={trimmed} placeholder="your name" />
            </p>

            <div className="relative mt-4 h-[19rem] overflow-hidden rounded-2xl bg-raised sm:mt-5 sm:h-[30rem] xl:h-[38rem]">
              <div className="opening-photo absolute inset-0">
                {/* The first photo stays underneath, so a change can never show an empty frame. */}
                {HERO_PHOTOS.slice(0, armed ? HERO_PHOTOS.length : 1).map((src, i) => (
                  <Image
                    key={src}
                    src={src}
                    alt=""
                    fill
                    sizes="(min-width: 85rem) 1280px, 100vw"
                    {...(i === 0 ? { loading: "eager" as const, fetchPriority: "high" as const } : {})}
                    className="photo-layer object-cover"
                    style={{ opacity: i === 0 || i === photoIndex ? 1 : 0 }}
                  />
                ))}
              </div>
              <div className="opening-rise absolute inset-x-3 bottom-3 flex max-w-3xl items-center gap-2 rounded-xl bg-white p-2 sm:inset-x-5 sm:bottom-5">
                <span className="min-w-0 flex-1 truncate px-3 text-small text-muted sm:text-base">{area.trim() ? <LiveText value={copy.heading} placeholder="" /> : "Dundee, 68132 or an address…"}</span>
                <span className="shrink-0 rounded-lg bg-ink px-4 py-2.5 text-small font-semibold text-white sm:px-6 sm:py-3 sm:text-base">Search homes</span>
              </div>

              {phase === "sending" && current && (
                <div className="lead-in absolute left-3 top-3 max-w-[calc(100%-1.5rem)] rounded-xl bg-white p-4 text-small sm:left-5 sm:top-5 sm:w-96">
                  <p className="font-semibold">Sample inquiry from {current.name}</p>
                  <p className="mt-0.5 text-muted">{current.message}</p>
                  <p className="mt-2 text-faint">On its way to your inbox…</p>
                </div>
              )}
            </div>
          </div>

          <div className="px-5 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-12">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
              <p className="text-2xl font-extrabold tracking-[-0.03em]">New on the market</p>
              <p className="text-small text-muted">Fictional listings</p>
            </div>
            <ul key={area.trim().toLowerCase()} className="swap-in mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {shown.slice(0, 3).map((l, i) => (
                <li key={l.id} className={i === 0 ? undefined : "hidden sm:block"}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.photo} alt="" width={600} height={400} loading="lazy" className="aspect-[3/2] w-full rounded-xl bg-raised object-cover" />
                  <p className="figures mt-3 text-lg font-bold tracking-[-0.02em]">{l.price}</p>
                  <p className="truncate text-small text-muted">{l.beds} beds, {l.baths} baths</p>
                  <p className="truncate text-small text-muted">{l.street}, {l.area}</p>
                </li>
              ))}
            </ul>
          </div>

          {phase === "inbox" && (
            <div data-ui="" className="panel-in absolute inset-x-3 top-3 rounded-xl border border-rule bg-white text-small sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[25rem]">
              <div className="flex items-start justify-between gap-3 px-4 pt-4">
                <div className="min-w-0">
                  <p className="truncate text-body font-bold">{first ? `${first}’s inbox` : "Your inbox"}</p>
                  <p className="text-muted">Demo. Nothing is saved or sent.</p>
                </div>
                <button type="button" onClick={close} className="-mr-1 -mt-1 h-11 shrink-0 rounded-lg px-3 font-semibold hover:bg-raised">Close</button>
              </div>
              <p className="figures-col px-4 pb-3 pt-1 text-muted">{waiting} waiting on you</p>
              <ul>
                {rows.map((l) => (
                  <li data-ui="" key={l.id} className="lead-in border-t border-rule px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span aria-hidden="true" className="unread-dot" />
                      <span className="min-w-0 flex-1 truncate font-semibold">{l.name}</span>
                      <span className="shrink-0 text-faint">{l.when}</span>
                    </div>
                    <p className="mt-0.5 pl-4 text-muted">{l.message}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div aria-hidden="true" className="opening-gold absolute inset-0 rounded-2xl" />
      </div>
    </div>
  );
}
