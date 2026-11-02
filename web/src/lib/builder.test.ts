import { describe, expect, it } from "vitest";
import { previewCopy, slugify } from "./builder";

describe("previewCopy", () => {
  it("falls back to 'Your name' when the name is empty", () => {
    expect(previewCopy("", "").title).toBe("Your name");
  });

  it("names the area in the heading", () => {
    expect(previewCopy("Jordan Avery", "Dundee").heading).toBe("Homes for sale in Dundee");
  });

  it("uses a general heading when the area is empty", () => {
    expect(previewCopy("Jordan Avery", "").heading).toBe("Homes for sale near you");
  });

  it("makes the same slug signup will use", () => {
    expect(previewCopy("Jordan Avery", "").slug).toBe("jordan-avery");
  });

  it("shows a your-name placeholder address before anything is typed", () => {
    expect(previewCopy("", "").slug).toBe("your-name");
  });

  it("keeps a long name intact (wrapping is the layout's job)", () => {
    const name = "Maximiliana Alexandra Featherstonehaugh-Montgomery Jr. III";
    expect(previewCopy(name, "").title).toBe(name);
  });

  it("trims surrounding spaces", () => {
    expect(previewCopy("  Jordan  ", "  Benson ").heading).toBe("Homes for sale in Benson");
  });
});

describe("slugify", () => {
  it("falls back to 'agent' for names with no letters or digits", () => {
    expect(slugify("🏠🏠")).toBe("agent");
  });
});
