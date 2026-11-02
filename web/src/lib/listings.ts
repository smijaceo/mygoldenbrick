import "server-only";
import { all, get, run } from "./db";
import type { Listing } from "./types";

/**
 * The listing source. v1 reads fictional sample listings from the local database.
 * To connect a real IDX/MLS feed later, replace the bodies of these functions.
 * Also update the few places that join the `listings` table directly for a
 * street name: leads.ts (listLeads, getLead), analytics.ts (topListings),
 * api/track/route.ts, and the foreign keys in db.ts.
 */

type ListingRow = Omit<Listing, "photos"> & { photos: string };

const toListing = (row: ListingRow): Listing => ({ ...row, photos: JSON.parse(row.photos) });

export type ListingFilters = {
  q?: string;
  minPrice?: number;
  maxPrice?: number;
  beds?: number;
  baths?: number;
  type?: string;
  status?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "size";
};

const SORTS: Record<NonNullable<ListingFilters["sort"]>, string> = {
  newest: "listed_at DESC",
  "price-asc": "price ASC",
  "price-desc": "price DESC",
  size: "sqft DESC",
};

export function searchListings(filters: ListingFilters, limit = 200): Listing[] {
  const where: string[] = [];
  const params: (string | number)[] = [];
  if (filters.q) {
    where.push("(street || ' ' || city || ' ' || zip || ' ' || neighborhood || ' ' || mls_number) LIKE ?");
    params.push(`%${filters.q.trim()}%`);
  }
  if (filters.minPrice) { where.push("price >= ?"); params.push(filters.minPrice); }
  if (filters.maxPrice) { where.push("price <= ?"); params.push(filters.maxPrice); }
  if (filters.beds) { where.push("beds >= ?"); params.push(filters.beds); }
  if (filters.baths) { where.push("baths >= ?"); params.push(filters.baths); }
  if (filters.type) { where.push("property_type = ?"); params.push(filters.type); }
  where.push("status = ?");
  params.push(filters.status || "active");
  const order = SORTS[filters.sort ?? "newest"] ?? SORTS.newest;
  return all<ListingRow>(
    `SELECT * FROM listings WHERE ${where.join(" AND ")} ORDER BY ${order} LIMIT ?`,
    ...params, limit,
  ).map(toListing);
}

export function getListing(id: number): Listing | undefined {
  const row = get<ListingRow>("SELECT * FROM listings WHERE id = ?", id);
  return row && toListing(row);
}

export function getFeaturedListings(agentId: number): Listing[] {
  return all<ListingRow>(
    `SELECT l.* FROM featured_listings f JOIN listings l ON l.id = f.listing_id
     WHERE f.agent_id = ? ORDER BY f.created_at DESC, l.id`,
    agentId,
  ).map(toListing);
}

export function getFeaturedIds(agentId: number): Set<number> {
  return new Set(
    all<{ listing_id: number }>("SELECT listing_id FROM featured_listings WHERE agent_id = ?", agentId)
      .map((r) => r.listing_id),
  );
}

export function setFeatured(agentId: number, listingId: number, featured: boolean) {
  if (featured) {
    run("INSERT OR IGNORE INTO featured_listings (agent_id, listing_id) VALUES (?, ?)", agentId, listingId);
  } else {
    run("DELETE FROM featured_listings WHERE agent_id = ? AND listing_id = ?", agentId, listingId);
  }
}

export function similarListings(listing: Listing, limit = 3): Listing[] {
  return all<ListingRow>(
    `SELECT * FROM listings WHERE id != ? AND status = 'active'
     ORDER BY (neighborhood = ?) DESC, ABS(price - ?) LIMIT ?`,
    listing.id, listing.neighborhood, listing.price, limit,
  ).map(toListing);
}

export const PROPERTY_TYPES = ["Single Family", "Townhome", "Condo"];
