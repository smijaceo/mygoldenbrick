"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { submitLead, type LeadFormState } from "./actions";
import { cx } from "@/components/ui";
import { todayIso } from "@/lib/format";

const input =
  "block w-full rounded-lg border border-input bg-ground px-4 py-3 text-base text-ink placeholder:text-faint focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-text";
const label = "mb-1.5 block text-small text-muted";

export function LeadForm({
  slug,
  listingId,
  defaultMessage = "",
  allowTour = false,
  submitLabel = "Send message",
}: {
  slug: string;
  listingId?: number;
  defaultMessage?: string;
  allowTour?: boolean;
  submitLabel?: string;
}) {
  const [state, action, pending] = useActionState<LeadFormState, FormData>(submitLead.bind(null, slug), undefined);
  const [mode, setMode] = useState<"question" | "tour">(allowTour ? "tour" : "question");
  const values = state && !state.ok ? state.values : undefined;

  // The form is replaced by the confirmation, so focus moves to it instead of falling to <body>.
  const done = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state?.ok) done.current?.focus();
  }, [state]);

  if (state?.ok) {
    return (
      <div ref={done} tabIndex={-1} className="flex items-start gap-3 bg-ground p-6 focus:outline-none">
        <CheckCircle2 size={24} className="mt-0.5 shrink-0 text-accent-text" aria-hidden="true" />
        <p className="text-body font-semibold">{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {allowTour && (
        <div className="grid grid-cols-2 gap-1 rounded-xl bg-raised p-1 text-body font-semibold" role="group" aria-label="What would you like to do?">
          {(["tour", "question"] as const).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={cx("rounded-lg py-2.5", mode === m ? "border border-rule bg-ground text-ink" : "border border-transparent text-muted hover:text-ink")}
            >
              {m === "tour" ? "Request a tour" : "Ask a question"}
            </button>
          ))}
        </div>
      )}
      {listingId && <input type="hidden" name="listingId" value={listingId} />}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {mode === "tour" && allowTour && (
        <label className="block">
          <span className={label}>Preferred day</span>
          <input type="date" name="tourDate" required min={todayIso()} defaultValue={todayIso(1)} className={input} />
        </label>
      )}
      <label className="block">
        <span className={label}>Name</span>
        <input name="name" required placeholder="Jane Smith…" autoComplete="name" defaultValue={values?.name} className={input} />
      </label>
      <label className="block">
        <span className={label}>Email</span>
        <input name="email" type="email" required autoComplete="email" spellCheck={false} defaultValue={values?.email} className={input} />
      </label>
      <label className="block">
        <span className={label}>Phone (optional)</span>
        <input name="phone" type="tel" placeholder="(402) 555-0100…" autoComplete="tel" defaultValue={values?.phone} className={input} />
      </label>
      <label className="block">
        <span className={label}>{mode === "tour" && allowTour ? "Anything to add? (optional)" : "Message"}</span>
        <textarea
          name="message"
          rows={3}
          placeholder={mode === "tour" && allowTour ? "We’d like to see the basement…" : "We’re looking for a 3-bed near good schools…"}
          defaultValue={values?.message ?? defaultMessage}
          className={input}
        />
      </label>
      {state && !state.ok && (
        <p role="alert" className="bg-ground px-4 py-3 text-body text-danger">{state.error}</p>
      )}
      <button type="submit" disabled={pending} className="press rounded-lg h-13 w-full bg-accent hover:brightness-110 py-3.5 text-body font-semibold text-accent-ink disabled:opacity-60">
        {pending ? "Sending…" : mode === "tour" && allowTour ? "Request tour" : submitLabel}
      </button>
      <p className="text-small text-muted">By sending, you agree to be contacted about your enquiry.</p>
    </form>
  );
}
