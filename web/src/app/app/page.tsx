import Link from "next/link";
import { requireAgent } from "@/lib/auth";
import { listLeads, listOpenTasks, recentActivity } from "@/lib/leads";
import { trafficSummary } from "@/lib/analytics";
import { todayIso, timeAgo, unit } from "@/lib/format";
import { Card, CardHeader, EmptyState, PageHeader } from "@/components/ui";
import { AddTaskForm, LeadRow, TaskList } from "./components";
import { TrafficChart } from "./traffic-chart";

const WAITING_CAP = 5;

export default async function TodayPage() {
  const agent = await requireAgent();
  const waiting = (await listLeads(agent.id)).filter((l) => l.unread);
  const tasks = await listOpenTasks(agent.id);
  const today = todayIso();
  const dueNow = tasks.filter((t) => t.due_date <= today);
  const traffic = await trafficSummary(agent.id);
  // The figures count the last 7 days, so the chart draws the same 7.
  const week = traffic.daily.slice(-7);
  const activity = await recentActivity(agent.id, 6);
  const date = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const finding = [
    waiting.length === 0 ? "Nobody is waiting on a reply" : waiting.length === 1 ? "1 person is waiting on a reply" : `${waiting.length} people are waiting on a reply`,
    dueNow.length === 0 ? "no tasks are due" : `${unit(dueNow.length, "task")} ${dueNow.length === 1 ? "is" : "are"} due`,
  ].join(", and ");

  return (
    <>
      <PageHeader title="Today" sub={`${date}. ${finding}.`} />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_384px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader
              title="Waiting on a reply"
              action={<Link href="/app/leads" className="text-sm font-semibold text-muted hover:text-ink">All leads</Link>}
            />
            {waiting.length ? (
              <div className="pb-2">
                {waiting.slice(0, WAITING_CAP).map((l) => <LeadRow key={l.id} lead={l} reply />)}
                {waiting.length > WAITING_CAP && (
                  <Link href="/app/leads" className="block px-5 py-3 text-sm font-semibold text-muted hover:text-ink">
                    View all {waiting.length} waiting
                  </Link>
                )}
              </div>
            ) : (
              <EmptyState title="You’re all caught up.">New enquiries from your website show up here first.</EmptyState>
            )}
          </Card>

          <Card id="tasks">
            <CardHeader title="Tasks" />
            {tasks.length ? <TaskList tasks={tasks} /> : <EmptyState title="No open tasks.">Add one below, or from any lead.</EmptyState>}
            <AddTaskForm />
          </Card>

          <Card>
            <CardHeader title="Latest activity" />
            {activity.length ? (
              <ul className="px-5 pb-4">
                {activity.map((e) => (
                  <li key={e.id} className="py-2 text-sm">
                    <Link href={`/app/leads/${e.lead_id}`} className="font-semibold text-ink hover:underline">{e.lead_name}</Link>
                    <span className="text-muted">
                      {" "}
                      {e.kind === "created" ? "sent an enquiry" : e.kind === "note" ? "got a note" : e.body.charAt(0).toLowerCase() + e.body.slice(1)}
                    </span>
                    <span className="block text-xs text-muted">{timeAgo(e.created_at)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="Nothing yet." />
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader title="Your website" sub="Last 7 days" />
            <dl className="grid grid-cols-2 px-5 pt-2">
              <div>
                <dt className="text-sm text-muted">Page views</dt>
                <dd className="figures-col mt-1 text-2xl text-ink">{traffic.views}</dd>
              </div>
              <div className="border-l border-rule pl-5">
                <dt className="text-sm text-muted">Visitors</dt>
                <dd className="figures-col mt-1 text-2xl text-ink">{traffic.visitors}</dd>
              </div>
            </dl>
            <div className="px-5 pb-5 pt-6">
              {week.some((d) => d.views > 0) ? (
                <TrafficChart daily={week} />
              ) : (
                <p className="text-sm text-muted">No visits in the last 7 days. Share your website link to get started.</p>
              )}
            </div>
            {traffic.topListings.length > 0 && (
              <div className="px-5 pb-5">
                <h3 className="flex justify-between text-sm text-muted">
                  <span>Most viewed homes</span>
                  <span>Views</span>
                </h3>
                <ol className="mt-1">
                  {traffic.topListings.map((l) => (
                    <li key={l.listing_id} className="flex min-h-9 items-center justify-between gap-3 text-sm">
                      <Link href={`/s/${agent.slug}/homes/${l.listing_id}`} target="_blank" className="truncate text-ink hover:underline">{l.street}</Link>
                      <span className="figures-col shrink-0 text-ink">{l.views}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </Card>

        </div>
      </div>
    </>
  );
}
