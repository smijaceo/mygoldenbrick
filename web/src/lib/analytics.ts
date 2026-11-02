import "server-only";
import { all, get, run } from "./db";
import { todayIso } from "./format";

export function recordView(agentId: number, visitorId: string, path: string, listingId: number | null) {
  // Ignore repeat views of the same page by the same visitor within 30 minutes.
  const recent = get<{ id: number }>(
    `SELECT id FROM page_views WHERE agent_id = ? AND visitor_id = ? AND path = ?
     AND created_at >= datetime('now', '-30 minutes')`,
    agentId, visitorId, path,
  );
  if (recent) return;
  run(
    "INSERT INTO page_views (agent_id, visitor_id, path, listing_id) VALUES (?, ?, ?, ?)",
    agentId, visitorId, path, listingId,
  );
}

export function trafficSummary(agentId: number) {
  const week = get<{ visitors: number; views: number }>(
    `SELECT COUNT(DISTINCT visitor_id) AS visitors, COUNT(*) AS views FROM page_views
     WHERE agent_id = ? AND created_at >= datetime('now', '-7 days')`,
    agentId,
  )!;
  const counted = all<{ day: string; views: number }>(
    `SELECT date(created_at, 'localtime') AS day, COUNT(*) AS views FROM page_views
     WHERE agent_id = ? AND date(created_at, 'localtime') >= ?
     GROUP BY day`,
    agentId, todayIso(-13),
  );
  // One bar per day for the last 14 days, including days with no visits.
  const byDay = new Map(counted.map((r) => [r.day, r.views]));
  const daily = Array.from({ length: 14 }, (_, i) => {
    const day = todayIso(i - 13);
    return { day, views: byDay.get(day) ?? 0 };
  });
  const topListings = all<{ listing_id: number; street: string; views: number }>(
    `SELECT p.listing_id, l.street, COUNT(*) AS views FROM page_views p
     JOIN listings l ON l.id = p.listing_id
     WHERE p.agent_id = ? AND p.created_at >= datetime('now', '-7 days')
     GROUP BY p.listing_id ORDER BY views DESC LIMIT 5`,
    agentId,
  );
  return { ...week, daily, topListings };
}
