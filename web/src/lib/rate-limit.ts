import "server-only";
import { headers } from "next/headers";
import { get, run } from "./db";

/**
 * Fixed-window counter stored in SQLite. Returns true if the action is allowed,
 * and counts it. Good enough for a single server; swap for a shared store if
 * the app ever runs on several machines.
 */
export function allow(key: string, limit: number, windowSeconds: number): boolean {
  const now = Math.floor(Date.now() / 1000);
  const row = get<{ count: number; window_start: number }>(
    "SELECT count, window_start FROM rate_limits WHERE key = ?", key,
  );
  if (!row || now - row.window_start >= windowSeconds) {
    run(
      `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET count = 1, window_start = excluded.window_start`,
      key, now,
    );
    return true;
  }
  if (row.count >= limit) return false;
  run("UPDATE rate_limits SET count = count + 1 WHERE key = ?", key);
  return true;
}

/** Forget a counter, e.g. failed logins after a successful one. */
export function reset(key: string) {
  run("DELETE FROM rate_limits WHERE key = ?", key);
}

/** Best-effort client address. Behind a proxy, set it to pass X-Forwarded-For. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}
