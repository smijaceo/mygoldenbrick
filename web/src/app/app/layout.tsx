import type { Metadata } from "next";
import Link from "next/link";
import { requireAgent } from "@/lib/auth";
import { leadCounts } from "@/lib/leads";
import { Logo } from "@/components/logo";
import { Toaster } from "@/components/ui/sonner";
import { logout } from "../(auth)/actions";
import { AccountMenu, BottomNav, SideNav } from "./nav";

export const metadata: Metadata = { title: { default: "Today", template: "%s | imakepage" } };

/*
 * Back-office shell: a white sidebar with the agent's pages (desktop), or a top bar with a
 * bottom tab bar (phones), around one content column.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const agent = await requireAgent();
  const { unread } = leadCounts(agent.id);

  return (
    <div className="min-h-dvh bg-ground text-ink">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-rule bg-ground px-3 py-4 lg:flex">
        <Link href="/app" aria-label="imakepage, Today" className="mb-5 flex h-9 items-center px-2 text-base">
          <Logo />
        </Link>
        <SideNav unread={unread} />
        <div className="mt-auto flex flex-col gap-3">
          <div className="rounded-xl border border-rule p-3 text-sm">
            <p className="font-semibold">Your site is live</p>
            <p className="mt-0.5 truncate text-faint">imakepage.com/s/{agent.slug}</p>
            <a href={`/s/${agent.slug}`} target="_blank" rel="noopener" className="mt-2 inline-block font-semibold underline underline-offset-4">Open site</a>
          </div>
          <AccountMenu name={agent.name} email={agent.email} slug={agent.slug} align="start" />
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-rule bg-ground px-4 lg:hidden">
        <Link href="/app" aria-label="imakepage, Today" className="text-base"><Logo /></Link>
        <div className="w-44"><AccountMenu name={agent.name} email={agent.email} slug={agent.slug} /></div>
      </header>
      <form id="logout-form" action={logout} hidden />

      <main id="main" className="px-4 pb-28 pt-6 sm:px-8 lg:ml-60 lg:px-12 lg:pb-16 lg:pt-12">
        <div className="mx-auto max-w-[1180px]">{children}</div>
      </main>
      <BottomNav unread={unread} />
      <Toaster position="bottom-right" mobileOffset={{ bottom: "calc(72px + env(safe-area-inset-bottom))" }} />
    </div>
  );
}
