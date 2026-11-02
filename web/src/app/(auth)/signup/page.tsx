import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentAgent } from "@/lib/auth";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Create your account" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  if (await getCurrentAgent()) redirect("/app");
  const sp = await searchParams;
  const pick = (k: string) => (typeof sp[k] === "string" ? (sp[k] as string).slice(0, 120) : undefined);
  return (
    <>
      <h1 className="text-2xl font-extrabold tracking-[-0.02em] text-ink">Create your account</h1>
      <p className="mb-6 mt-1 text-sm text-muted">Your website is ready the moment you sign up.</p>
      <AuthForm mode="signup" prefill={{ name: pick("name"), area: pick("area") }} />
    </>
  );
}
