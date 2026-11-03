import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Phone } from "lucide-react";
import { getListing, similarListings } from "@/lib/listings";
import { daysSince, fullAddress, money, number, sized, unit } from "@/lib/format";
import { loadSite } from "../../data";
import { LeadForm } from "../../lead-form";
import { AgentAvatar, ListingCard, StatusTag, statusLabel } from "../../parts";

export async function generateMetadata({ params }: PageProps<"/s/[slug]/homes/[id]">): Promise<Metadata> {
  const listing = await getListing(Number((await params).id));
  if (!listing) return {};
  return {
    title: `${listing.street}, ${listing.city}`,
    description: `${money(listing.price)}. ${listing.beds} bed, ${listing.baths} bath, ${number(listing.sqft)} sq ft ${listing.property_type.toLowerCase()} in ${listing.neighborhood}.`,
    openGraph: { images: [sized(listing.photos[0], 1200)] },
  };
}

export default async function HomePage({ params }: PageProps<"/s/[slug]/homes/[id]">) {
  const { slug, id } = await params;
  const { agent, site } = await loadSite(slug);
  const listing = await getListing(Number(id));
  if (!listing) notFound();
  const similar = await similarListings(listing);
  const [main, ...rest] = listing.photos;
  const listedDaysAgo = daysSince(listing.listed_at);
  const status = statusLabel(listing);

  const stats = [
    [String(listing.beds), listing.beds === 1 ? "bed" : "beds"],
    [String(listing.baths), listing.baths === 1 ? "bath" : "baths"],
    [number(listing.sqft), "sq ft"],
    ...(listing.lot_acres > 0 ? [[String(listing.lot_acres), "acres"]] : []),
    [String(listing.year_built), "built"],
  ];
  const facts = [
    ["Type", listing.property_type],
    ["Neighborhood", listing.neighborhood],
    ["Status", listing.status[0].toUpperCase() + listing.status.slice(1)],
    ["On the market", listedDaysAgo === 0 ? "Listed today" : unit(listedDaysAgo, "day")],
    ["MLS number", listing.mls_number],
    ["Listing office", listing.listing_office],
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-10">
      <Link href={`/s/${slug}/search`} className="inline-flex items-center gap-2 text-body text-muted hover:text-ink">
        <ArrowLeft size={18} aria-hidden="true" /> Back to homes for sale
      </Link>

      <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-4 sm:grid-rows-2">
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl sm:col-span-2 sm:row-span-2 sm:aspect-auto sm:min-h-[28rem]">
          <Image src={sized(main, 1400)} alt={`Front of ${listing.street}`} fill loading="eager" fetchPriority="high" sizes="(min-width: 640px) 50vw, 100vw" className="object-cover" unoptimized />
          {status && <span className="absolute start-4 top-4"><StatusTag label={status} /></span>}
        </div>
        {rest.slice(0, 3).map((p, i) => (
          <div key={p} className={`relative hidden aspect-[4/3] overflow-hidden rounded-xl sm:block ${i === 2 ? "sm:col-span-2 sm:aspect-auto" : ""}`}>
            <Image src={sized(p, 800)} alt={`Inside ${listing.street}, photo ${i + 2}`} fill loading="lazy" sizes={i === 2 ? "50vw" : "25vw"} className="object-cover" unoptimized />
          </div>
        ))}
      </div>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[minmax(0,1fr)_24rem]">
        <div>
          <h1 data-enter className="text-head font-extrabold tracking-[-0.04em]">{fullAddress(listing)}</h1>
          <p data-enter className="figures mt-4 text-display font-extrabold tracking-[-0.04em]">{money(listing.price)}</p>
          {/* The home's numbers in one row of equal cells, each value with its unit on one line. */}
          <dl data-enter className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-rule sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none">
            {stats.map(([value, unitLabel]) => (
              <div key={unitLabel} className="bg-ground px-4 py-3 [&:last-child:nth-child(odd)]:col-span-2 sm:[&:last-child:nth-child(odd)]:col-span-1">
                <dt className="sr-only">{unitLabel}</dt>
                <dd className="whitespace-nowrap"><span className="text-lead font-bold tracking-[-0.02em]">{value}</span> <span className="text-body text-muted">{unitLabel}</span></dd>
              </div>
            ))}
          </dl>

          <h2 data-enter className="mt-14 text-lead font-semibold">About this home</h2>
          <p data-enter className="mt-3 max-w-[65ch] text-body">{listing.description}</p>

          <h2 data-enter className="mt-14 text-lead font-semibold">Details</h2>
          <dl className="mt-4">
            {facts.map(([k, v], i) => (
              <div key={k} data-enter className={`flex justify-between gap-4 rounded-lg px-4 py-3 text-body ${i % 2 === 0 ? "bg-surface" : ""}`}>
                <dt className="text-muted">{k}</dt>
                <dd className="text-end font-semibold">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <aside aria-label={`Ask ${agent.name} about this home`} className="lg:sticky lg:top-24 lg:self-start">
          <div data-enter className="rounded-2xl bg-surface p-6">
            <div className="mb-6 flex items-center gap-4">
              <AgentAvatar name={agent.name} photo={site.photo_url} size={56} />
              <div className="min-w-0">
                <p className="text-body font-semibold">{agent.name}</p>
                <p className="truncate text-small text-muted">{site.title || site.brokerage}</p>
              </div>
            </div>
            <LeadForm
              slug={slug}
              listingId={listing.id}
              allowTour={listing.status === "active"}
              defaultMessage={`I’m interested in ${listing.street}.`}
              submitLabel="Ask about this home"
            />
            {site.phone && (
              <a href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} className="mt-4 flex h-12 items-center justify-center gap-2 rounded-lg bg-ground text-body font-semibold hover:text-accent-text">
                <Phone size={17} aria-hidden="true" /> {site.phone}
              </a>
            )}
          </div>
        </aside>
      </div>

      {similar.length > 0 && (
        <section aria-labelledby="similar-heading" className="mt-28">
          <h2 id="similar-heading" data-enter className="text-head font-extrabold tracking-[-0.04em]">Similar homes</h2>
          <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((l) => <ListingCard key={l.id} listing={l} slug={slug} />)}
          </div>
        </section>
      )}
    </div>
  );
}
