import { describe, expect, it } from "vitest";
import { DEFAULT_ACCENT, THEMES, accentAfterThemeChange, accentInk, contrast, themeVars } from "./themes";

describe("contrast", () => {
  it("measures black on white as 21:1", () => {
    expect(contrast("#000000", "#ffffff")).toBeCloseTo(21, 1);
  });
});

describe("accentInk", () => {
  it("puts dark ink on the light bronze accent", () => {
    expect(accentInk("#a08672", "dark")).toBe("#111111");
  });

  it("puts white on a deep green accent", () => {
    expect(accentInk("#1f3d2b", "dark")).toBe("#ffffff");
  });

  it("puts white on the light theme's default ink accent", () => {
    expect(accentInk("#111827", "light")).toBe("#ffffff");
  });
});

describe("themeVars", () => {
  it("sets the light ground to white", () => {
    expect(themeVars("light", "#111827")["--ground"]).toBe("#ffffff");
  });

  it("sets all nine variables", () => {
    expect(Object.keys(themeVars("dark", "#a08672"))).toHaveLength(9);
  });

  it("keeps body text readable on both themes", () => {
    for (const id of Object.keys(THEMES) as (keyof typeof THEMES)[]) {
      const t = THEMES[id];
      expect(contrast(t.ink, t.ground)).toBeGreaterThanOrEqual(7);
      expect(contrast(t.muted, t.ground)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.muted, t.surface)).toBeGreaterThanOrEqual(4.5);
      expect(contrast(t.danger, t.ground)).toBeGreaterThanOrEqual(4.5);
    }
  });
});

describe("themes", () => {
  it("offers light (the default look) and dark", () => {
    expect(Object.keys(THEMES).sort()).toEqual(["dark", "light"]);
  });

  it("uses ink on light and imakepage gold on dark as the default accents", () => {
    expect(DEFAULT_ACCENT).toEqual({ light: "#111827", dark: "#d4a843" });
  });
});

describe("accentAfterThemeChange", () => {
  it("swaps one theme's default accent for the other's", () => {
    expect(accentAfterThemeChange("#111827", "light", "dark")).toBe("#d4a843");
    expect(accentAfterThemeChange("#d4a843", "dark", "light")).toBe("#111827");
  });

  it("keeps a colour the agent picked", () => {
    expect(accentAfterThemeChange("#6b86a6", "dark", "light")).toBe("#6b86a6");
  });
});

describe("accentInk on any colour", () => {
  it("always reaches 4.5:1, on both themes, across a 4,096-colour grid", () => {
    const hex = (n: number) => n.toString(16).padStart(2, "0");
    const failures: string[] = [];
    for (let r = 0; r < 256; r += 17)
      for (let g = 0; g < 256; g += 17)
        for (let b = 0; b < 256; b += 17)
          for (const theme of ["dark", "light"] as const) {
            const accent = `#${hex(r)}${hex(g)}${hex(b)}`;
            if (contrast(accent, accentInk(accent, theme)) < 4.5) failures.push(`${accent} on ${theme}`);
          }
    expect(failures).toEqual([]);
  });
});

describe("--accent-text", () => {
  it("is the accent when it reads at 3:1 on the theme's ground and surface", () => {
    expect(themeVars("dark", "#a08672")["--accent-text"]).toBe("#a08672");
  });

  it("falls back to the theme's ink when the accent is too faint for focus rings and hover text", () => {
    expect(themeVars("light", "#d4a843")["--accent-text"]).toBe(THEMES.light.ink);
    expect(themeVars("dark", "#1f3d2b")["--accent-text"]).toBe(THEMES.dark.ink);
  });
});
