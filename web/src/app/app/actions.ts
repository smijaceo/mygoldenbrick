"use server";

import { revalidatePath } from "next/cache";
import { requireAgent } from "@/lib/auth";
import { addLeadNote, addTask, completeTask, logLeadEmail, setLeadStage } from "@/lib/leads";
import { getListing, setFeatured } from "@/lib/listings";
import { EDITABLE_FIELDS, updateSite, validateField, type EditableField } from "@/lib/sites";
import { STAGES, type Stage } from "@/lib/types";

// Every action re-checks the session itself; nothing from the browser is trusted.

const refresh = () => revalidatePath("/app", "layout");

export async function changeStage(leadId: number, stage: Stage) {
  const agent = await requireAgent();
  if (!STAGES.some((s) => s.id === stage)) return;
  await setLeadStage(agent.id, leadId, stage);
  refresh();
}

export async function addNote(leadId: number, form: FormData) {
  const agent = await requireAgent();
  const body = String(form.get("body") ?? "").trim().slice(0, 4000);
  if (body) await addLeadNote(agent.id, leadId, body);
  refresh();
}

export async function sendEmail(leadId: number, form: FormData) {
  const agent = await requireAgent();
  const subject = String(form.get("subject") ?? "").trim().slice(0, 200);
  const body = String(form.get("body") ?? "").trim().slice(0, 10000);
  if (subject && body) await logLeadEmail(agent.id, leadId, subject, body);
  refresh();
}

export async function createTask(form: FormData) {
  const agent = await requireAgent();
  const title = String(form.get("title") ?? "").trim().slice(0, 200);
  const due = String(form.get("due") ?? "");
  const leadId = Number(form.get("leadId")) || null;
  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(due) && new Date(`${due}T12:00:00Z`).toISOString().startsWith(due);
  if (title && validDate) await addTask(agent.id, title, due, leadId);
  refresh();
}

export async function finishTask(taskId: number) {
  const agent = await requireAgent();
  await completeTask(agent.id, taskId);
  refresh();
}

export async function toggleFeatured(listingId: number, featured: boolean) {
  const agent = await requireAgent();
  if (!(await getListing(listingId))) return;
  await setFeatured(agent.id, listingId, featured);
  refresh();
  revalidatePath(`/s/${agent.slug}`);
}

export type SaveResult = { ok: true; savedAt: string } | { ok: false; errors: Partial<Record<EditableField, string>> };

export async function saveSite(values: Partial<Record<EditableField, string>>): Promise<SaveResult> {
  const agent = await requireAgent();
  const clean: Partial<Record<EditableField, string>> = {};
  const errors: Partial<Record<EditableField, string>> = {};
  for (const field of EDITABLE_FIELDS) {
    const raw = values[field];
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    const error = validateField(field, value);
    if (error) errors[field] = error;
    else clean[field] = value;
  }
  await updateSite(agent.id, clean);
  revalidatePath(`/s/${agent.slug}`, "layout");
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, savedAt: new Date().toISOString() };
}
