import type { Metadata } from "next";
import Link from "next/link";
import { PROPERTY_TYPES, searchListings, type ListingFilters } from "@/lib/listings";
import { shortMoney, sized, unit } from "@/lib/format";
import { loadSite } from "../data";
import { ListingCard } from "../parts";
import { SearchResults } from "./results";

export const metadata: Metadata = { title: "Homes for sale" };

const PRICES = [200000, 300000, 400000, 500000, 750000, 1000000];
const label = shortMoney;
// 16px on phones so iOS does not zoom the page when a field is focused.
const control = "h-11 rounded-lg border border-rule bg-ground px-3 text-base text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-text";

export default async function SearchPage({ params, searchParams }: PageProps<"/s/[slug]/search">) {
  const { slug } = await params;
  await loadSite(slug);
  const sp = await searchParams;
  const str = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string) : "");
  const num = (k: string) => Number(str(k)) || undefined;
  const filters: ListingFilters = {
    q: str("q") || undefined,
    minPrice: num("minPrice"),
    maxPrice: num("maxPrice"),
    beds: num("beds"),
    baths: num("baths"),
    type: PROPERTY_TYPES.includes(str("type")) ? str("type") : undefined,
    sort: (["newest", "price-asc", "price-desc", "size"] as const).find((s) => s === str("sort")) ?? "newest",
  };
  const listings = searchListings(filters);
  const hasFilters = Boolean(filters.q || filters.minPrice || filters.maxPrice || filters.beds || filters.baths || filters.type);

  return (
    <>
      <div className="px-5 pb-6 pt-10 sm:px-10">
        <h1 data-enter className="text-display font-extrabold tracking-[-0.04em]">Homes for sale</h1>
        <p data-enter className="mt-4 max-w-[52ch] text-lead">{unit(listings.length, "home")} across the Omaha area, from Dundee to Gretna. Filter by price, beds or neighborhood.</p>
      </div>
      <form className="z-[999] bg-surface px-5 py-3 sm:px-10 lg:sticky lg:top-16" role="search" aria-label="Filter homes">
        <div className="flex flex-wrap items-center gap-2">
          <label className="min-w-0 flex-1 basis-full sm:basis-64">
            <span className="sr-only">City, neighborhood, ZIP or address</span>
            <input name="q" type="search" autoComplete="off" defaultValue={filters.q} placeholder="Dundee, 68132 or an address…" className={`${control} w-full placeholder:text-muted`} />
          </label>
          <select name="minPrice" defaultValue={str("minPrice")} aria-label="Min price" className={control}>
            <option value="">No min</option>
            {PRICES.map((p) => <option key={p} value={p}>{label(p)}+</option>)}
          </select>
          <select name="maxPrice" defaultValue={str("maxPrice")} aria-label="Max price" className={control}>
            <option value="">No max</option>
            {PRICES.map((p) => <option key={p} value={p}>Up to {label(p)}</option>)}
          </select>
          <select name="beds" defaultValue={str("beds")} aria-label="Bedrooms" className={control}>
            <option value="">Any beds</option>
            {[1, 2, 3, 4, 5].map((b) => <option key={b} value={b}>{b}+ beds</option>)}
          </select>
          <select name="baths" defaultValue={str("baths")} aria-label="Bathrooms" className={control}>
            <option value="">Any baths</option>
            {[1, 2, 3, 4].map((b) => <option key={b} value={b}>{b}+ baths</option>)}
          </select>
          <select name="type" defaultValue={str("type")} aria-label="Home type" className={control}>
            <option value="">Any type</option>
            {PROPERTY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button type="submit" className="press rounded-lg h-11 bg-accent hover:brightness-110 px-5 text-body font-semibold text-accent-ink">Update</button>
          {hasFilters && <Link href={`/s/${slug}/search`} className="px-2 text-body underline underline-offset-4 hover:text-accent-text">Clear filters</Link>}
        </div>
        <div className="mt-2 flex items-center justify-between gap-3 text-body">
          <p aria-live="polite"><span className="font-semibold">{listings.length}</span> {listings.length === 1 ? "home" : "homes"} for sale</p>
          <label className="flex items-center gap-2">
            Sort
            <select name="sort" defaultValue={filters.sort} className="h-10 rounded-lg border border-rule bg-ground px-2 text-base text-ink">
              <option value="newest">Newest</option>
              <option value="price-asc">Price (low to high)</option>
              <option value="price-desc">Price (high to low)</option>
              <option value="size">Largest</option>
            </select>
          </label>
        </div>
      </form>

      {listings.length ? (
        <SearchResults
          slug={slug}
          pins={listings.map((l) => ({ id: l.id, lat: l.lat, lng: l.lng, price: l.price, street: l.street, photo: sized(l.photos[0], 360) }))}
          cards={listings.map((l, i) => ({ id: l.id, node: <ListingCard listing={l} slug={slug} eager={i < 4} /> }))}
        />
      ) : (
        <div className="px-5 py-28 sm:px-10">
          <p className="text-head font-extrabold tracking-[-0.04em]">No homes match those filters</p>
          <p className="mt-4 text-body text-muted">Try a wider price range, or clear a filter.</p>
          <Link href={`/s/${slug}/search`} className="press rounded-lg mt-6 inline-flex h-12 items-center bg-accent hover:brightness-110 px-6 font-semibold text-accent-ink">Clear all filters</Link>
        </div>
      )}
    </>
  );
}
