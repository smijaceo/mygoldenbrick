import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { getPublicSite } from "@/lib/sites";

/** Loads an agent's public site once per request; 404s for unknown slugs. */
export const loadSite = cache(async (slug: string) => {
  const site = getPublicSite(slug);
  if (!site) notFound();
  return site;
});
