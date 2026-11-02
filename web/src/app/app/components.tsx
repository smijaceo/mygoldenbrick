import Link from "next/link";
import { Calendar, Check, Home, Mail } from "lucide-react";
import { finishTask } from "./actions";
import { Badge, NeedsYou, buttonClass, cx } from "@/components/ui";
import { shortDate, timeAgo, todayIso } from "@/lib/format";
import { SOURCE_LABELS, stageLabel, type Task } from "@/lib/types";
import type { LeadWithListing } from "@/lib/leads";

export { AddTaskForm } from "./add-task-form";

/**
 * One enquiry: who, where they are in the pipeline and when (line 1), what they said (line 2),
 * where it came from (line 3). The whole row opens the lead; with `reply`, an unread lead also
 * gets the screen's primary action, a Reply button that jumps straight to the reply box.
 */
export function LeadRow({ lead, reply = false }: { lead: LeadWithListing; reply?: boolean }) {
  const Icon = lead.source === "tour" ? Calendar : lead.source === "listing" ? Home : Mail;
  return (
    <div className="relative flex items-start gap-4 px-5 py-3 transition-colors hover:bg-raised">
      <div className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          {lead.unread ? <NeedsYou label="Unread" /> : null}
          {/* The name's link stretches over the row, so the row stays one click target without nesting links. */}
          <Link href={`/app/leads/${lead.id}`} className={cx("min-w-0 truncate text-sm text-ink after:absolute after:inset-0", lead.unread ? "font-semibold" : "font-normal")}>
            {lead.name}
          </Link>
          <Badge stage={lead.stage}>{stageLabel(lead.stage)}</Badge>
          <span className="figures-col ml-auto shrink-0 text-sm text-muted">{timeAgo(lead.created_at)}</span>
        </span>
        <span className="mt-1 line-clamp-2 text-sm text-muted">{lead.message || "No message"}</span>
        <span className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-muted">
          <span className="flex items-center gap-1.5"><Icon size={13} aria-hidden="true" />{SOURCE_LABELS[lead.source]}</span>
          {lead.listing_street && <span>{lead.listing_street}</span>}
          {lead.tour_date && <span className="font-semibold text-ink">Tour {shortDate(lead.tour_date)}</span>}
        </span>
      </div>
      {reply && lead.unread ? (
        <Link href={`/app/leads/${lead.id}#reply`} className={cx(buttonClass("primary", "sm"), "relative z-10 mt-6")} aria-label={`Reply to ${lead.name}`}>
          Reply
        </Link>
      ) : null}
    </div>
  );
}

export function TaskList({ tasks, showLead = true }: { tasks: Task[]; showLead?: boolean }) {
  const today = todayIso();
  return (
    <ul>
      {tasks.map((t) => {
        const overdue = !t.done_at && t.due_date < today;
        const dueToday = !t.done_at && t.due_date === today;
        return (
          <li key={t.id} className="flex min-h-12 items-center gap-3 px-5 py-2">
            {t.done_at ? (
              <span className="flex size-5 flex-none items-center justify-center rounded-sm bg-raised text-ink">
                <Check size={13} strokeWidth={2.5} aria-hidden="true" /><span className="sr-only">Done</span>
              </span>
            ) : (
              <form action={finishTask.bind(null, t.id)} className="flex">
                {/* A 20px box inside a 40px hit area. */}
                <button
                  type="submit"
                  aria-label={`Mark "${t.title}" done`}
                  className="group -m-2.5 flex size-10 flex-none items-center justify-center"
                >
                  <span className="size-5 rounded-sm border-2 border-input transition-colors group-hover:border-ink" />
                </button>
              </form>
            )}
            <div className="min-w-0 flex-1">
              <p className={cx("text-sm", t.done_at ? "text-muted line-through" : "text-ink")}>{t.title}</p>
              {showLead && t.lead_id && t.lead_name && (
                <Link href={`/app/leads/${t.lead_id}`} className="text-sm text-muted hover:text-ink">{t.lead_name}</Link>
              )}
            </div>
            <span className={cx("shrink-0 text-sm", overdue ? "font-semibold text-danger" : dueToday ? "font-semibold text-accent-text" : "text-muted")}>
              {dueToday ? "Today" : overdue ? `Overdue since ${shortDate(t.due_date)}` : shortDate(t.due_date)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
