import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";
import { get, run } from "./db";
import type { Agent } from "./types";

export const SESSION_COOKIE = "imp_session";
const SESSION_DAYS = 30;

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");

export async function createSession(agentId: number) {
  run("DELETE FROM sessions WHERE expires_at < ?", new Date().toISOString());
  const token = randomBytes(32).toString("base64url");
  const expires = new Date(Date.now() + SESSION_DAYS * 86400000);
  run(
    "INSERT INTO sessions (token_hash, agent_id, expires_at) VALUES (?, ?, ?)",
    sha256(token), agentId, expires.toISOString(),
  );
  // Secure cookies only over HTTPS; plain-http access on a local network would drop them.
  const h = await headers();
  const https = h.get("x-forwarded-proto") === "https" || (h.get("origin") ?? "").startsWith("https://");
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: https,
    path: "/",
    expires,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) run("DELETE FROM sessions WHERE token_hash = ?", sha256(token));
  jar.delete(SESSION_COOKIE);
}

/** Ends every session for this agent except the one making the request. */
export async function signOutOtherSessions(agentId: number) {
  const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
  run("DELETE FROM sessions WHERE agent_id = ? AND token_hash != ?", agentId, sha256(token));
}

/** The signed-in agent, or null. Cached for the duration of one request. */
export const getCurrentAgent = cache(async (): Promise<Agent | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const agent = get<Agent & { expires_at: string }>(
    `SELECT a.id, a.email, a.name, a.slug, s.expires_at
     FROM sessions s JOIN agents a ON a.id = s.agent_id
     WHERE s.token_hash = ?`,
    sha256(token),
  );
  if (!agent || new Date(agent.expires_at) < new Date()) return null;
  return { id: agent.id, email: agent.email, name: agent.name, slug: agent.slug };
});

/** Use in every back-office page and server action: never trust the client. */
export async function requireAgent(): Promise<Agent> {
  const agent = await getCurrentAgent();
  if (!agent) redirect("/login");
  return agent;
}
