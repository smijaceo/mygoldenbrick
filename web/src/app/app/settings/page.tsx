import type { Metadata } from "next";
import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireAgent } from "@/lib/auth";
import { listOutbox } from "@/lib/leads";
import { timeAgo } from "@/lib/format";
import { Button, Card, PageHeader } from "@/components/ui";
import { logout } from "../../(auth)/actions";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Settings" };

/** A settings row: what the section is on the left, its panel on the right; stacked on phones. */
function Row({ id, title, children, about }: { id: string; title: string; about: React.ReactNode; children: React.ReactNode }) {
  return (
    <section aria-labelledby={id} className="grid grid-cols-1 gap-3 md:grid-cols-[18rem_minmax(0,1fr)] md:gap-6">
      <div className="md:pt-5">
        <h2 id={id} className="text-base font-semibold text-ink">{title}</h2>
        <div className="mt-1 text-sm text-muted">{about}</div>
      </div>
      <Card className="p-5">{children}</Card>
    </section>
  );
}

export default async function SettingsPage() {
  const agent = await requireAgent();
  const outbox = await listOutbox(agent.id);

  return (
    <>
      <PageHeader title="Settings" sub={`Signed in as ${agent.email}.`} />
      <div className="flex flex-col gap-10">
        <Row id="account" title="Account" about="Your name shows on your website.">
          <dl className="flex flex-col gap-4 text-sm">
            <div className="flex flex-wrap justify-between gap-x-6 gap-y-0.5">
              <dt className="text-muted">Name</dt>
              <dd className="text-ink">{agent.name}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-x-6 gap-y-0.5">
              <dt className="text-muted">Login email</dt>
              <dd className="break-all text-ink">{agent.email}</dd>
            </div>
            <div className="flex flex-wrap justify-between gap-x-6 gap-y-0.5">
              <dt className="text-muted">Website address</dt>
              <dd><Link href={`/s/${agent.slug}`} target="_blank" className="text-ink underline underline-offset-4">/s/{agent.slug}</Link></dd>
            </div>
          </dl>
        </Row>

        <Row id="password" title="Password" about="Changing it signs you out everywhere else.">
          <PasswordForm />
        </Row>

        <Row
          id="outbox"
          title="Outbox"
          about={<>Replies you’ve sent from a lead’s page. Email delivery isn’t connected yet, so nothing has actually gone out.</>}
        >
          {outbox.length ? (
            <>
              <p className="text-sm text-muted">{outbox.length === 1 ? "1 reply" : `${outbox.length} replies`} waiting</p>
              <ul className="mt-2 flex flex-col">
                {outbox.map((m) => (
                  <li key={m.id} className="py-3">
                    <div className="flex justify-between gap-3">
                      <p className="min-w-0 truncate font-semibold text-ink">{m.subject}</p>
                      <span className="flex-none text-sm text-muted">{timeAgo(m.created_at)}</span>
                    </div>
                    <p className="text-sm text-muted">To {m.to_email}</p>
                    <p className="mt-1 line-clamp-2 whitespace-pre-line text-sm text-ink">{m.body}</p>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-sm text-ink">Nothing sent yet.</p>
          )}
        </Row>

        <Row id="session" title="Log out" about="Ends this session on this device.">
          <form action={logout}>
            <Button type="submit" variant="secondary"><LogOut size={16} aria-hidden="true" /> Log out</Button>
          </form>
        </Row>
      </div>
    </>
  );
}
