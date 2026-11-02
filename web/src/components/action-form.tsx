"use client";

import { createContext, useContext, useState, useTransition, type ReactNode } from "react";
import { toast } from "sonner";
import { submitAction } from "@/lib/submit";
import { Button, cx } from "@/components/ui";

const Pending = createContext(false);

/**
 * A form that runs a server action, confirms it with a toast, and shows a failure beside itself.
 * It submits through onSubmit rather than `action`, because React resets an action form even
 * when the action fails; here the fields clear only after a save worked, so a failed reply keeps
 * its text. The action and its signature stay exactly as they are.
 */
export function ActionForm({
  action,
  success,
  className,
  children,
}: {
  action: (form: FormData) => Promise<void>;
  success: string;
  className?: string;
  children: ReactNode;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget;
        const data = new FormData(form);
        start(async () => {
          if ((await submitAction(action, data)) === "ok") {
            form.reset();
            setError(null);
            toast.success(success);
          } else {
            // The error sits next to the form that failed, and what was typed stays put.
            setError("That didn’t save. Check your connection and try again.");
          }
        });
      }}
    >
      <Pending.Provider value={pending}>{children}</Pending.Provider>
      {error && (
        <p role="alert" className="basis-full text-sm text-danger">
          {error}
        </p>
      )}
    </form>
  );
}

/** A submit button that says what is happening while its ActionForm's action runs. */
export function SubmitButton({
  children,
  pending: pendingLabel,
  variant = "primary",
  className,
}: {
  children: ReactNode;
  pending: string;
  variant?: "primary" | "secondary";
  className?: string;
}) {
  const pending = useContext(Pending);
  return (
    <Button type="submit" variant={variant} disabled={pending} className={cx(className)}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
