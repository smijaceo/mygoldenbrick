import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAgent } from "@/lib/auth";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentAgent()) redirect("/app");
  const { next } = await searchParams;
  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-ink">Welcome back</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Log in to your leads and website.</p>
      <AuthForm mode="login" next={typeof next === "string" ? next : undefined} />
    </>
  );
}
