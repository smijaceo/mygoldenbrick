"use client";

import { Children, cloneElement, useId, type ReactElement, type ReactNode } from "react";

/**
 * A labelled field. The hint or error describes the control (aria-describedby) rather than
 * becoming part of its name, and an error marks the control invalid and is announced.
 * `children` is the one input, select or textarea.
 */
export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
}) {
  const id = useId();
  const noteId = `${id}-note`;
  const control = Children.only(children) as ReactElement<Record<string, unknown>>;
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-sm font-semibold text-ink">{label}</label>
      {cloneElement(control, {
        id,
        "aria-describedby": error || hint ? noteId : undefined,
        "aria-invalid": error ? true : undefined,
      })}
      {error ? (
        <span id={noteId} role="alert" className="text-sm text-danger">{error}</span>
      ) : hint ? (
        <span id={noteId} className="text-sm text-muted">{hint}</span>
      ) : null}
    </div>
  );
}
