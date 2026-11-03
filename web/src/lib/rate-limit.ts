import "server-only";
import { headers } from "next/headers";
import { get, run } from "./db";

/**
 * Fixed-window counter stored in the database, so every server shares it. Returns true
 * if the action is allowed, and counts it.
 */
export async function allow(key: string, limit: number, windowSeconds: number): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  const row = await get<{ count: number; window_start: number }>(
    "SELECT count, window_start FROM rate_limits WHERE key = ?", key,
  );
  if (!row || now - row.window_start >= windowSeconds) {
    await run(
      `INSERT INTO rate_limits (key, count, window_start) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET count = 1, window_start = excluded.window_start`,
      key, now,
    );
    return true;
  }
  if (row.count >= limit) return false;
  await run("UPDATE rate_limits SET count = count + 1 WHERE key = ?", key);
  return true;
}

/** Forget a counter, e.g. failed logins after a successful one. */
export async function reset(key: string) {
  await run("DELETE FROM rate_limits WHERE key = ?", key);
}

/** Best-effort client address. Behind a proxy, set it to pass X-Forwarded-For. */
export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}
