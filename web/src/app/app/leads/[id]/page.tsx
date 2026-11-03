import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowRightLeft, Calendar, CheckSquare, Mail, Phone, Sparkles, StickyNote } from "lucide-react";
import { requireAgent } from "@/lib/auth";
import { getLead, getLeadEvents, listLeadTasks, markLeadRead } from "@/lib/leads";
import { getListing } from "@/lib/listings";
import { fullAddress, money, parseDb, shortDate, sized, timeAgo } from "@/lib/format";
import { SOURCE_LABELS } from "@/lib/types";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { Card, CardHeader, EmptyState, PageHeader, buttonClass, cx, inputBase, inputClass } from "@/components/ui";
import { addNote, sendEmail } from "../../actions";
import { AddTaskForm, TaskList } from "../../components";
import { StageSelect } from "../stage-select";

export async function generateMetadata({ params }: PageProps<"/app/leads/[id]">): Promise<Metadata> {
  const agent = await requireAgent();
  const lead = await getLead(agent.id, Number((await params).id));
  return { title: lead?.name ?? "Lead" };
}

const EVENT_ICONS = {
  created: Sparkles,
  stage: ArrowRightLeft,
  note: StickyNote,
  email: Mail,
  task: CheckSquare,
};

export default async function LeadPage({ params }: PageProps<"/app/leads/[id]">) {
  const agent = await requireAgent();
  const id = Number((await params).id);
  const lead = await getLead(agent.id, id);
  if (!lead) notFound();
  if (lead.unread) await markLeadRead(agent.id, id);

  const events = await getLeadEvents(id);
  const tasks = await listLeadTasks(agent.id, id);
  const listing = lead.listing_id ? await getListing(lead.listing_id) : undefined;
  const firstName = lead.name.split(" ")[0];
  const received = parseDb(lead.created_at).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-1 text-sm">
        <Link href="/app/leads" className="font-semibold text-muted hover:text-ink">Leads</Link>
      </nav>
      <PageHeader
        title={lead.name}
        sub={`${SOURCE_LABELS[lead.source]}, received ${received}.`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StageSelect leadId={lead.id} stage={lead.stage} />
            {lead.phone && (
              <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`} className={buttonClass("secondary")}>
                <Phone size={16} aria-hidden="true" /> Call
              </a>
            )}
            <a href={`mailto:${lead.email}`} className={buttonClass("secondary")}>
              <Mail size={16} aria-hidden="true" /> Email app
            </a>
          </div>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_384px]">
        <div className="flex min-w-0 flex-col gap-6">
          {lead.message && (
            <Card>
              <CardHeader title={`${firstName}’s message`} />
              <p className="max-w-[70ch] whitespace-pre-line px-5 pb-5 text-base leading-relaxed text-ink">{lead.message}</p>
            </Card>
          )}

          <Card id="reply" className="scroll-mt-16">
            <CardHeader title="Reply" sub="Saved to this lead’s history. Email delivery isn’t connected yet, so replies wait in Settings, under Outbox." />
            <ActionForm action={sendEmail.bind(null, lead.id)} success="Reply saved to your outbox" className="flex flex-col gap-3 px-5 pb-5 pt-2">
              <input name="subject" required autoComplete="off" aria-label="Subject" defaultValue={listing ? `About ${listing.street}` : "Following up"} className={inputClass} />
              <textarea name="body" required rows={5} autoComplete="off" aria-label="Message" defaultValue={`Hi ${firstName},\n\nThanks for reaching out! `} className={inputClass} />
              <div className="flex justify-end">
                <SubmitButton pending="Saving…">Send reply</SubmitButton>
              </div>
            </ActionForm>
          </Card>

          <Card>
            <CardHeader title="History" />
            <ActionForm action={addNote.bind(null, lead.id)} success="Note saved" className="flex flex-wrap gap-2 px-5 pb-3 pt-2">
              <input name="body" required placeholder="Add a note…" aria-label="Note" autoComplete="off" className={cx(inputBase, "min-w-0 flex-1")} />
              <SubmitButton variant="secondary" pending="Saving…">Save</SubmitButton>
            </ActionForm>
            <ol className="px-5 pb-5 pt-2">
              {events.map((e) => {
                const Icon = EVENT_ICONS[e.kind] ?? StickyNote;
                return (
                  <li key={e.id} className="flex gap-3 py-2">
                    <Icon size={16} strokeWidth={1.75} className="mt-0.5 flex-none text-muted" aria-hidden="true" />
                    <div className="min-w-0">
                      <p className="text-sm text-ink">{e.kind === "created" ? "Lead created from your website" : e.body}</p>
                      <p className="text-xs text-muted">{timeAgo(e.created_at)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Contact" />
            <dl className="flex flex-col gap-3 px-5 pb-5 pt-1 text-sm">
              <div className="flex items-start gap-3">
                <dt><Mail size={16} strokeWidth={1.75} className="mt-0.5 text-muted" aria-hidden="true" /><span className="sr-only">Email</span></dt>
                <dd className="min-w-0 break-all"><a href={`mailto:${lead.email}`} className="text-ink hover:underline">{lead.email}</a></dd>
              </div>
              <div className="flex items-start gap-3">
                <dt><Phone size={16} strokeWidth={1.75} className="mt-0.5 text-muted" aria-hidden="true" /><span className="sr-only">Phone</span></dt>
                <dd className={cx(lead.phone ? "text-ink" : "text-muted")}>{lead.phone || "No phone given"}</dd>
              </div>
              {lead.tour_date && (
                <div className="flex items-start gap-3">
                  <dt><Calendar size={16} strokeWidth={1.75} className="mt-0.5 text-muted" aria-hidden="true" /><span className="sr-only">Tour</span></dt>
                  <dd className="font-semibold text-ink">Tour asked for {shortDate(lead.tour_date)}</dd>
                </div>
              )}
            </dl>
          </Card>

          {listing && (
            <Card className="overflow-hidden">
              <div className="relative aspect-[16/10]">
                <Image src={sized(listing.photos[0], 768)} alt={`Front of ${listing.street}`} fill sizes="384px" className="object-cover" unoptimized />
              </div>
              <div className="p-5">
                <p className="figures text-2xl font-extrabold tracking-[-0.02em] text-ink">{money(listing.price)}</p>
                <p className="mt-1 text-sm text-muted">{fullAddress(listing)}</p>
                <Link href={`/s/${agent.slug}/homes/${listing.id}`} target="_blank" className="mt-3 inline-block text-sm font-semibold text-ink underline underline-offset-4">
                  View listing
                </Link>
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Tasks" />
            {tasks.length ? <TaskList tasks={tasks} showLead={false} /> : <EmptyState title="No tasks for this lead." />}
            <AddTaskForm leadId={lead.id} />
          </Card>
        </div>
      </div>
    </>
  );
}
