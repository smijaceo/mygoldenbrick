import type { ComponentProps, ReactNode } from "react";

export { Field } from "./field";

export const cx = (...c: (string | false | null | undefined)[]) => c.filter(Boolean).join(" ");

/*
 * Back-office building blocks: white panels with a light border, ink-black primary buttons,
 * and imakepage gold kept for what needs the agent (unread marks, counts).
 */

const BUTTON = {
  primary: "bg-ink text-ground hover:bg-ink/90",
  secondary: "bg-raised text-ink hover:bg-active",
  ghost: "text-muted hover:bg-raised hover:text-ink",
  danger: "text-danger hover:bg-raised",
};

export function buttonClass(variant: keyof typeof BUTTON = "primary", size: "sm" | "md" = "md") {
  return cx(
    "press inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold disabled:pointer-events-none disabled:opacity-60",
    size === "sm" ? "h-8 px-3 text-sm" : "h-9 px-4 text-sm",
    BUTTON[variant],
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: keyof typeof BUTTON; size?: "sm" | "md" }) {
  return <button className={cx(buttonClass(variant, size), className)} {...props} />;
}

/** Field styling without a width, for fields that sit in a row. 16px on phones so iOS does not zoom. */
export const inputBase =
  "block min-h-9 rounded-lg border border-input bg-ground px-3 py-1.5 text-base text-ink placeholder:text-faint sm:text-sm";

export const inputClass = `${inputBase} w-full`;

export function Card({ className, ...props }: ComponentProps<"div">) {
  return <div className={cx("rounded-xl border border-rule bg-ground", className)} {...props} />;
}

export function CardHeader({ title, action, sub, id }: { title: string; action?: ReactNode; sub?: ReactNode; id?: string }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 pb-3 pt-5">
      <div className="min-w-0">
        <h2 id={id} className="text-lg font-semibold tracking-[-0.01em] text-ink">{title}</h2>
        {sub && <p className="mt-0.5 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

/** An empty block keeps its frame and header and says one sentence. */
export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="px-5 pb-5 pt-2 text-sm">
      <p className="text-ink">{title}</p>
      {children && <div className="mt-0.5 text-muted">{children}</div>}
    </div>
  );
}

/** Each stage's dot colour. Gold (needs you) is New; closed and lost are grey. */
export const STAGE_DOT: Record<string, string> = {
  new: "#d4a843",
  contacted: "#2f61cf",
  qualified: "#7c5cc4",
  showing: "#2e8b57",
  offer: "#d9622b",
  closed: "#9ca3af",
  lost: "#9ca3af",
};

/** A lead's stage: a small outlined tag with the stage's coloured dot. */
export function Badge({ children, stage }: { children: ReactNode; stage?: string }) {
  return (
    <span className="inline-flex h-6 flex-none items-center gap-1.5 whitespace-nowrap rounded-md border border-rule px-2 text-xs font-medium text-ink">
      {stage && <span aria-hidden="true" className="size-[7px] rounded-full" style={{ background: STAGE_DOT[stage] ?? STAGE_DOT.closed }} />}
      {children}
    </span>
  );
}

/** The gold dot that marks something waiting on the agent (an unread lead). */
export function NeedsYou({ label }: { label: string }) {
  return <span role="img" aria-label={label} className="inline-block size-2 flex-none rounded-full bg-accent" />;
}

export function PageHeader({ title, sub, action }: { title: ReactNode; sub?: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        <h1 className="text-[2rem] font-bold leading-tight tracking-[-0.03em] text-ink sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1 max-w-[70ch] text-base text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}
