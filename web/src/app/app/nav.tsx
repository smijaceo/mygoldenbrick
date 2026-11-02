"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Columns3, ExternalLink, House, Inbox, LayoutTemplate, LogOut, Settings, Sun } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cx } from "@/components/ui";

const ITEMS = [
  { href: "/app", label: "Today", icon: Sun },
  { href: "/app/leads", label: "Leads", icon: Inbox },
  { href: "/app/pipeline", label: "Pipeline", icon: Columns3 },
  { href: "/app/listings", label: "Listings", icon: House },
  { href: "/app/website", label: "Website", icon: LayoutTemplate },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

function UnreadChip({ unread }: { unread: number }) {
  return (
    <span className="figures-col min-w-5 rounded-md bg-accent px-1.5 text-center text-xs font-bold leading-5 text-accent-ink">
      {unread}
      <span className="sr-only"> unread</span>
    </span>
  );
}

/** Desktop sidebar pages. The current page is a black pill; the leads count is gold because it needs you. */
export function SideNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="flex flex-col gap-0.5">
      {ITEMS.map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cx(
              "flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-sm transition-colors",
              active ? "bg-ink font-semibold text-ground" : "text-muted hover:bg-raised hover:text-ink",
            )}
          >
            <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
            <span className="flex-1">{label}</span>
            {href === "/app/leads" && unread > 0 && <UnreadChip unread={unread} />}
          </Link>
        );
      })}
    </nav>
  );
}

/** Phones: five destinations along the bottom; settings and sign-out live in the account menu. */
export function BottomNav({ unread }: { unread: number }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-rule bg-ground pb-[env(safe-area-inset-bottom)] lg:hidden">
      {ITEMS.slice(0, 5).map(({ href, label, icon: Icon }) => {
        const active = isActive(pathname, href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cx("flex h-14 flex-col items-center justify-center gap-1 text-xs font-semibold", active ? "text-ink" : "text-faint")}
          >
            <span className="relative">
              <Icon size={20} strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
              {href === "/app/leads" && unread > 0 && (
                <span className="figures-col absolute -right-3 -top-1.5 min-w-4 rounded-md bg-accent px-1 text-center text-xs leading-4 text-accent-ink">
                  {unread}
                  <span className="sr-only"> unread</span>
                </span>
              )}
            </span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AccountMenu({ name, email, slug, align = "end" }: { name: string; email: string; slug: string; align?: "start" | "end" }) {
  const initials = name.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-10 w-full min-w-0 items-center gap-2.5 rounded-lg px-2 text-left text-sm font-semibold text-ink transition-colors hover:bg-raised data-[state=open]:bg-raised">
        <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-raised text-xs text-ink">{initials}</span>
        <span className="min-w-0 flex-1 truncate">{name}</span>
        <span className="sr-only">Account menu</span>
      </DropdownMenuTrigger>
      {/* taste-skill-ignore: a menu floats, so it keeps shadcn’s overlay shadow */}
      <DropdownMenuContent align={align} className="w-60">
        <DropdownMenuLabel className="truncate text-sm font-normal text-faint">{email}</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <a href={`/s/${slug}`} target="_blank" rel="noopener">
              <ExternalLink aria-hidden="true" /> View my website
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/app/settings">
              <Settings aria-hidden="true" /> Settings
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <button type="submit" form="logout-form" className="w-full">
              <LogOut aria-hidden="true" /> Log out
            </button>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
