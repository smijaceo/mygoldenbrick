import Link from "next/link";
import { getFeaturedListings, searchListings } from "@/lib/listings";
import { ListingCard } from "./parts";

/** Three homes for sale (the agent's featured ones first), so every page has a next step for buyers. */
export async function HomesStrip({ agentId, slug, title }: { agentId: number; slug: string; title: string }) {
  let homes = (await getFeaturedListings(agentId)).filter((l) => l.status === "active").slice(0, 3);
  if (homes.length < 3) homes = [...homes, ...(await searchListings({ sort: "newest" }, 6)).filter((l) => !homes.some((h) => h.id === l.id))].slice(0, 3);
  return (
    <section aria-labelledby="strip-heading" className="mx-auto max-w-6xl px-5 py-16 sm:px-10 lg:py-20">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 id="strip-heading" data-enter className="text-head font-extrabold tracking-[-0.04em]">{title}</h2>
        <Link href={`/s/${slug}/search`} className="text-body font-semibold underline underline-offset-4">See all homes</Link>
      </div>
      <div className="mt-8 grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-3">
        {homes.map((l) => <ListingCard key={l.id} listing={l} slug={slug} />)}
      </div>
    </section>
  );
}
