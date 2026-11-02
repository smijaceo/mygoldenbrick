import Image from "next/image";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { searchListings } from "@/lib/listings";
import { money, sized } from "@/lib/format";
import { LiveBuilder, type BuilderListing } from "./live-builder";
import { Features } from "./features";
import { Faq } from "./faq";
import { Motion } from "@/components/motion";

const OMAHA = [
  { src: "/omaha/dundee-hd-omaha-ne.jpg", w: 1920, h: 1440, alt: "Brick Prairie-style house behind a clipped hedge in the Dundee historic district", caption: "Dundee historic district" },
  { src: "/omaha/omaha-nebraska-3540-pine-street.jpg", w: 1920, h: 1382, alt: "Yellow-brick bungalow with a wide front porch and stone steps on Pine Street", caption: "3540 Pine Street" },
  { src: "/omaha/omaha-nebraska-2021-n-53-st.jpg", w: 1920, h: 1263, alt: "Green-trimmed Tudor house with a steep gable on North 53rd Street", caption: "2021 North 53rd Street" },
];

// Agents and teams named on imakepage.com today.
const CLIENTS = ["Houses In Omaha Team", "Professional Realty Group", "Bjork Homes", "Simply Homes AZ"];

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
  const heroPhotos = ["/omaha/omaha-nebraska-3540-pine-street.jpg", "/omaha/dundee-hd-omaha-ne.jpg", "/omaha/omaha-nebraska-2021-n-53-st.jpg"];

  return (
    <div className="bg-ground text-ink">
      <header className="mx-auto flex h-16 max-w-6xl items-center gap-8 px-5 sm:px-10">
        <Link href="/" aria-label="imakepage home" className="shrink-0 text-base sm:text-lg"><Logo /></Link>
        <nav aria-label="Main" className="hidden gap-7 text-[15px] text-muted md:flex">
          <a href="#features" className="hover:text-ink">How it works</a>
          <Link href="/s/jordan-avery" className="hover:text-ink">Agent sites</Link>
          <a href="#faq" className="hover:text-ink">Questions</a>
        </nav>
        <div className="ml-auto flex items-center gap-4 whitespace-nowrap text-sm sm:gap-5 sm:text-[15px]">
          <Link href="/login" className="text-muted hover:text-ink">Sign in</Link>
          <Link href="/signup" className="press rounded-lg bg-ink px-4 py-2 font-semibold text-ground hover:bg-ink/90">Make my site</Link>
        </div>
      </header>

      <main id="main">
        <section className="px-5 pb-16 pt-12 sm:px-10 lg:pt-16">
          <LiveBuilder listings={listings} heroPhotos={heroPhotos} />
          <p className="mx-auto mt-16 max-w-4xl text-center text-small text-faint">
            Already running on imakepage: <span className="font-semibold text-ink">{CLIENTS.join(", ")}</span>
          </p>
        </section>

        <div id="features"><Features /></div>

        <section aria-labelledby="local-heading" className="mx-auto max-w-6xl px-5 pb-24 sm:px-10 lg:pb-32">
          <div className="grid grid-cols-1 items-end gap-8 lg:grid-cols-12">
            <div data-enter className="lg:col-span-4 lg:pb-2">
              <h2 id="local-heading" className="text-head font-extrabold tracking-[-0.04em]">Built for the blocks you sell</h2>
              <p className="mt-4 max-w-[36ch] text-body text-muted">Buyers search by the names they know, from Dundee to Gretna. Your site speaks the same language as your streets.</p>
            </div>
            <figure data-enter className="lg:col-span-8">
              <Image src={OMAHA[0].src} width={OMAHA[0].w} height={OMAHA[0].h} alt={OMAHA[0].alt} sizes="(min-width: 1024px) 760px, 100vw" className="aspect-[16/10] w-full rounded-2xl object-cover" />
              <figcaption className="mt-2 text-small text-faint">{OMAHA[0].caption}</figcaption>
            </figure>
          </div>
          <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2">
            {OMAHA.slice(1).map((p) => (
              <figure key={p.src} data-enter>
                <Image src={p.src} width={p.w} height={p.h} alt={p.alt} sizes="(min-width: 640px) 50vw, 100vw" className="aspect-[4/3] w-full rounded-2xl object-cover" />
                <figcaption className="mt-2 text-small text-faint">{p.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        <div id="faq"><Faq /></div>

        <section aria-labelledby="cta-heading" className="px-5 pb-24 sm:px-10 lg:pb-32">
          <form action="/signup" className="mx-auto max-w-5xl rounded-3xl bg-surface px-6 py-16 text-center sm:px-12 lg:py-20">
            <h2 id="cta-heading" className="text-head font-extrabold tracking-[-0.04em]">Your name is all it takes.</h2>
            <div className="mx-auto mt-8 flex max-w-lg flex-col gap-3 sm:flex-row">
              <label className="flex-1">
                <span className="sr-only">Your name</span>
                <input name="name" placeholder="Your name…" autoComplete="name" maxLength={80} className="h-12 w-full rounded-lg border border-input bg-ground px-4 text-base text-ink placeholder:text-faint" />
              </label>
              <button type="submit" className="press h-12 rounded-lg bg-ink px-6 text-base font-semibold text-ground hover:bg-ink/90">Make my site</button>
            </div>
            <p className="mt-4 text-small text-faint">You’ll pick a password next.</p>
          </form>
        </section>
      </main>

      <footer className="bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-10 px-5 py-12 sm:px-10 md:grid-cols-[1.4fr_1fr_1.6fr]">
          <div>
            <Logo className="text-lg" />
            <p className="mt-3 max-w-[32ch] text-small text-muted">Websites, home search and lead follow-up for real estate agents.</p>
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-2 text-small">
            <Link href="/signup" className="hover:underline">Make my site</Link>
            <Link href="/login" className="hover:underline">Sign in</Link>
            <Link href="/s/jordan-avery" className="hover:underline">See an agent site</Link>
            <a href="mailto:hello@imakepage.com" className="hover:underline">hello@imakepage.com</a>
          </nav>
          <p className="text-small text-faint">
            Photos: <a className="underline" href="https://commons.wikimedia.org/wiki/File:Dundee_HD_Omaha_NE.JPG">“Dundee HD Omaha NE”</a> by Smallbones, public domain;{" "}
            <a className="underline" href="https://commons.wikimedia.org/wiki/File:Omaha,_Nebraska_3540_Pine_Street.JPG">“3540 Pine Street”</a> and{" "}
            <a className="underline" href="https://commons.wikimedia.org/w/index.php?curid=30642703">“2021 N 53 St”</a> by Ammodramus, CC0; via Wikimedia Commons. Listing photos via Unsplash. Listing information is deemed reliable but not guaranteed.
          </p>
        </div>
      </footer>
      <Motion />
    </div>
  );
}
