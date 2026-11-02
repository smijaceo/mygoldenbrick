import "server-only";
import { all, get, run } from "./db";
import type { Agent, Site } from "./types";
import { EDITABLE_FIELDS, type EditableField } from "./site-fields";

export { EDITABLE_FIELDS, validateField, type EditableField } from "./site-fields";

export type PublicSite = { agent: Agent; site: Site; testimonials: { author: string; quote: string }[] };

export function getSite(agentId: number): Site {
  return get<Site>("SELECT * FROM sites WHERE agent_id = ?", agentId)!;
}

export function getPublicSite(slug: string): PublicSite | null {
  const agent = get<Agent>("SELECT id, email, name, slug FROM agents WHERE slug = ?", slug);
  if (!agent) return null;
  return {
    agent,
    site: getSite(agent.id),
    testimonials: all<{ author: string; quote: string }>(
      "SELECT author, quote FROM testimonials WHERE agent_id = ? ORDER BY id", agent.id,
    ),
  };
}

export function updateSite(agentId: number, values: Partial<Record<EditableField, string>>) {
  const fields = Object.keys(values).filter((f): f is EditableField =>
    (EDITABLE_FIELDS as readonly string[]).includes(f));
  if (!fields.length) return;
  run(
    `UPDATE sites SET ${fields.map((f) => `${f} = ?`).join(", ")}, updated_at = datetime('now') WHERE agent_id = ?`,
    ...fields.map((f) => values[f]!), agentId,
  );
}
