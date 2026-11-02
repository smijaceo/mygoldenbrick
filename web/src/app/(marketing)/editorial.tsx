import Image from "next/image";
import Link from "next/link";

function Capture({ src, alt, width, height, sizes, className = "", caption, zoom = "" }: { src: string; alt: string; width: number; height: number; sizes: string; className?: string; caption?: string; zoom?: string }) {
  return (
    <figure className={className}>
      <div data-ui="" data-enter className={`reveal capture ${zoom}`}>
        <Image src={src} alt={alt} width={width} height={height} sizes={sizes} className="h-auto w-full" />
      </div>
      {caption && <figcaption className="mt-3 max-w-[48ch] text-small text-muted">{caption}</figcaption>}
    </figure>
  );
}

/** What the agent's website looks like: real captures of the sample site. */
export function WhatBuyersSee() {
  return (
    <section aria-labelledby="site-heading" className="px-gutter pt-24 lg:pt-40">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-end lg:gap-10">
        <h2 id="site-heading" data-enter className="landing-head lg:col-span-7">The site your buyers see</h2>
        <div data-enter className="lg:col-span-5">
          <p className="max-w-[44ch] text-body">Real screens from the sample site, on a computer and on a phone. The agent and the listings are fictional.</p>
          <Link href="/s/jordan-avery" className="quiet-link mt-3 inline-block py-2 text-base font-semibold">Open the sample site</Link>
        </div>
      </div>

      <div className="mt-10 grid grid-cols-1 items-end gap-6 sm:grid-cols-[minmax(0,3fr)_minmax(0,1fr)] lg:mt-16 lg:gap-10">
        <Capture src="/landing/site-home.jpg" width={2880} height={1800} sizes="(min-width: 640px) 72vw, 100vw" alt="Sample agent home page with a headline, a large house photograph and a home search" />
        <Capture src="/landing/site-phone.jpg" width={1170} height={2532} sizes="(min-width: 640px) 24vw, 70vw" className="mx-auto w-3/5 sm:w-full" alt="The same sample agent home page on a phone" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-2 lg:mt-10 lg:gap-10">
        <Capture src="/landing/site-search.jpg" width={2880} height={1800} sizes="(min-width: 768px) 50vw, 100vw" caption="Home search with a map, and filters for price, beds, baths and type." alt="Sample home search page with a map of Omaha beside listing cards" />
        <Capture src="/landing/site-listing.jpg" width={2880} height={1800} sizes="(min-width: 768px) 50vw, 100vw" caption="A page for each listing, with a tour request and a question form beside it." alt="Sample listing page with a photo gallery, price and the agent's contact card" />
      </div>

      <div className="mt-24 grid grid-cols-1 items-center gap-8 lg:mt-40 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <h2 data-enter className="landing-head">Yours to shape</h2>
          <p data-enter className="mt-5 max-w-[38ch] text-body">Write your own words, choose a light or dark theme and a button colour, and watch the real site change beside the form. Every change saves itself.</p>
        </div>
        <Capture src="/landing/app-website.jpg" width={2384} height={1800} sizes="(min-width: 1024px) 62vw, 100vw" className="lg:col-span-8" zoom="zoom-155" alt="The website editor, with theme and button colour settings beside a live preview of the site" />
      </div>
    </section>
  );
}

/** How the agent follows up: real captures of the back office, on a field of warm tone. */
export function FollowUp() {
  return (
    <section aria-labelledby="follow-heading" className="mt-24 bg-surface px-gutter py-24 lg:mt-40 lg:py-32">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-end lg:gap-10">
        <h2 id="follow-heading" data-enter className="landing-head lg:col-span-7">Then you follow up</h2>
        <p data-enter className="max-w-[44ch] text-body lg:col-span-5">Open a lead and everything is on one page: the home they asked about, their message, your notes, tasks and history.</p>
      </div>
      <Capture src="/landing/app-leads.jpg" width={2384} height={1800} sizes="100vw" className="mt-10 lg:mt-16" zoom="zoom-155" alt="The leads list with a sample buyer's lead open in a side panel, showing their message and a reply box" caption="Replies are saved on the lead and kept in an in-app outbox. Real email delivery isn’t connected yet." />
      <div className="mt-16 grid grid-cols-1 items-center gap-8 lg:mt-24 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-4">
          <h3 data-enter className="landing-sub">A pipeline you can drag</h3>
          <p data-enter className="mt-3 max-w-[38ch] text-body">Move each person from New to Closed, with a menu on phones and from the keyboard.</p>
        </div>
        <Capture src="/landing/app-pipeline.jpg" width={2384} height={1000} sizes="(min-width: 1024px) 62vw, 100vw" className="lg:col-span-8" zoom="zoom-210" alt="The pipeline board with fictional buyers in columns from New to Closed" />
      </div>
    </section>
  );
}
