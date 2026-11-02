import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Logo } from "./logo";

const html = (props: Parameters<typeof Logo>[0] = {}) => renderToStaticMarkup(createElement(Logo, props));

describe("Logo", () => {
  it("names itself imakepage for screen readers", () => {
    expect(html()).toContain('aria-label="imakepage"');
  });

  it("shows imakepage's gold brick mark, decorative only", () => {
    expect(html()).toMatch(/<img[^>]*src="\/brand\/brick\.png"[^>]*alt=""/);
  });

  it("shows the wordmark beside the brick by default", () => {
    expect(html()).toContain(">imakepage<");
  });

  it("shows only the brick in the mark variant", () => {
    const mark = html({ variant: "mark" });
    expect(mark).toContain("/brand/brick.png");
    expect(mark).not.toContain(">imakepage<");
  });
});
