import type { ReactNode } from "react";

/** One feature: a short title and line, over a real slice of the product on a white panel. */
function Card({ title, body, children }: { title: string; body: string; children: ReactNode }) {
  return (
    <article data-enter className="flex flex-col rounded-2xl bg-surface p-6">
      <h3 className="text-body font-semibold">{title}</h3>
      <p className="mt-1.5 max-w-[40ch] text-body text-muted">{body}</p>
      <div data-ui="" className="mt-6 flex-1 rounded-xl border border-rule bg-ground p-4 text-small">{children}</div>
    </article>
  );
}

const STAGE_DOT: Record<string, string> = { New: "#d4a843", Showing: "#2e8b57", Offer: "#d9622b" };

export function Features() {
  return (
    <section aria-labelledby="features-heading" className="mx-auto max-w-6xl px-5 py-24 sm:px-10 lg:py-32">
      <h2 id="features-heading" data-enter className="text-center text-head font-extrabold tracking-[-0.04em]">Everything in one login</h2>
      <p data-enter className="mx-auto mt-4 max-w-[52ch] text-center text-body text-muted">The site buyers find you on and the place you answer them, built to work together.</p>
      <div className="mt-14 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card title="A site that’s yours" body="Your name, your town, your colour. Change a line and it’s live.">
          <p className="text-faint">Theme</p>
          <div className="mt-2 grid grid-cols-2 gap-2 font-semibold">
            <span className="rounded-lg border-2 border-ink px-3 py-2">Light</span>
            <span className="rounded-lg bg-[#111111] px-3 py-2 text-[#f2f2f2]">Dark</span>
          </div>
          <p className="mt-4 text-faint">Button colour</p>
          <div className="mt-2 flex gap-2">
            {["#111827", "#d4a843", "#1e3a5f", "#2e6b4f", "#9a3b1b"].map((c) => (
              <span key={c} className="size-7 rounded-md" style={{ background: c }} aria-hidden="true" />
            ))}
          </div>
        </Card>
        <Card title="Home search with a map" body="The filters buyers actually use, quick on any phone.">
          <div className="flex flex-wrap gap-2">
            {["Up to $500K", "3+ beds", "Dundee"].map((f) => <span key={f} className="rounded-md bg-raised px-2.5 py-1">{f}</span>)}
          </div>
          {[["$338,000", "2445 Stone Gate Rd"], ["$344,000", "7810 Walnut Ave"], ["$412,000", "3540 Pine St"]].map(([p, s]) => (
            <div data-ui="" key={s} className="mt-2 flex items-baseline justify-between gap-3 border-t border-rule pt-2">
              <span className="font-bold">{p}</span>
              <span className="min-w-0 truncate text-muted">{s}</span>
            </div>
          ))}
        </Card>
        <Card title="One inbox for every enquiry" body="Contact forms, tour requests and questions about a home, newest first.">
          {[["Taylor Brooks", "Tour request, Sat Oct 31", true], ["Chris Nguyen", "What’s my home worth?", true], ["Morgan Ellis", "Is the yard fenced?", false]].map(([n, m, unread]) => (
            <div data-ui="" key={n as string} className="flex items-start gap-2 border-b border-rule py-2 last:border-0">
              <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${unread ? "bg-accent" : "bg-transparent"}`} />
              <span className="min-w-0"><span className={unread ? "font-semibold" : ""}>{n}</span><span className="block truncate text-muted">{m}</span></span>
            </div>
          ))}
        </Card>
        <Card title="A pipeline you can drag" body="Move people from New to Closed. Notes and replies stay with each person.">
          <div className="grid grid-cols-2 gap-3">
            {[["Showing", ["Jamie Lopez", "Taylor Brooks"]], ["Offer", ["Riley Chen"]]].map(([col, people]) => (
              <div key={col as string}>
                <p className="mb-2 flex items-center gap-1.5 font-semibold"><span aria-hidden="true" className="size-2 rounded-full" style={{ background: STAGE_DOT[col as string] }} />{col}</p>
                {(people as string[]).map((p) => <p key={p} className="mb-2 rounded-lg border border-rule px-3 py-2">{p}</p>)}
              </div>
            ))}
          </div>
        </Card>
        <Card title="Today, at a glance" body="Who’s waiting on you, what’s due, and who looked at your site this week.">
          <p className="font-semibold">2 people are waiting on a reply</p>
          <div data-ui="" className="mt-3 flex items-center justify-between gap-3 border-t border-rule pt-3">
            <span>Confirm Saturday tour time</span><span className="font-semibold text-accent-text">Today</span>
          </div>
          <div data-ui="" className="mt-2 flex items-center justify-between gap-3 border-t border-rule pt-2">
            <span>Prepare a home value estimate</span><span className="text-faint">Mon</span>
          </div>
        </Card>
        <Card title="Replies in one place" body="Answer from the lead’s page. The history keeps itself.">
          <p className="rounded-lg bg-surface px-3 py-2">“Is the basement finished? We’d love to see it this weekend.”</p>
          <p className="mt-2 rounded-lg border border-rule px-3 py-2">Hi Taylor, yes, it’s finished. Saturday at 11 works…</p>
          <span className="mt-3 inline-block rounded-lg bg-ink px-3 py-1.5 font-semibold text-ground">Send reply</span>
        </Card>
      </div>
    </section>
  );
}
