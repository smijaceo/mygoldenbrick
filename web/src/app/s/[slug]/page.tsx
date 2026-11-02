import Image from "next/image";
import Link from "next/link";
import { getFeaturedListings, searchListings } from "@/lib/listings";
import { shortMoney, sized } from "@/lib/format";
import { loadSite } from "./data";
import { LeadForm } from "./lead-form";
import { AgentAvatar, ListingCard, Section } from "./parts";

const PRICE_OPTIONS = [300000, 400000, 500000, 750000, 1000000];
const field = "h-12 w-full rounded-lg bg-surface px-4 text-base text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-text";

export default async function SiteHome({ params }: PageProps<"/s/[slug]">) {
  const { slug } = await params;
  const { agent, site, testimonials } = await loadSite(slug);
  const base = `/s/${slug}`;
  let homes = getFeaturedListings(agent.id).filter((l) => l.status === "active").slice(0, 6);
  const showingNewest = homes.length === 0;
  if (showingNewest) homes = searchListings({ sort: "newest" }, 6);
  const first = agent.name.split(" ")[0];

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-10 sm:px-10 lg:pt-14">
        <h1 data-enter className="max-w-[20ch] text-display font-extrabold tracking-[-0.04em]">{site.headline || `Homes for sale with ${agent.name}`}</h1>
        {site.subheadline && <p data-enter className="mt-4 max-w-[52ch] text-lead text-muted">{site.subheadline}</p>}
        <div className="relative mt-8 h-[52svh] min-h-80 overflow-hidden rounded-2xl bg-surface">
          {site.hero_image && (
            <Image src={sized(site.hero_image, 1920)} alt="" fill loading="eager" fetchPriority="high" sizes="(min-width: 1152px) 1088px, 100vw" className="object-cover" unoptimized />
          )}
          <form action={`${base}/search`} role="search" className="absolute inset-x-3 bottom-3 grid max-w-3xl grid-cols-1 gap-2 rounded-xl bg-ground p-2 sm:inset-x-5 sm:bottom-5 sm:grid-cols-[minmax(0,1fr)_11rem_auto]">
            <label>
              <span className="sr-only">City, neighborhood, ZIP or address</span>
              <input name="q" type="search" autoComplete="off" placeholder="Dundee, 68132 or an address…" className={field} />
            </label>
            <label>
              <span className="sr-only">Max price</span>
              <select name="maxPrice" defaultValue="" className={field}>
                <option value="">Any price</option>
                {PRICE_OPTIONS.map((p) => <option key={p} value={p}>Up to {shortMoney(p)}</option>)}
              </select>
            </label>
            <button type="submit" className="press h-12 rounded-lg bg-accent px-6 text-body font-semibold text-accent-ink hover:brightness-110">Search homes</button>
          </form>
        </div>
      </section>

      <Section id="homes-heading" title={showingNewest ? "New on the market" : `${first}’s featured homes`}>
        <div className="grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {homes.map((l, i) => <ListingCard key={l.id} listing={l} slug={slug} eager={i < 3} />)}
        </div>
        <Link data-enter href={`${base}/search`} className="mt-12 inline-flex h-12 items-center rounded-lg bg-raised px-6 text-body font-semibold hover:bg-active">
          See all homes for sale
        </Link>
      </Section>

      <section aria-labelledby="about-heading" className="mx-5 rounded-3xl bg-surface px-6 py-14 sm:mx-10 sm:px-10 lg:py-20 xl:mx-auto xl:max-w-6xl">
        <div className="grid grid-cols-1 items-start gap-10 md:grid-cols-[auto_minmax(0,1fr)]">
          <AgentAvatar name={agent.name} photo={site.photo_url} size={176} />
          <div data-enter>
            <h2 id="about-heading" className="text-head font-extrabold tracking-[-0.04em]">{agent.name}</h2>
            {(site.title || site.brokerage) && <p className="mt-2 text-body text-muted">{[site.title, site.brokerage].filter(Boolean).join(", ")}</p>}
            {site.bio && <p className="mt-6 line-clamp-5 max-w-[60ch] text-body">{site.bio}</p>}
            <Link href={`${base}/about`} className="mt-6 inline-block text-body font-semibold underline decoration-2 underline-offset-4 hover:text-accent-text">
              More about {first}
            </Link>
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <Section id="quotes-heading" title="What clients say">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            {testimonials.slice(0, 3).map((t) => (
              <figure key={t.author} data-enter>
                <blockquote className="text-body md:text-lead">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-small text-muted">{t.author}</figcaption>
              </figure>
            ))}
          </div>
        </Section>
      )}

      <section aria-labelledby="contact-heading" className="mx-5 mb-16 grid grid-cols-1 gap-10 rounded-3xl bg-surface px-6 py-14 sm:mx-10 sm:px-10 md:grid-cols-2 lg:mb-24 lg:py-20 xl:mx-auto xl:max-w-6xl">
        <div data-enter>
          <h2 id="contact-heading" className="text-head font-extrabold tracking-[-0.04em]">Thinking about buying or selling?</h2>
          <p className="mt-5 max-w-[44ch] text-body">
            Send {first} a note{site.phone ? <> or call <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} className="font-semibold underline underline-offset-4">{site.phone}</a></> : null}.
          </p>
        </div>
        <div data-enter><LeadForm slug={slug} /></div>
      </section>
    </>
  );
}
