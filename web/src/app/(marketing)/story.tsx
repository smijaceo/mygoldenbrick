"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { firstName } from "@/lib/demo";
import type { BuilderListing } from "./site-preview";

function ActSite({ name }: { name: string }) {
  const title = name.trim() || "Your name";
  return (
    <div data-ui="" role="img" aria-label={`Sample website for ${title}, with a large house photograph and a home search`} className="site h-full overflow-hidden rounded-xl border border-rule">
      <div className="flex items-center justify-between gap-4 px-5 py-4">
        <p className="min-w-0 truncate font-bold tracking-[-0.02em]">{title}</p>
        <span className="hidden gap-5 text-small text-muted sm:flex"><span>Homes for sale</span><span>About</span><span>Contact</span></span>
      </div>
      <div className="relative mx-5 mb-5 h-64 overflow-hidden rounded-xl lg:h-[calc(100%-5rem)]">
        <Image src="/landing/home-modern.jpg" alt="" fill sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
        <div className="absolute inset-x-3 bottom-3 flex items-center gap-2 rounded-lg bg-white p-1.5 text-small">
          <span className="min-w-0 flex-1 truncate px-2 text-muted">Dundee, 68132 or an address…</span>
          <span className="shrink-0 rounded-md bg-ink px-3 py-2 font-semibold text-white">Search homes</span>
        </div>
      </div>
    </div>
  );
}

function ActInquiry({ home }: { home: BuilderListing }) {
  return (
    <div data-ui="" role="img" aria-label={`Sample tour request form on a fictional listing, ${home.street}`} className="site grid h-full grid-cols-1 gap-5 overflow-hidden rounded-xl border border-rule p-5 text-small md:grid-cols-[minmax(0,1fr)_minmax(0,19rem)]">
      <div className="min-w-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={home.photo} alt="" width={600} height={400} loading="lazy" className="aspect-[3/2] w-full rounded-xl bg-raised object-cover md:aspect-[4/3] xl:aspect-square" />
        <p className="mt-4 text-2xl font-extrabold tracking-[-0.03em]">{home.price}</p>
        <p className="text-muted">{home.street}, {home.area}</p>
        <p className="text-muted">{home.beds} beds, {home.baths} baths. Fictional listing.</p>
      </div>
      <div className="rounded-xl bg-surface p-4">
        <div className="grid grid-cols-2 gap-1 rounded-lg bg-raised p-1 font-semibold"><span className="rounded-md bg-white px-2 py-2 text-center">Request a tour</span><span className="px-2 py-2 text-center text-muted">Ask a question</span></div>
        <p className="mt-3 font-semibold">Preferred day</p>
        <p className="mt-1 rounded-lg border border-input bg-white px-3 py-2">This Saturday</p>
        <p className="mt-3 font-semibold">Name</p>
        <p className="mt-1 rounded-lg border border-input bg-white px-3 py-2">Taylor Brooks</p>
        <p className="mt-3 font-semibold">Email</p>
        <p className="mt-1 truncate rounded-lg border border-input bg-white px-3 py-2">taylor.b@example.com</p>
        <p className="mt-3 font-semibold">Message</p>
        <p className="mt-1 rounded-lg border border-input bg-white px-3 py-2">Is the basement finished? We’d love to see it this weekend.</p>
        <p className="mt-4 rounded-lg bg-ink px-3 py-2.5 text-center font-semibold text-white">Request a tour</p>
      </div>
    </div>
  );
}

