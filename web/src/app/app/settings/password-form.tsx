"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { changePassword, type PasswordState } from "../../(auth)/actions";
import { Button, Field, inputClass } from "@/components/ui";

export function PasswordForm() {
  const [state, action, pending] = useActionState<PasswordState, FormData>(changePassword, undefined);
  useEffect(() => {
    if (state?.ok) toast.success("Password changed");
  }, [state]);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Field label="Current password">
        <input name="current" type="password" required autoComplete="current-password" className={inputClass} />
      </Field>
      <Field label="New password" hint="At least 8 characters. Your other devices will be signed out.">
        <input name="next" type="password" required minLength={8} autoComplete="new-password" className={inputClass} />
      </Field>
      <div aria-live="polite">{state?.error && <p className="text-sm text-danger">{state.error}</p>}</div>
      <div className="flex justify-end">
        <Button type="submit" variant="secondary" disabled={pending}>{pending ? "Changing…" : "Change password"}</Button>
      </div>
    </form>
  );
}
