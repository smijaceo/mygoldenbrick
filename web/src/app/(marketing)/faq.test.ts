import { describe, expect, it } from "vitest";
import { QUESTIONS } from "./faq";

const answer = (topic: RegExp) => QUESTIONS.find((item) => topic.test(item.q))?.a ?? "";

describe("the FAQ stays honest about what isn't built", () => {
  it("says MLS listings aren't connected", () => {
    expect(answer(/MLS/)).toMatch(/^Not yet/);
  });

  it("says email and texts aren't sent", () => {
    expect(answer(/email and texts/)).toMatch(/^Not yet/);
  });

  it("says custom domains aren't available", () => {
    expect(answer(/domain/)).toMatch(/^Not yet/);
  });

  it("says pricing isn't set", () => {
    expect(answer(/cost/)).toMatch(/isn’t set/);
  });

  it("says the platform doesn't supply leads", () => {
    expect(answer(/bring me leads/)).toMatch(/^No\./);
  });
});
