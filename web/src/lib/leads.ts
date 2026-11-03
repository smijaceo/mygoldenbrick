import "server-only";
import { all, get, run, transaction } from "./db";
import { STAGES, stageLabel, type Lead, type LeadEvent, type LeadSource, type Stage, type Task } from "./types";

export type LeadWithListing = Lead & { listing_street: string | null };

export async function listLeads(agentId: number, opts: { q?: string; stage?: string } = {}): Promise<LeadWithListing[]> {
  const where = ["l.agent_id = ?"];
  const params: (string | number)[] = [agentId];
  if (opts.q) {
    where.push("(l.name || ' ' || l.email || ' ' || l.phone) LIKE ?");
    params.push(`%${opts.q.trim()}%`);
  }
  if (opts.stage && STAGES.some((s) => s.id === opts.stage)) {
    where.push("l.stage = ?");
    params.push(opts.stage);
  }
  return all<LeadWithListing>(
    `SELECT l.*, li.street AS listing_street FROM leads l
     LEFT JOIN listings li ON li.id = l.listing_id
     WHERE ${where.join(" AND ")} ORDER BY l.unread DESC, l.updated_at DESC`,
    ...params,
  );
}

export async function getLead(agentId: number, id: number): Promise<LeadWithListing | undefined> {
  return get<LeadWithListing>(
    `SELECT l.*, li.street AS listing_street FROM leads l
     LEFT JOIN listings li ON li.id = l.listing_id
     WHERE l.agent_id = ? AND l.id = ?`,
    agentId, id,
  );
}

export async function getLeadEvents(leadId: number): Promise<LeadEvent[]> {
  return all<LeadEvent>("SELECT * FROM lead_events WHERE lead_id = ? ORDER BY created_at DESC, id DESC", leadId);
}

async function addEvent(leadId: number, kind: LeadEvent["kind"], body: string) {
  await run("INSERT INTO lead_events (lead_id, kind, body) VALUES (?, ?, ?)", leadId, kind, body);
  await run("UPDATE leads SET updated_at = datetime('now') WHERE id = ?", leadId);
}

export async function createLead(input: {
  agentId: number;
  name: string;
  email: string;
  phone: string;
  message: string;
  source: LeadSource;
  listingId: number | null;
  tourDate: string | null;
}): Promise<number> {
  return transaction(async () => {
    const res = await run(
      `INSERT INTO leads (agent_id, name, email, phone, message, source, listing_id, tour_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      input.agentId, input.name, input.email, input.phone, input.message, input.source,
      input.listingId, input.tourDate,
    );
    const id = Number(res.lastInsertRowid);
    await addEvent(id, "created", input.message);
    return id;
  });
}

export async function markLeadRead(agentId: number, id: number) {
  await run("UPDATE leads SET unread = 0 WHERE agent_id = ? AND id = ?", agentId, id);
}

export async function setLeadStage(agentId: number, id: number, stage: Stage) {
  const lead = await getLead(agentId, id);
  if (!lead || lead.stage === stage || !STAGES.some((s) => s.id === stage)) return;
  await transaction(async () => {
    await run("UPDATE leads SET stage = ?, unread = 0 WHERE id = ?", stage, id);
    await addEvent(id, "stage", `Moved from ${stageLabel(lead.stage)} to ${stageLabel(stage)}`);
  });
}

export async function addLeadNote(agentId: number, id: number, body: string) {
  if (!(await getLead(agentId, id))) return;
  await addEvent(id, "note", body);
}

export async function logLeadEmail(agentId: number, id: number, subject: string, body: string) {
  const lead = await getLead(agentId, id);
  if (!lead) return;
  await transaction(async () => {
    await run("INSERT INTO outbox (agent_id, to_email, subject, body) VALUES (?, ?, ?, ?)", agentId, lead.email, subject, body);
    await addEvent(id, "email", `Email: ${subject}`);
    if (lead.stage === "new") {
      await run("UPDATE leads SET stage = 'contacted' WHERE id = ?", id);
      await addEvent(id, "stage", "Moved from New to Contacted");
    }
  });
}

// Tasks

export async function listOpenTasks(agentId: number): Promise<Task[]> {
  return all<Task>(
    `SELECT t.*, l.name AS lead_name FROM tasks t LEFT JOIN leads l ON l.id = t.lead_id
     WHERE t.agent_id = ? AND t.done_at IS NULL ORDER BY t.due_date, t.id`,
    agentId,
  );
}

export async function listLeadTasks(agentId: number, leadId: number): Promise<Task[]> {
  return all<Task>(
    "SELECT * FROM tasks WHERE agent_id = ? AND lead_id = ? ORDER BY done_at IS NOT NULL, due_date",
    agentId, leadId,
  );
}

export async function addTask(agentId: number, title: string, dueDate: string, leadId: number | null) {
  if (leadId && !(await getLead(agentId, leadId))) return;
  await run("INSERT INTO tasks (agent_id, lead_id, title, due_date) VALUES (?, ?, ?, ?)", agentId, leadId, title, dueDate);
  if (leadId) await addEvent(leadId, "task", `Task added: ${title}`);
}

export async function completeTask(agentId: number, taskId: number) {
  const task = await get<Task>("SELECT * FROM tasks WHERE id = ? AND agent_id = ?", taskId, agentId);
  if (!task || task.done_at) return;
  await run("UPDATE tasks SET done_at = datetime('now') WHERE id = ?", taskId);
  if (task.lead_id) await addEvent(task.lead_id, "task", `Task done: ${task.title}`);
}

// Dashboard

export async function leadCounts(agentId: number) {
  const rows = await all<{ stage: Stage; n: number }>(
    "SELECT stage, COUNT(*) AS n FROM leads WHERE agent_id = ? GROUP BY stage", agentId,
  );
  const byStage = Object.fromEntries(STAGES.map((s) => [s.id, 0])) as Record<Stage, number>;
  for (const r of rows) byStage[r.stage] = r.n;
  const unread = (await get<{ n: number }>("SELECT COUNT(*) AS n FROM leads WHERE agent_id = ? AND unread = 1", agentId))!.n;
  const thisWeek = (await get<{ n: number }>(
    "SELECT COUNT(*) AS n FROM leads WHERE agent_id = ? AND created_at >= datetime('now', '-7 days')", agentId,
  ))!.n;
  return { byStage, unread, thisWeek };
}

export async function recentActivity(agentId: number, limit = 8) {
  return all<LeadEvent & { lead_name: string }>(
    `SELECT e.*, l.name AS lead_name FROM lead_events e JOIN leads l ON l.id = e.lead_id
     WHERE l.agent_id = ? ORDER BY e.created_at DESC, e.id DESC LIMIT ?`,
    agentId, limit,
  );
}

export async function listOutbox(agentId: number) {
  return all<{ id: number; to_email: string; subject: string; body: string; created_at: string }>(
    "SELECT * FROM outbox WHERE agent_id = ? ORDER BY created_at DESC LIMIT 50", agentId,
  );
}
