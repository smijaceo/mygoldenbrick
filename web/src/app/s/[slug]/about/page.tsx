import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { sized } from "@/lib/format";
import { loadSite } from "../data";
import { HomesStrip } from "../homes-strip";
import { AgentAvatar } from "../parts";

export const metadata: Metadata = { title: "About" };

export default async function AboutPage({ params }: PageProps<"/s/[slug]/about">) {
  const { slug } = await params;
  const { agent, site, testimonials } = await loadSite(slug);
  const first = agent.name.split(" ")[0];

  return (
    <>
      <section className="mx-auto max-w-6xl px-5 pt-10 sm:px-10 lg:pt-14">
        {site.hero_image && (
          <div className="relative h-56 overflow-hidden rounded-2xl bg-surface sm:h-72">
            <Image src={sized(site.hero_image, 1600)} alt="" fill loading="eager" sizes="(min-width: 1152px) 1088px, 100vw" className="object-cover" unoptimized />
          </div>
        )}
        <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-[auto_minmax(0,1fr)]">
          <div data-enter><AgentAvatar name={agent.name} photo={site.photo_url} size={160} /></div>
          <div data-enter>
            <h1 className="text-display font-extrabold tracking-[-0.04em]">{agent.name}</h1>
            {(site.title || site.brokerage) && <p className="mt-3 text-lead text-muted">{[site.title, site.brokerage].filter(Boolean).join(", ")}</p>}
            {site.service_area && <p className="mt-2 text-body">Serving {site.service_area}</p>}
            {site.bio ? (
              <div className="mt-8 flex max-w-[62ch] flex-col gap-5 text-body">
                {site.bio.split(/\n{2,}/).map((p, i) => <p key={i}>{p}</p>)}
              </div>
            ) : (
              <p className="mt-8 text-body text-muted">{first} hasn’t written a bio yet.</p>
            )}
          </div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section aria-labelledby="stories-heading" className="mx-5 mt-16 rounded-3xl bg-surface px-6 py-14 sm:mx-10 sm:px-10 lg:py-20 xl:mx-auto xl:max-w-6xl">
          <h2 id="stories-heading" data-enter className="text-head font-extrabold tracking-[-0.04em]">Client stories</h2>
          <div className="mt-10 grid grid-cols-1 gap-12 md:grid-cols-2">
            {testimonials.map((t) => (
              <figure key={t.author} data-enter>
                <blockquote className="text-body md:text-lead">“{t.quote}”</blockquote>
                <figcaption className="mt-4 text-small text-muted">{t.author}</figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <HomesStrip agentId={agent.id} slug={slug} title={`Homes ${first} is showing`} />

      <section aria-labelledby="talk-heading" className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-8 px-5 pb-20 sm:px-10">
        <h2 id="talk-heading" data-enter className="max-w-[18ch] text-head font-extrabold tracking-[-0.04em]">Let’s talk about your move</h2>
        <Link href={`/s/${slug}/contact`} className="press inline-flex h-14 items-center rounded-lg bg-accent px-8 text-body font-semibold text-accent-ink hover:brightness-110">
          Contact {first}
        </Link>
      </section>
    </>
  );
}
