/**
 * Agent-site themes. Each theme is a set of semantic colour roles that become CSS
 * variables on the site's wrapper; Tailwind utilities (bg-ground, text-ink, ...) read
 * them. Adding a theme means adding one entry here. See docs/03-design.md.
 */

export type ThemeId = "light" | "dark";

export type Theme = {
  name: string;
  ground: string;
  surface: string;
  ink: string;
  muted: string;
  rule: string;
  danger: string;
};

export const THEMES: Record<ThemeId, Theme> = {
  light: { name: "Light", ground: "#ffffff", surface: "#f9fafb", ink: "#111827", muted: "#4b5563", rule: "#e5e7eb", danger: "#b42318" },
  dark: { name: "Dark", ground: "#111111", surface: "#1c1c1c", ink: "#f2f2f2", muted: "#8f8f8f", rule: "#2a2a2a", danger: "#ff8a7a" },
};

/** Ink buttons on the light theme; imakepage gold on the dark one. */
export const DEFAULT_ACCENT: Record<ThemeId, string> = { light: "#111827", dark: "#d4a843" };

export const isThemeId = (value: string): value is ThemeId => value in THEMES;

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16);
  const channel = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

/** WCAG 2 contrast ratio between two #rrggbb colours. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Text colour for labels on an accent fill: the theme's dark ink if it reads at 4.5:1, else
 * white, else pure black. Black or white always reaches 4.5:1 against any colour, so the
 * label is readable whatever accent the agent picks.
 */
export function accentInk(accent: string, theme: ThemeId): string {
  const dark = theme === "dark" ? THEMES.dark.ground : THEMES.light.ink;
  if (contrast(accent, dark) >= 4.5) return dark;
  if (contrast(accent, "#ffffff") >= 4.5) return "#ffffff";
  return "#000000";
}

/**
 * The accent as a line or text on the page (focus rings, hover text): the accent itself when it
 * reaches 3:1 on both the ground and the surface, otherwise the theme's ink, so keyboard focus
 * and hovered links never fade into the background.
 */
export function accentText(accent: string, theme: ThemeId): string {
  const t = THEMES[theme];
  return Math.min(contrast(accent, t.ground), contrast(accent, t.surface)) >= 3 ? accent : t.ink;
}

export function themeVars(theme: ThemeId, accent: string): Record<string, string> {
  const t = THEMES[theme];
  return {
    "--ground": t.ground,
    "--surface": t.surface,
    "--ink": t.ink,
    "--muted": t.muted,
    "--rule": t.rule,
    "--danger": t.danger,
    "--accent": accent,
    "--accent-ink": accentInk(accent, theme),
    "--accent-text": accentText(accent, theme),
  };
}

/** When an agent switches theme, the default bronze follows the theme; a colour they picked stays. */
export function accentAfterThemeChange(accent: string, from: ThemeId, to: ThemeId): string {
  return accent.toLowerCase() === DEFAULT_ACCENT[from] ? DEFAULT_ACCENT[to] : accent;
}