function ActInbox({ home, name }: { home: BuilderListing; name: string }) {
  const first = firstName(name);
  const others = [["Chris Nguyen", "New", "Contact form", "1d"], ["Morgan Ellis", "Contacted", "19658 Dodge Circle", "3d"], ["Avery Johnson", "Qualified", "Contact form", "5d"], ["Jamie Lopez", "Showing", "10812 Linden Road", "8d"], ["Riley Chen", "Offer", "2144 Pacific Lane", "12d"], ["Drew Patel", "Closed", "Contact form", "5w"]];
  return (
    <div data-ui="" role="img" aria-label="Sample leads list with a new tour request from a fictional buyer at the top" className="site h-full overflow-hidden rounded-xl border border-rule p-5 text-small xl:p-7 xl:text-base">
      <p className="text-2xl font-extrabold tracking-[-0.03em]">{first ? `${first}’s leads` : "Your leads"}</p>
      <p className="mt-0.5 text-muted">Sample buyers, and a demo of how a request appears.</p>
      <div className="arrive-row mt-5 rounded-lg bg-[#fbf3dc] p-4">
        <div className="flex items-center gap-2"><span aria-hidden="true" className="unread-dot" /><span className="min-w-0 flex-1 truncate font-semibold">Taylor Brooks</span><span className="shrink-0 font-semibold">New</span><span className="shrink-0 text-muted">Now</span></div>
        <p className="mt-1 truncate pl-4 text-muted">Tour request, {home.street}</p>
        <p className="mt-2 pl-4">“Is the basement finished? We’d love to see it this weekend.”</p>
      </div>
      <ul className="mt-1">
        {others.map(([who, stage, from, when]) => (
          <li data-ui="" key={who} className="flex items-center gap-3 border-b border-rule px-3 py-3 last:border-0 xl:py-4">
            <span className="min-w-0 flex-1 truncate font-medium">{who}</span>
            <span className="w-20 shrink-0 text-muted">{stage}</span>
            <span className="hidden w-40 shrink-0 truncate text-muted md:block">{from}</span>
            <span className="w-8 shrink-0 text-right text-faint">{when}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * The product story as the visitor scrolls: their website, a buyer's inquiry, their inbox.
 * Scrolling is never taken over. On desktop one stage stays in view while the text passes
 * beside it; on phones each scene simply follows its text.
 */
export function Story({ name, home }: { name: string; home: BuilderListing }) {
  const [active, setActive] = useState(0);
  const steps = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.step));
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    steps.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  const acts: { title: string; body: string; scene: ReactNode }[] = [
    {
      title: "Your website",
      body: "Your name on a site with a home search and a page for every listing, ready for the buyers you send to it or who find you.",
      scene: <ActSite name={name} />,
    },
    {
      title: "A buyer’s inquiry",
      body: "When a home catches their eye, a buyer can request a tour or ask a question right on the listing. The form is short: a few details, nothing more.",
      scene: <ActInquiry home={home} />,
    },
    {
      title: "Your inbox",
      body: "The request lands in your leads with the home attached, and Today shows you who is waiting. Every inquiry from your site stays in one place.",
      scene: <ActInbox home={home} name={name} />,
    },
  ];

  return (
    <section id="how" aria-labelledby="how-heading" className="px-gutter pt-24 lg:pt-40">
      <h2 id="how-heading" data-enter className="landing-head max-w-[18ch]">From your site to a buyer’s question</h2>
      <div className="mt-10 grid grid-cols-1 lg:mt-4 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          {acts.map((a, i) => (
            <div key={a.title} ref={(el) => { steps.current[i] = el; }} data-step={i} className="py-8 lg:flex lg:min-h-[78vh] lg:flex-col lg:justify-center lg:py-0">
              <h3 className="landing-sub">{a.title}</h3>
              <p className="mt-3 max-w-[38ch] text-body">{a.body}</p>
              <div className="mt-6 lg:hidden">{a.scene}</div>
            </div>
          ))}
        </div>
        <div className="hidden lg:col-span-8 lg:block">
          <div className="sticky top-[10vh] h-[80vh] max-h-[46rem] rounded-2xl bg-surface p-6">
            <div className="relative h-full">
              {acts.map((a, i) => (
                <div key={a.title} data-active={i === active} className="stage-pane arrive absolute inset-0">{a.scene}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
