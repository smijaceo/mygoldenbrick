import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { requireAgent } from "@/lib/auth";
import { getLead, getLeadEvents, listLeads, markLeadRead } from "@/lib/leads";
import { getListing } from "@/lib/listings";
import { timeAgo } from "@/lib/format";
import { SOURCE_LABELS, STAGES, stageLabel } from "@/lib/types";
import { Badge, EmptyState, NeedsYou, PageHeader, cx, inputBase } from "@/components/ui";
import { LeadPanel } from "./lead-panel";
import { StageFilter } from "./stage-filter";

export const metadata: Metadata = { title: "Leads" };

export default async function LeadsPage({ searchParams }: PageProps<"/app/leads">) {
  const agent = await requireAgent();
  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : "";
  const stage = typeof sp.stage === "string" && STAGES.some((s) => s.id === sp.stage) ? sp.stage : "";
  const openId = Number(typeof sp.lead === "string" ? sp.lead : "") || 0;

  // Counts follow the search, so each tab says how many rows it will show.
  const matching = await listLeads(agent.id, { q });
  const leads = stage ? matching.filter((l) => l.stage === stage) : matching;
  const all = q ? await listLeads(agent.id) : matching;

  // The lead opened in the side panel (desktop); opening it marks it read, as the full page does.
  const open = openId ? await getLead(agent.id, openId) : undefined;
  if (open?.unread) await markLeadRead(agent.id, open.id);
  const unread = all.filter((l) => l.unread && l.id !== open?.id).length;
  const people = all.length === 1 ? "1 person" : `${all.length} people`;

  const hrefFor = (params: { stage?: string; lead?: number }) => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    const st = params.stage ?? stage;
    if (st) p.set("stage", st);
    if (params.lead) p.set("lead", String(params.lead));
    return `/app/leads${p.size ? `?${p}` : ""}`;
  };
  const options = [{ id: "", label: "All", count: matching.length }, ...STAGES.map((s) => ({ id: s.id as string, label: s.label as string, count: matching.filter((l) => l.stage === s.id).length }))];

  return (
    <>
      <PageHeader
        title="Leads"
        sub={`${people} reached out through your website${unread ? `; ${unread} waiting on you` : ""}.`}
        action={
          <form role="search" className="relative w-full sm:w-72">
            {stage && <input type="hidden" name="stage" value={stage} />}
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" aria-hidden="true" />
            <input name="q" type="search" defaultValue={q} placeholder="Name, email or phone…" aria-label="Search leads" className={cx(inputBase, "w-full pl-9")} />
          </form>
        }
      />

      <nav aria-label="Filter by stage" className="mb-2 hidden flex-wrap gap-1 md:flex">
        {options.map((o) => {
          const active = stage === o.id;
          return (
            <Link
              key={o.id || "all"}
              href={hrefFor({ stage: o.id })}
              aria-current={active ? "page" : undefined}
              className={cx("flex h-8 items-center gap-1.5 rounded-lg px-3 text-sm transition-colors", active ? "bg-ink font-semibold text-ground" : "text-muted hover:bg-raised hover:text-ink")}
            >
              {o.label} <span className={cx("figures-col", active ? "text-ground/70" : "text-faint")}>{o.count}</span>
            </Link>
          );
        })}
      </nav>
      <div className="mb-4 md:hidden">
        <StageFilter value={stage} options={options.map((o) => ({ ...o, href: hrefFor({ stage: o.id }) }))} />
      </div>

      <div className={cx("grid grid-cols-1 items-start gap-6", open && "lg:grid-cols-[minmax(0,1fr)_380px]")}>
        <div className="min-w-0">
          {leads.length ? (
            <table className="w-full table-fixed border-collapse text-sm">
              <thead>
                <tr className="border-b border-rule text-left text-faint">
                  <th scope="col" className="w-[38%] py-2.5 pl-2 pr-3 font-normal">Name</th>
                  <th scope="col" className="w-[26%] py-2.5 pr-3 font-normal">Stage</th>
                  <th scope="col" className="hidden py-2.5 pr-3 font-normal sm:table-cell">Came from</th>
                  <th scope="col" className="w-20 py-2.5 pr-2 text-right font-normal">When</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((l) => {
                  const selected = l.id === open?.id;
                  const isUnread = Boolean(l.unread) && !selected;
                  return (
                    <tr key={l.id} className={cx("relative border-b border-rule transition-colors", selected ? "bg-[#fbf6e8]" : "hover:bg-surface")}>
                      <td className="py-3 pl-2 pr-3">
                        <span className="flex min-w-0 items-center gap-2">
                          {isUnread && <NeedsYou label="Unread" />}
                          {/* Desktop opens the side panel; phones open the lead's own page. The visible link stretches over the row. */}
                          <Link href={hrefFor({ lead: l.id })} aria-current={selected ? "true" : undefined} className={cx("hidden min-w-0 truncate after:absolute after:inset-0 lg:inline", isUnread && "font-semibold")}>{l.name}</Link>
                          <Link href={`/app/leads/${l.id}`} className={cx("min-w-0 truncate after:absolute after:inset-0 lg:hidden", isUnread && "font-semibold")}>{l.name}</Link>
                        </span>
                      </td>
                      <td className="py-3 pr-3"><Badge stage={l.stage}>{stageLabel(l.stage)}</Badge></td>
                      <td className="hidden truncate py-3 pr-3 text-muted sm:table-cell">{l.listing_street ?? SOURCE_LABELS[l.source]}</td>
                      <td className="figures-col py-3 pr-2 text-right text-faint">{timeAgo(l.created_at)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="rounded-xl border border-dashed border-rule">
              <EmptyState title={q || stage ? "No leads match." : "No leads yet."}>
                {q || stage ? "Try a different search or stage." : "When someone contacts you or asks for a tour on your website, they appear here."}
              </EmptyState>
            </div>
          )}
        </div>

        {open && (
          <div className="hidden lg:block">
            <LeadPanel lead={open} listing={open.listing_id ? await getListing(open.listing_id) : undefined} events={await getLeadEvents(open.id)} closeHref={hrefFor({})} />
          </div>
        )}
      </div>
    </>
  );
}
