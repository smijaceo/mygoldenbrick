import { describe, expect, it } from "vitest";
import { brickCenter, buildHouses, fitName, gridFor, houseHeight, terrain } from "./field";
import { timeline, type Marks } from "./timeline";

/** Condensed capitals are about half as wide as they are tall. */
const measure = (text: string, size: number) => text.length * size * 0.5;
const box = { width: 170, height: 70, maxSize: 46, minSize: 12 };

describe("fitName", () => {
  it("shows a placeholder when no name is given", () => {
    expect(fitName("   ", box, measure).lines.join(" ")).toBe("YOUR NAME");
  });

  it("sets a typed name in capitals and tidies its spacing", () => {
    expect(fitName("  jordan   avery ", box, measure).lines.join(" ")).toBe("JORDAN AVERY");
  });

  it("breaks onto more lines in a narrow box to stay large", () => {
    const narrow = { width: 86, height: 130, maxSize: 46, minSize: 12 };
    const fit = fitName("Bartholomew Montgomery", narrow, measure);
    expect(fit.lines.length).toBe(2);
    expect(fit.size).toBeGreaterThan(14);
  });

  it("never lets any line overflow the box", () => {
    for (const name of ["A", "Al", "Jordan Avery", "María-José Fernández de la Cruz", "x".repeat(60), "李小龙"]) {
      const fit = fitName(name, box, measure);
      for (const line of fit.lines) expect(measure(line, fit.size)).toBeLessThanOrEqual(box.width + 0.001);
      expect(fit.lines.length).toBeLessThanOrEqual(3);
    }
  });

  it("keeps a legible size for a very long single word, shortening it", () => {
    const fit = fitName("x".repeat(200), box, measure);
    expect(fit.size).toBe(box.minSize);
    expect(fit.lines[0].endsWith("…")).toBe(true);
  });

  it("stands a very long name on its first part, so it stays readable", () => {
    const fit = fitName("Maximiliana-Alexandria Featherstonehaugh-Montgomery III", { ...box, comfortSize: 24 }, measure);
    expect(fit.lines).toEqual(["MAXIMILIANA"]);
    expect(fit.size).toBeGreaterThanOrEqual(24);
  });

  it("copes with a name of many short words", () => {
    const fit = fitName(Array.from({ length: 40 }, () => "ab").join(" "), box, measure);
    expect(fit.size).toBeGreaterThan(0);
  });
});

describe("the world", () => {
  it("offsets every other row by half a brick", () => {
    const spec = gridFor("low");
    const a = brickCenter(spec, 0, 0);
    const b = brickCenter(spec, 0, 1);
    expect(b.x - a.x).toBeCloseTo(1);
    expect(b.z - a.z).toBeCloseTo(1);
  });

  it("keeps the court around the name flat", () => {
    for (let x = -60; x <= 60; x += 12) for (let z = -60; z <= 30; z += 10) expect(terrain(x, z)).toBe(0);
  });

  it("builds the same neighbourhood each time, with no house in the court", () => {
    const spec = gridFor("high");
    const houses = buildHouses(spec);
    expect(houses.length).toBeGreaterThan(10);
    expect(houses).toEqual(buildHouses(spec));
    for (const h of houses) expect(Math.hypot((h.x) / 1.25, h.z + 20)).toBeGreaterThanOrEqual(92);
  });

  it("gives a house height only inside its walls, highest along the ridge", () => {
    const house = { x: 0, z: 0, halfW: 8, halfL: 8, eave: 4, roof: 4, ground: 0 };
    expect(houseHeight(house, 20, 0)).toBe(0);
    expect(houseHeight(house, 0, 0)).toBeGreaterThan(houseHeight(house, 7.5, 0));
  });
});

describe("timeline on a phone", () => {
  const marks: Marks = {
    nameTop: 844,
    nameRest: 1100,
    demoStart: 2400,
    demoEnd: 5000,
    closeTop: 5800,
    siteIn: [2400, 2900],
    siteOut: [3300, 3500],
    inboxIn: [3900, 4400],
    inboxOut: [4800, 5000],
  };

  it("never shows the site and the inbox on the same bricks at once", () => {
    for (let y = 0; y < 6000; y += 25) {
      const r = timeline(y, marks);
      expect(r.flipA > 0 && r.flipB > 0).toBe(false);
    }
  });
});

describe("timeline", () => {
  const marks: Marks = {
    nameTop: 900,
    nameRest: 1200,
    demoStart: 2400,
    demoEnd: 4400,
    closeTop: 5300,
    siteIn: [2400, 2900],
    siteOut: [4200, 4400],
    inboxIn: [2950, 3400],
    inboxOut: [4200, 4400],
  };

  it("runs the camera through its path in order", () => {
    expect(timeline(0, marks).q).toBe(0);
    expect(timeline(900, marks).q).toBe(1);
    expect(timeline(1200, marks).q).toBe(1);
    expect(timeline(1800, marks).q).toBeCloseTo(1.5);
    expect(timeline(3000, marks).q).toBe(2);
    expect(timeline(5300, marks).q).toBe(3);
    expect(timeline(9000, marks).q).toBe(3);
  });

  it("gives the same reading at a position whichever way you arrived", () => {
    const forward = [0, 700, 1900, 3100].map((y) => timeline(y, marks));
    const back = [3100, 1900, 700, 0].map((y) => timeline(y, marks)).reverse();
    expect(back).toEqual(forward);
  });

  it("shows the site first, then the inbox, and removes both before leaving", () => {
    expect(timeline(2900, marks).flipA).toBe(1);
    expect(timeline(2900, marks).flipB).toBe(0);
    expect(timeline(3400, marks).flipB).toBe(1);
    expect(timeline(4400, marks).flipA).toBe(0);
    expect(timeline(4400, marks).flipB).toBe(0);
  });
});
