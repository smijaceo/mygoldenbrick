"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, requireAgent, signOutOtherSessions } from "@/lib/auth";
import { get, run, transaction } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { allow, clientIp, reset } from "@/lib/rate-limit";
import { DEFAULT_ACCENT } from "@/lib/themes";
import { slugify } from "@/lib/builder";

export type AuthState = { error?: string; email?: string; name?: string } | undefined;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOO_MANY = "Too many attempts. Wait 15 minutes, then try again.";

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/app") && !next.startsWith("//") ? next : "/app";
}

export async function login(_: AuthState, form: FormData): Promise<AuthState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const ip = await clientIp();
  // Failed-attempt budgets: per account and per network address.
  if (!allow(`login-ip:${ip}`, 30, 900) || !allow(`login:${email}`, 10, 900)) {
    return { error: TOO_MANY, email };
  }
  const agent = get<{ id: number; password_hash: string }>(
    "SELECT id, password_hash FROM agents WHERE email = ?", email,
  );
  if (!agent || !(await verifyPassword(password, agent.password_hash))) {
    return { error: "That email and password don't match an account.", email };
  }
  reset(`login:${email}`);
  await createSession(agent.id);
  redirect(safeNext(form.get("next")));
}

export async function signup(_: AuthState, form: FormData): Promise<AuthState> {
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const area = String(form.get("area") ?? "").trim().slice(0, 120);
  if (name.length < 2) return { error: "Enter your name as clients should see it.", email, name };
  if (!EMAIL.test(email)) return { error: "Enter a valid email address.", email, name };
  if (password.length < 8) return { error: "Use a password of at least 8 characters.", email, name };
  if (!allow(`signup-ip:${await clientIp()}`, 10, 3600)) return { error: TOO_MANY, email, name };
  if (get("SELECT 1 FROM agents WHERE email = ?", email)) {
    return { error: "An account with that email already exists. Try logging in.", email, name };
  }

  const passwordHash = await hashPassword(password);
  const base = slugify(name);
  let agentId: number;
  try {
    agentId = transaction(() => {
      let slug = base;
      for (let i = 2; get("SELECT 1 FROM agents WHERE slug = ?", slug); i++) slug = `${base}-${i}`;
      const res = run(
        "INSERT INTO agents (email, password_hash, name, slug) VALUES (?, ?, ?, ?)",
        email, passwordHash, name, slug,
      );
      const id = Number(res.lastInsertRowid);
      run(
        "INSERT INTO sites (agent_id, public_email, seo_title, hero_image, accent_color, service_area, theme) VALUES (?, ?, ?, ?, ?, ?, 'light')",
        id, email, `${name}, real estate`, "https://images.unsplash.com/photo-1568605114967-8130f3a36994", DEFAULT_ACCENT.light, area,
      );
      return id;
    });
  } catch (err) {
    // Two sign-ups with the same email at the same moment: one wins.
    if (String(err).includes("UNIQUE")) {
      return { error: "An account with that email already exists. Try logging in.", email, name };
    }
    throw err;
  }
  await createSession(agentId);
  redirect("/app/website?welcome=1");
}

export async function logout() {
  await destroySession();
  redirect("/login");
}

export type PasswordState = { ok?: boolean; error?: string } | undefined;

export async function changePassword(_: PasswordState, form: FormData): Promise<PasswordState> {
  const agent = await requireAgent();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  if (!allow(`password:${agent.id}`, 10, 900)) return { error: TOO_MANY };
  const row = get<{ password_hash: string }>("SELECT password_hash FROM agents WHERE id = ?", agent.id)!;
  if (!(await verifyPassword(current, row.password_hash))) return { error: "Your current password isn't right." };
  if (next.length < 8) return { error: "Use a new password of at least 8 characters." };
  run("UPDATE agents SET password_hash = ? WHERE id = ?", await hashPassword(next), agent.id);
  await signOutOtherSessions(agent.id);
  return { ok: true };
}
