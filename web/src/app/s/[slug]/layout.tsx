import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { Menu, Phone } from "lucide-react";
import { THEMES, themeVars } from "@/lib/themes";
import { loadSite } from "./data";
import { SiteMenu } from "./site-menu";
import { Track } from "./track";
import { Motion } from "@/components/motion";

export async function generateMetadata({ params }: LayoutProps<"/s/[slug]">): Promise<Metadata> {
  const { agent, site } = await loadSite((await params).slug);
  const title = site.seo_title || `${agent.name}, real estate`;
  return {
    title: { absolute: title, template: `%s | ${agent.name}` },
    description: site.seo_description || undefined,
  };
}

/** The browser chrome matches the agent’s theme, not the app’s dark default. */
export async function generateViewport({ params }: LayoutProps<"/s/[slug]">): Promise<Viewport> {
  const { site } = await loadSite((await params).slug);
  return { themeColor: THEMES[site.theme].ground, colorScheme: site.theme === "dark" ? "dark" : "light" };
}

const tel = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export default async function SiteLayout({ children, params }: LayoutProps<"/s/[slug]">) {
  const { slug } = await params;
  const { agent, site } = await loadSite(slug);
  const base = `/s/${slug}`;
  const nav = [
    { href: `${base}/search`, label: "Homes for sale" },
    { href: `${base}/about`, label: "About" },
    { href: `${base}/contact`, label: "Contact" },
  ];
  const brand = site.brokerage || agent.name;

  return (
    <div
      className="flex min-h-dvh flex-col bg-ground text-ink"
      style={{ ...themeVars(site.theme, site.accent_color), colorScheme: site.theme === "dark" ? "dark" : "light" } as React.CSSProperties}
    >
      <header className="sticky top-0 z-[1000] bg-ground">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-6 px-5 sm:px-10">
          <Link href={base} className="min-w-0">
            <span className="block truncate text-lead font-bold tracking-[-0.02em]">{brand}</span>
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-8 md:flex">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="text-body text-muted hover:text-ink">{n.label}</Link>
            ))}
            {site.phone && (
              <a href={tel(site.phone)} className="press rounded-lg inline-flex h-11 items-center gap-2 bg-accent hover:brightness-110 px-5 text-body font-semibold text-accent-ink">
                <Phone size={17} aria-hidden="true" /> {site.phone}
              </a>
            )}
          </nav>
          <SiteMenu>
            <summary className="flex size-11 cursor-pointer list-none items-center justify-center rounded-lg bg-raised [&::-webkit-details-marker]:hidden" aria-label="Menu">
              <Menu size={22} aria-hidden="true" />
            </summary>
            {/* taste-skill-ignore: the open menu is a real overlay */}<div className="absolute end-0 top-14 w-60 rounded-xl border border-rule bg-ground p-2 shadow-[0_12px_32px_rgba(17,24,39,0.12)]">
              <Link href={base} className="block rounded-lg px-3 py-3 text-body hover:bg-raised">Home</Link>
              {nav.map((n) => <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-3 text-body hover:bg-raised">{n.label}</Link>)}
              {site.phone && (
                <a href={tel(site.phone)} className="press rounded-lg mt-1 flex items-center justify-center gap-2 bg-accent hover:brightness-110 px-3 py-3 font-semibold text-accent-ink">
                  <Phone size={17} aria-hidden="true" /> Call {agent.name.split(" ")[0]}
                </a>
              )}
            </div>
          </SiteMenu>
        </div>
      </header>

      <main id="main" className="flex-1">{children}</main>

      <footer className="mt-auto bg-surface">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-5 py-12 text-body sm:px-10 md:grid-cols-3">
          <div>
            <p className="text-lead font-bold tracking-[-0.02em]">{brand}</p>
            <p className="mt-1 text-muted">{agent.name}{site.title ? `, ${site.title}` : ""}</p>
          </div>
          <div className="flex flex-col gap-1">
            {site.phone && <a href={tel(site.phone)} className="hover:underline">{site.phone}</a>}
            {site.public_email && <a href={`mailto:${site.public_email}`} className="break-all hover:underline">{site.public_email}</a>}
            {site.office_address && <p className="text-muted">{site.office_address}</p>}
          </div>
          <nav aria-label="Footer" className="flex flex-col gap-1">
            <Link href={base} className="hover:underline">Home</Link>
            {nav.map((n) => <Link key={n.href} href={n.href} className="hover:underline">{n.label}</Link>)}
          </nav>
        </div>
        <p className="mx-auto max-w-6xl px-5 pb-10 text-small text-faint sm:px-10">
          Listing information is deemed reliable but not guaranteed. Equal Housing Opportunity. Website by <Link href="/" className="underline hover:text-ink">imakepage</Link>.
        </p>
      </footer>
      <Track slug={slug} />
      <Motion />
    </div>
  );
}
