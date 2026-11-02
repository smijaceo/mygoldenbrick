import type { Listing } from "./types";

export const money = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const compactMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumSignificantDigits: 3,
});

/** "$344K", "$1.25M" */
export const shortMoney = (n: number) => compactMoney.format(n);

/** Shown when a listing comes through with no photos. */
const NO_PHOTO = "https://images.unsplash.com/photo-1568605114967-8130f3a36994";

/** Ask the image host for a right-sized copy when it supports that (Unsplash does). */
export function sized(url: string | undefined, width: number) {
  if (!url) url = NO_PHOTO;
  if (!url.startsWith("https://images.unsplash.com/")) return url;
  const u = new URL(url);
  u.searchParams.set("w", String(width));
  u.searchParams.set("q", "70");
  u.searchParams.set("auto", "format");
  u.searchParams.set("fit", "crop");
  return u.toString();
}

export const number = (n: number) => n.toLocaleString("en-US");

/** "1 bed", "2 beds", "1.5 baths". */
export const unit = (n: number, word: string) => `${n} ${n === 1 ? word : `${word}s`}`;

/** One address line: "123 Maple Street, Omaha, NE 68132". Never repeats the city. */
export const fullAddress = (l: Pick<Listing, "street" | "city" | "state" | "zip">) =>
  `${l.street}, ${l.city}, ${l.state} ${l.zip}`;

/** SQLite stores UTC as "YYYY-MM-DD HH:MM:SS". */
export const parseDb = (s: string) => new Date(s.includes("T") ? s : `${s.replace(" ", "T")}Z`);

export const daysSince = (s: string) =>
  Math.max(0, Math.round((Date.now() - parseDb(s).getTime()) / 86400000));

export function timeAgo(s: string) {
  const diff = Date.now() - parseDb(s).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return parseDb(s).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export const shortDate = (isoDate: string) =>
  new Date(`${isoDate.slice(0, 10)}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric",
  });

/** A local calendar date as "YYYY-MM-DD". */
export function isoFromDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** "YYYY-MM-DD" as that local day, or undefined when it is not a real date. */
export function dateFromIso(s: string): Date | undefined {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return undefined;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isoFromDate(d) === s ? d : undefined;
}

/** Local calendar date, "YYYY-MM-DD", offset by whole days. */
export function todayIso(offsetDays = 0) {
  return isoFromDate(new Date(Date.now() + offsetDays * 86400000));
}
