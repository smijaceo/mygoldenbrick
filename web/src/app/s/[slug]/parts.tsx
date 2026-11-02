import Image from "next/image";
import Link from "next/link";
import { daysSince, money, number, sized, unit } from "@/lib/format";
import type { Listing } from "@/lib/types";
import { cx } from "@/components/ui";

/** "New", "Pending" or "Sold", shown on a listing’s photo. */
export function StatusTag({ label }: { label: string }) {
  return <span className="inline-block rounded-md bg-accent px-2.5 py-1 text-small font-semibold whitespace-nowrap text-accent-ink">{label}</span>;
}

export function statusLabel(listing: Listing) {
  if (listing.status === "pending") return "Pending";
  if (listing.status === "sold") return "Sold";
  if (daysSince(listing.listed_at) <= 7) return "New";
  return null;
}

export function ListingCard({ listing, slug, eager = false }: { listing: Listing; slug: string; eager?: boolean }) {
  const status = statusLabel(listing);
  return (
    <Link href={`/s/${slug}/homes/${listing.id}`} data-enter className="group block lg:scroll-mt-48">
      <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-surface">
        <Image
          src={sized(listing.photos[0], 640)}
          alt={`Front of ${listing.street}`}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
          loading={eager ? "eager" : "lazy"}
          unoptimized
        />
        {status && <span className="absolute start-3 top-3"><StatusTag label={status} /></span>}
      </div>
      <p className="figures mt-3 text-lead font-extrabold tracking-[-0.03em]">{money(listing.price)}</p>
      <p className="mt-1 text-body text-muted">
        {unit(listing.beds, "bed")}, {unit(listing.baths, "bath")}, {number(listing.sqft)} sq ft
      </p>
      <p className="truncate text-body group-hover:text-accent-text">{listing.street}, {listing.neighborhood}</p>
    </Link>
  );
}

export function AgentAvatar({ name, photo, size = 96, className }: { name: string; photo: string; size?: number; className?: string }) {
  const initials = name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  if (photo) {
    return <Image src={sized(photo, size * 2)} alt={name} width={size} height={size} className={cx("shrink-0 rounded-full object-cover", className)} unoptimized />;
  }
  return (
    <span
      className={cx("flex shrink-0 items-center justify-center rounded-full bg-accent font-extrabold tracking-[-0.04em] text-accent-ink", className)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      role="img"
      aria-label={name}
    >
      {initials}
    </span>
  );
}

export function Section({ title, children, className, id }: { title: string; children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section aria-labelledby={id} className={cx("mx-auto max-w-6xl px-5 py-20 sm:px-10 lg:py-28", className)}>
      <h2 id={id} data-enter className="text-head font-extrabold tracking-[-0.04em]">{title}</h2>
      <div className="mt-10">{children}</div>
    </section>
  );
}
