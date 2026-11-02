import type { Metadata } from "next";
import Image from "next/image";
import { sized } from "@/lib/format";
import { loadSite } from "../data";
import { HomesStrip } from "../homes-strip";
import { LeadForm } from "../lead-form";
import { AgentAvatar } from "../parts";

export const metadata: Metadata = { title: "Contact" };

export default async function ContactPage({ params }: PageProps<"/s/[slug]/contact">) {
  const { slug } = await params;
  const { agent, site } = await loadSite(slug);
  const first = agent.name.split(" ")[0];

  return (
    <>
      <section className="mx-auto grid max-w-6xl grid-cols-1 gap-12 px-5 pt-10 sm:px-10 md:grid-cols-2 lg:pt-14">
        <div>
          <div data-enter className="flex items-center gap-4">
            <AgentAvatar name={agent.name} photo={site.photo_url} size={64} />
            <h1 className="text-head font-extrabold tracking-[-0.04em]">Talk to {first}</h1>
          </div>
          <p data-enter className="mt-5 max-w-[44ch] text-body">Buying, selling, or curious what your home is worth? Call, email or send a note.</p>
          {site.phone && (
            <a data-enter href={`tel:${site.phone.replace(/[^\d+]/g, "")}`} className="mt-8 block text-display font-extrabold tracking-[-0.04em] hover:text-accent-text">
              {site.phone}
            </a>
          )}
          {site.public_email && (
            <a href={`mailto:${site.public_email}`} className="mt-3 block break-all text-lead hover:text-accent-text">{site.public_email}</a>
          )}
          {site.office_address && (
            <a
              href={`https://www.openstreetmap.org/search?query=${encodeURIComponent(site.office_address)}`}
              target="_blank"
              rel="noopener"
              className="mt-3 block text-body text-muted underline underline-offset-4 hover:text-ink"
            >
              {site.office_address}
            </a>
          )}
          {site.hero_image && (
            <div data-enter className="relative mt-10 hidden h-80 overflow-hidden rounded-2xl bg-surface md:block">
              <Image src={sized(site.hero_image, 1200)} alt="" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" unoptimized />
            </div>
          )}
        </div>
        <div data-enter className="rounded-2xl bg-surface p-6 md:self-start">
          <LeadForm slug={slug} />
        </div>
      </section>

      <HomesStrip agentId={agent.id} slug={slug} title="Homes for sale now" />
    </>
  );
}
