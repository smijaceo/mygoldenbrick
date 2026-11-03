import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Search, Star } from "lucide-react";
import { requireAgent } from "@/lib/auth";
import { getFeaturedIds, getFeaturedListings, searchListings } from "@/lib/listings";
import { money, number, sized, unit } from "@/lib/format";
import { ActionForm } from "@/components/action-form";
import { Card, CardHeader, EmptyState, PageHeader, cx, inputBase } from "@/components/ui";
import { toggleFeatured } from "../actions";
import type { Listing } from "@/lib/types";

export const metadata: Metadata = { title: "Listings" };

function ListingRow({ listing, featured, slug }: { listing: Listing; featured: boolean; slug: string }) {
  return (
    <li className="flex items-center gap-3 px-5 py-2.5 [contain-intrinsic-size:auto_68px] [content-visibility:auto] sm:gap-4">
      <div className="relative h-12 w-16 flex-none overflow-hidden rounded-sm">
        <Image src={sized(listing.photos[0], 160)} alt="" fill sizes="64px" className="object-cover" unoptimized />
      </div>
      <div className="min-w-0 flex-1">
        <Link href={`/s/${slug}/homes/${listing.id}`} target="_blank" className="block truncate text-sm text-ink hover:underline">
          {listing.street}
        </Link>
        <p className="figures-col flex flex-wrap gap-x-3 text-sm text-muted">
          <span>{listing.neighborhood}</span>
          <span>{unit(listing.beds, "bed")}</span>
          <span>{unit(listing.baths, "bath")}</span>
          <span className="max-sm:hidden">{number(listing.sqft)} sq ft</span>
          {listing.status !== "active" && <span className="text-ink">{listing.status === "sold" ? "Sold" : "Pending"}, hidden from your home page</span>}
        </p>
      </div>
      <p className="figures-col flex-none text-right text-sm font-semibold text-ink">{money(listing.price)}</p>
      <ActionForm
        action={toggleFeatured.bind(null, listing.id, !featured)}
        success={featured ? `${listing.street} removed from featured` : `${listing.street} featured on your site`}
        className="flex flex-none sm:w-32 sm:justify-end"
      >
        <button
          type="submit"
          aria-pressed={featured}
          aria-label={`Feature ${listing.street} on my site`}
          className={cx(
            "press flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm font-semibold hover:bg-raised",
            featured ? "text-ink" : "text-muted hover:text-ink",
          )}
        >
          <Star size={16} strokeWidth={1.75} className={featured ? "fill-accent text-accent-text" : ""} aria-hidden="true" />
          <span className="max-sm:sr-only">{featured ? "Featured" : "Feature"}</span>
        </button>
      </ActionForm>
    </li>
  );
}

export default async function ListingsPage({ searchParams }: PageProps<"/app/listings">) {
  const agent = await requireAgent();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const featuredIds = await getFeaturedIds(agent.id);
  const featured = await getFeaturedListings(agent.id);
  const results = await searchListings({ q }, 60);

  return (
    <>
      <PageHeader
        title="Listings"
        sub={`${unit(featured.length, "home")} featured on your website’s home page.`}
        action={
          <form role="search" className="relative w-full sm:w-80">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input name="q" type="search" defaultValue={q} placeholder="Address, neighborhood, ZIP or MLS #…" aria-label="Search listings" className={cx(inputBase, "w-full pl-9")} />
          </form>
        }
      />

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="Featured on your site" sub="Your home page shows up to six of these that are still for sale." />
          {featured.length ? (
            <ul className="pb-2">{featured.map((l) => <ListingRow key={l.id} listing={l} featured slug={agent.slug} />)}</ul>
          ) : (
            <EmptyState title="No featured homes yet.">Star a home below to show it on your home page.</EmptyState>
          )}
        </Card>

        <Card>
          <CardHeader
            title={q ? `Listings matching “${q}”` : "All active listings"}
            sub={`${unit(results.length, "home")}. Sample listings for now: a live MLS feed plugs in here once you have an IDX agreement.`}
          />
          {results.length ? (
            <ul className="pb-2">{results.map((l) => <ListingRow key={l.id} listing={l} featured={featuredIds.has(l.id)} slug={agent.slug} />)}</ul>
          ) : (
            <EmptyState title="No listings match.">Try a different address or neighborhood.</EmptyState>
          )}
        </Card>
      </div>
    </>
  );
}
