import { describe, expect, it } from "vitest";
import { EDITABLE_FIELDS, validateField } from "./site-fields";

describe("validateField", () => {
  it("accepts a known theme", () => {
    expect(validateField("theme", "light")).toBeNull();
  });

  it("rejects the retired daylight theme", () => {
    expect(validateField("theme", "daylight")).not.toBeNull();
  });

  it("rejects an unknown theme", () => {
    expect(validateField("theme", "neon")).not.toBeNull();
  });

  it("still rejects a malformed accent colour", () => {
    expect(validateField("accent_color", "bronze")).not.toBeNull();
  });

  it("lets agents edit the theme", () => {
    expect(EDITABLE_FIELDS).toContain("theme");
  });
});

describe("retired v1 fields", () => {
  it("no longer lets agents edit the main colour or font style", () => {
    expect(EDITABLE_FIELDS).not.toContain("primary_color");
    expect(EDITABLE_FIELDS).not.toContain("font_style");
  });
});
