import Image from "next/image";
import Link from "next/link";
import { Phone, X } from "lucide-react";
import type { LeadWithListing } from "@/lib/leads";
import type { Listing, LeadEvent } from "@/lib/types";
import { money, shortDate, sized, timeAgo } from "@/lib/format";
import { SOURCE_LABELS } from "@/lib/types";
import { ActionForm, SubmitButton } from "@/components/action-form";
import { buttonClass, inputClass } from "@/components/ui";
import { sendEmail } from "../actions";
import { StageSelect } from "./stage-select";

/** The lead opened beside the table: who, what they asked about, and a reply box. */
export function LeadPanel({ lead, listing, events, closeHref }: { lead: LeadWithListing; listing?: Listing; events: LeadEvent[]; closeHref: string }) {
  const firstName = lead.name.split(" ")[0];
  return (
    <aside aria-labelledby="panel-name" className="rounded-xl border border-rule bg-ground p-6 lg:sticky lg:top-8">
      <div className="flex items-start justify-between gap-3">
        <h2 id="panel-name" className="text-2xl font-bold tracking-[-0.03em]">{lead.name}</h2>
        <Link href={closeHref} aria-label="Close" className="-m-1.5 flex size-8 items-center justify-center rounded-lg text-faint hover:bg-raised hover:text-ink">
          <X size={18} aria-hidden="true" />
        </Link>
      </div>
      <dl className="mt-4 grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-y-2.5 text-sm">
        <dt className="text-faint">Stage</dt>
        <dd><StageSelect leadId={lead.id} stage={lead.stage} size="sm" /></dd>
        <dt className="text-faint">Email</dt>
        <dd className="truncate"><a href={`mailto:${lead.email}`} className="hover:underline">{lead.email}</a></dd>
        <dt className="text-faint">Phone</dt>
        <dd>{lead.phone || <span className="text-faint">Not given</span>}</dd>
        {lead.tour_date && (<><dt className="text-faint">Tour</dt><dd className="font-semibold">{shortDate(lead.tour_date)}</dd></>)}
        <dt className="text-faint">Came from</dt>
        <dd>{SOURCE_LABELS[lead.source]}</dd>
      </dl>

      {listing && (
        <div className="mt-5 flex items-center gap-3 rounded-xl border border-rule p-2">
          <Image src={sized(listing.photos[0], 200)} alt="" width={84} height={60} className="h-15 w-21 shrink-0 rounded-lg object-cover" unoptimized />
          <div className="min-w-0 text-sm">
            <p className="font-bold">{money(listing.price)}</p>
            <p className="truncate text-muted">{listing.street}, {listing.beds} beds</p>
          </div>
        </div>
      )}

      {lead.message && <p className="mt-4 rounded-xl bg-surface px-4 py-3 text-sm leading-relaxed">“{lead.message}”</p>}

      <ActionForm action={sendEmail.bind(null, lead.id)} success="Reply saved to your outbox" className="mt-5 flex flex-col gap-2">
        <label htmlFor="panel-reply" className="text-sm font-semibold">Reply</label>
        <input type="hidden" name="subject" value={listing ? `About ${listing.street}` : "Following up"} />
        <textarea id="panel-reply" name="body" required rows={4} autoComplete="off" defaultValue={`Hi ${firstName},\n\nThanks for reaching out! `} className={inputClass} />
        <div className="flex flex-wrap gap-2">
          <SubmitButton pending="Saving…">Send reply</SubmitButton>
          {lead.phone && <a href={`tel:${lead.phone.replace(/[^\d+]/g, "")}`} className={buttonClass("secondary")}><Phone size={15} aria-hidden="true" /> Call</a>}
        </div>
      </ActionForm>
      <p className="mt-2 text-xs text-faint">Email delivery isn’t connected yet; replies wait in Settings, under Outbox.</p>

      <h3 className="mt-6 text-sm font-semibold">History</h3>
      <ul className="mt-2 flex flex-col gap-1.5 text-sm text-muted">
        {events.slice(0, 4).map((e) => (
          <li key={e.id}>{e.kind === "created" ? "Reached out from your website" : e.body}<span className="text-faint">, {timeAgo(e.created_at)}</span></li>
        ))}
      </ul>
      <Link href={`/app/leads/${lead.id}`} className="mt-5 inline-block text-sm font-semibold underline underline-offset-4">Open full page</Link>
    </aside>
  );
}
