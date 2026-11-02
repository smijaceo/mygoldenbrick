"use server";

import { revalidatePath } from "next/cache";
import { todayIso } from "@/lib/format";
import { createLead } from "@/lib/leads";
import { getListing } from "@/lib/listings";
import { getPublicSite } from "@/lib/sites";
import { allow, clientIp } from "@/lib/rate-limit";
import type { LeadSource } from "@/lib/types";

export type LeadFormState =
  | { ok: true; message: string }
  | { ok: false; error: string; values?: Record<string, string> }
  | undefined;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitLead(slug: string, _: LeadFormState, form: FormData): Promise<LeadFormState> {
  const site = getPublicSite(slug);
  if (!site) return { ok: false, error: "This website isn't available." };

  const str = (k: string, max: number) => String(form.get(k) ?? "").trim().slice(0, max);
  const values = {
    name: str("name", 120),
    email: str("email", 200),
    phone: str("phone", 40),
    message: str("message", 4000),
  };

  // Hidden field that people never see; bots tend to fill it in.
  if (str("website", 200)) return { ok: true, message: "Thanks! We'll be in touch soon." };

  const ip = await clientIp();
  if (!allow(`lead-ip:${ip}`, 10, 3600) || !allow(`lead-site:${site.agent.id}`, 300, 86400)) {
    return { ok: false, error: "Too many messages from here. Wait an hour, or call instead.", values };
  }

  if (values.name.length < 2) return { ok: false, error: "Please add your name.", values };
  if (!EMAIL.test(values.email)) return { ok: false, error: "Please add a valid email so we can reply.", values };

  const listingId = Number(form.get("listingId")) || null;
  if (listingId && !getListing(listingId)) return { ok: false, error: "That home is no longer available.", values };

  const tourDate = str("tourDate", 10);
  const isTour = Boolean(tourDate);
  if (isTour && (!/^\d{4}-\d{2}-\d{2}$/.test(tourDate) || tourDate < todayIso())) {
    return { ok: false, error: "Please pick a tour date from today onwards.", values };
  }

  const source: LeadSource = isTour ? "tour" : listingId ? "listing" : "contact";
  createLead({
    agentId: site.agent.id,
    name: values.name,
    email: values.email,
    phone: values.phone,
    message: values.message,
    source,
    listingId,
    tourDate: isTour ? tourDate : null,
  });
  revalidatePath("/app", "layout");

  const first = site.agent.name.split(" ")[0];
  return {
    ok: true,
    message: isTour
      ? `Tour requested. ${first} will confirm the time with you shortly.`
      : `Thanks, ${values.name.split(" ")[0]}! ${first} will get back to you soon.`,
  };
}
