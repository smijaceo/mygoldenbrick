import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Libre_Caslon_Display } from "next/font/google";
import { searchListings } from "@/lib/listings";
import { money, sized } from "@/lib/format";
import { Brand, BRAND_NAME } from "./brand";
import { Experience } from "./experience";
import type { BuilderListing } from "./site-preview";
import { FollowUp, WhatBuyersSee } from "./editorial";
import { Faq } from "./faq";
import { Motion } from "@/components/motion";
import "./landing.css";

// Headlines only; interface text stays in Inter. Loaded on this page alone.
const caslon = Libre_Caslon_Display({ variable: "--font-caslon", subsets: ["latin"], weight: "400" });

export const metadata: Metadata = {
  title: { absolute: `${BRAND_NAME}: a website worthy of your name` },
  description: "Build your real estate presence and keep every buyer inquiry in one place.",
};

export default function Landing() {
  const listings: BuilderListing[] = searchListings({ sort: "newest" }, 12).map((l) => ({
    id: l.id,
    photo: sized(l.photos[0], 600),
    price: money(l.price),
    street: l.street,
    area: l.neighborhood,
    beds: l.beds,
    baths: l.baths,
  }));

  return (
    <div className={`landing overflow-x-clip bg-ground text-ink ${caslon.variable}`}>
      <header className="flex h-16 items-center gap-5 px-gutter lg:h-20 lg:gap-8">
        <Link href="/" aria-label={`${BRAND_NAME} home`} className="shrink-0 text-lg sm:text-[1.375rem]"><Brand /></Link>
        <nav aria-label="Main" className="hidden gap-5 whitespace-nowrap text-[15px] text-muted md:flex lg:gap-7">
          <a href="#how" className="hover:text-ink">How it works</a>
          <Link href="/s/jordan-avery" className="hover:text-ink">Agent sites</Link>
          <a href="#faq" className="hover:text-ink">Questions</a>
        </nav>
        <div className="ml-auto flex items-center gap-4 whitespace-nowrap text-[15px] sm:gap-6">
          <Link href="/login" className="py-2 text-muted hover:text-ink">Sign in</Link>
          <Link href="/signup" className="press hidden rounded-lg bg-ink px-4 py-2.5 font-semibold text-white hover:bg-ink/85 sm:block">Make my site</Link>
        </div>
      </header>

      <main id="main">
        <Experience listings={listings} />
        <WhatBuyersSee />
        <FollowUp />
        <Faq />

        <section aria-labelledby="cta-heading" className="relative isolate overflow-hidden px-gutter py-24 text-white lg:py-44">
          <Image src="/landing/home-dusk.jpg" alt="" fill sizes="100vw" className="-z-20 object-cover" />
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/55" />
          <h2 id="cta-heading" data-enter className="landing-title">Start with your name.</h2>
          <form data-enter action="/signup" className="mt-8 flex max-w-2xl flex-col gap-3 sm:flex-row">
            <label className="flex-1">
              <span className="sr-only">Your name</span>
              <input name="name" placeholder="Your name…" autoComplete="name" maxLength={80} className="h-14 w-full rounded-lg bg-white px-4 text-lg text-ink placeholder:text-faint" />
            </label>
            <button type="submit" className="press h-14 rounded-lg bg-accent px-7 text-base font-semibold text-accent-ink hover:brightness-105">Make my site</button>
          </form>
          <p data-enter className="mt-4 text-body">You’ll pick a password next.</p>
        </section>
      </main>

      <footer className="grid grid-cols-1 gap-10 px-gutter py-14 md:grid-cols-[1.4fr_1fr_1.6fr]">
        <div>
          <Brand className="text-[1.375rem]" />
          <p className="mt-3 max-w-[34ch] text-small text-muted">Websites and buyer inquiries for real estate agents. Owned by Mike Bjork.</p>
        </div>
        <nav aria-label="Footer" className="flex flex-col gap-2 text-small">
          <Link href="/signup" className="hover:underline">Make my site</Link>
          <Link href="/login" className="hover:underline">Sign in</Link>
          <Link href="/s/jordan-avery" className="hover:underline">See an agent site</Link>
          <a href="mailto:hello@imakepage.com" className="hover:underline">hello@imakepage.com</a>
        </nav>
        <p className="text-small text-muted">
          Property photos via Unsplash, shown as samples. The agents, buyers and listings in every preview and screen on this page are fictional. Listing information is deemed reliable but not guaranteed.
        </p>
      </footer>
      <Motion />
    </div>
  );
}
