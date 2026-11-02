import { describe, expect, it } from "vitest";
import { countTicks, labelIndexes } from "./chart";

describe("countTicks", () => {
  it("puts the top tick above the maximum on a round step", () => {
    expect(countTicks(7)).toEqual([0, 2, 4, 6, 8]);
    expect(countTicks(12)).toEqual([0, 5, 10, 15]);
  });

  it("never draws a top tick equal to the maximum", () => {
    expect(countTicks(10)).toEqual([0, 5, 10, 15]);
  });

  it("uses whole numbers for tiny counts", () => {
    expect(countTicks(1)).toEqual([0, 1, 2]);
    expect(countTicks(0)).toEqual([0, 1]);
  });

  it("keeps to five ticks or fewer for big counts", () => {
    const ticks = countTicks(1234);
    expect(ticks.length).toBeLessThanOrEqual(5);
    expect(ticks.at(-1)!).toBeGreaterThan(1234);
  });
});

describe("labelIndexes", () => {
  it("labels on one step that lands on the last day", () => {
    expect(labelIndexes(14, 4)).toEqual([1, 5, 9, 13]);
  });
});
