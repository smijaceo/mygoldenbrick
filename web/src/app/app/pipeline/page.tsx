import type { Metadata } from "next";
import { requireAgent } from "@/lib/auth";
import { listLeads } from "@/lib/leads";
import { timeAgo, unit } from "@/lib/format";
import { SOURCE_LABELS } from "@/lib/types";
import { PageHeader } from "@/components/ui";
import { Board } from "./board";

export const metadata: Metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const agent = await requireAgent();
  const all = await listLeads(agent.id);
  const leads = all.map((l) => ({
    id: l.id,
    name: l.name,
    stage: l.stage,
    detail: l.listing_street ?? SOURCE_LABELS[l.source],
    age: timeAgo(l.updated_at),
    unread: Boolean(l.unread),
  }));
  const open = all.filter((l) => l.stage !== "closed" && l.stage !== "lost").length;
  const showings = all.filter((l) => l.stage === "showing" || l.stage === "offer").length;

  return (
    <>
      <PageHeader
        title="Pipeline"
        sub={`${unit(open, "open lead")}, ${showings} at a showing or an offer.`}
      />
      <Board leads={leads} />
    </>
  );
}
