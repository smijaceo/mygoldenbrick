import { describe, expect, it } from "vitest";
import { dateFromIso, isoFromDate, unit } from "./format";

describe("unit", () => {
  it("uses the singular for one", () => {
    expect(unit(1, "bed")).toBe("1 bed");
  });

  it("uses the plural for more than one", () => {
    expect(unit(2, "bath")).toBe("2 baths");
  });
});

describe("calendar dates", () => {
  it("writes a local date as YYYY-MM-DD", () => {
    expect(isoFromDate(new Date(2026, 9, 5, 23, 30))).toBe("2026-10-05");
  });

  it("reads YYYY-MM-DD back as that local day", () => {
    const d = dateFromIso("2026-10-05")!;
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 5]);
  });

  it("returns undefined for anything that is not a date", () => {
    expect(dateFromIso("")).toBeUndefined();
    expect(dateFromIso("2026-13-40")).toBeUndefined();
  });
});
