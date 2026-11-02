"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, signup, type AuthState } from "./actions";
import { Button, Field, inputClass } from "@/components/ui";

export function AuthForm({
  mode,
  next,
  prefill,
}: {
  mode: "login" | "signup";
  next?: string;
  prefill?: { name?: string; area?: string };
}) {
  const [state, action, pending] = useActionState<AuthState, FormData>(mode === "login" ? login : signup, undefined);

  return (
    <form action={action} className="flex flex-col gap-4">
      {next && <input type="hidden" name="next" value={next} />}
      {prefill?.area && <input type="hidden" name="area" value={prefill.area} />}
      {mode === "signup" && (
        <Field label="Your name" hint="Shown on your website.">
          <input name="name" required autoComplete="name" defaultValue={state?.name ?? prefill?.name} className={inputClass} />
        </Field>
      )}
      <Field label="Email">
        <input name="email" type="email" required autoComplete="email" spellCheck={false} defaultValue={state?.email} className={inputClass} />
      </Field>
      <Field label="Password" hint={mode === "signup" ? "At least 8 characters." : undefined}>
        <input
          name="password"
          type="password"
          required
          minLength={mode === "signup" ? 8 : undefined}
          autoComplete={mode === "signup" ? "new-password" : "current-password"}
          className={inputClass}
        />
      </Field>
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "One moment…" : mode === "login" ? "Log in" : "Create my account"}
      </Button>
      <p className="text-center text-sm text-muted">
        {mode === "login" ? (
          <>New here? <Link href="/signup" className="font-semibold text-ink underline underline-offset-4">Create an account</Link></>
        ) : (
          <>Already have an account? <Link href="/login" className="font-semibold text-ink underline underline-offset-4">Log in</Link></>
        )}
      </p>
    </form>
  );
}
