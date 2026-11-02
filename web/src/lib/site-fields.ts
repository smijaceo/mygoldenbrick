import { isThemeId } from "./themes";

export const EDITABLE_FIELDS = [
  "brokerage", "title", "phone", "public_email", "office_address", "service_area",
  "headline", "subheadline", "hero_image", "photo_url", "bio",
  "accent_color", "theme", "seo_title", "seo_description",
] as const;

export type EditableField = (typeof EDITABLE_FIELDS)[number];

const HEX = /^#[0-9a-fA-F]{6}$/;
const URLISH = /^(https:\/\/[^\s"'<>]+)?$/;

/** Validates one field. Returns an error message, or null if the value is fine. */
export function validateField(field: EditableField, value: string): string | null {
  if (value.length > 2000) return "That's too long.";
  if (field === "accent_color" && !HEX.test(value)) return "Use a colour like #a08672.";
  if (field === "theme" && !isThemeId(value)) return "Pick a theme.";
  if ((field === "hero_image" || field === "photo_url") && !URLISH.test(value)) return "Use an https:// image link.";
  return null;
}
