import { get } from "@/lib/db";
import { recordView } from "@/lib/analytics";
import { allow, clientIp } from "@/lib/rate-limit";

export async function POST(request: Request) {
  // Only count beacons sent by our own pages, and cap volume per address,
  // so nobody can inflate an agent's visitor numbers from outside.
  const origin = request.headers.get("origin");
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  if (origin && new URL(origin).host !== host) {
    return new Response(null, { status: 403 });
  }
  if (!allow(`track-ip:${await clientIp()}`, 300, 3600)) return new Response(null, { status: 429 });

  let data: { slug?: unknown; path?: unknown; visitor?: unknown };
  try {
    data = await request.json();
  } catch {
    return new Response(null, { status: 400 });
  }
  const { slug, path, visitor } = data;
  if (typeof slug !== "string" || typeof path !== "string" || typeof visitor !== "string") {
    return new Response(null, { status: 400 });
  }
  const agent = get<{ id: number }>("SELECT id FROM agents WHERE slug = ?", slug);
  if (!agent) return new Response(null, { status: 404 });

  const cleanPath = path.slice(0, 200);
  const match = /^\/homes\/(\d+)$/.exec(cleanPath);
  const listingId = match ? Number(match[1]) : null;
  const listingExists = listingId ? get("SELECT 1 FROM listings WHERE id = ?", listingId) : null;
  recordView(agent.id, visitor.slice(0, 64), cleanPath, listingExists ? listingId : null);
  return new Response(null, { status: 204 });
}
