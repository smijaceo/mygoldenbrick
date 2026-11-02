import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Brand, BRAND_NAME } from "./brand";

describe("Brand", () => {
  const html = renderToStaticMarkup(createElement(Brand));

  it("is called My Golden Brick", () => {
    expect(BRAND_NAME).toBe("My Golden Brick");
    expect(html).toContain("My Golden Brick");
  });

  it("uses the gold brick mark, decorative only", () => {
    expect(html).toMatch(/<img[^>]*src="\/brand\/brick\.png"[^>]*alt=""/);
  });

  it("does not carry the imakepage name", () => {
    expect(html.toLowerCase()).not.toContain("imakepage");
  });
});
