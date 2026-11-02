/** Shared by the landing page's live builder and sign-up, so the preview's URL is the real one. */
export function slugify(name: string) {
  return name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "agent";
}

export function previewCopy(name: string, area: string) {
  const n = name.trim();
  const a = area.trim();
  return {
    title: n || "Your name",
    heading: a ? `Homes for sale in ${a}` : "Homes for sale near you",
    slug: n ? slugify(n) : "your-name",
  };
}
