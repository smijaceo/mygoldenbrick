import { describe, expect, it } from "vitest";
import { askLead, firstName } from "./demo";

describe("firstName", () => {
  it("takes the first word of a typed name", () => {
    expect(firstName("  Mike Bjork ")).toBe("Mike");
  });

  it("gives nothing for an empty name", () => {
    expect(firstName("   ")).toBe("");
  });
});

describe("askLead", () => {
  it("names the home that was asked about", () => {
    expect(askLead(0, "3540 Pine St").message).toContain("3540 Pine St");
  });

  it("moves through different sample buyers", () => {
    expect(askLead(0, "x").name).not.toBe(askLead(1, "x").name);
  });

  it("keeps working however many times it is pressed", () => {
    expect(askLead(4001, "x").name.length).toBeGreaterThan(0);
  });
});
