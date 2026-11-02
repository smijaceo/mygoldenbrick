/**
 * The world's plain arithmetic: the brick grid, the terrain, and fitting a name onto the
 * ground. Nothing here touches the browser, so it can be tested on its own.
 */
export const BRICK_W = 2;
export const BRICK_D = 1;

/** Where the visitor's name stands, and the point every overhead view looks at. */
export const NAME_CENTER = { x: 0, z: -20 };
/** Terrain is stored as a byte per texel, so heights are clamped to this for lighting. */
export const MAX_HEIGHT = 72;

export type Tier = "high" | "low";

export type GridSpec = {
  cols: number;
  rows: number;
  minX: number;
  minZ: number;
  farW: number;
  farD: number;
  lightScale: number;
  shadowSteps: number;
};

export function gridFor(tier: Tier): GridSpec {
  if (tier === "low") {
    return { cols: 72, rows: 250, minX: -72, minZ: -130, farW: 20, farD: 10, lightScale: 1, shadowSteps: 10 };
  }
  return { cols: 150, rows: 270, minX: -150, minZ: -170, farW: 14, farD: 7, lightScale: 2, shadowSteps: 14 };
}

/** A brick's centre. Odd rows sit half a brick along: that offset is what makes it masonry. */
export function brickCenter(spec: Pick<GridSpec, "minX" | "minZ">, col: number, row: number) {
  return {
    x: spec.minX + (col + 0.5 + (row % 2) * 0.5) * BRICK_W,
    z: spec.minZ + (row + 0.5) * BRICK_D,
  };
}

export function hash2(x: number, y: number) {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123;
  return s - Math.floor(s);
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

export function clamp01(t: number) {
  return t < 0 ? 0 : t > 1 ? 1 : t;
}

export function ramp(value: number, from: number, to: number) {
  if (to === from) return value >= to ? 1 : 0;
  return clamp01((value - from) / (to - from));
}

export function smoothstep(from: number, to: number, value: number) {
  return smooth(ramp(value, from, to));
}

export function valueNoise(x: number, y: number) {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = smooth(x - ix);
  const fy = smooth(y - iy);
  const a = hash2(ix, iy);
  const b = hash2(ix + 1, iy);
  const c = hash2(ix, iy + 1);
  const d = hash2(ix + 1, iy + 1);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

function fbm(x: number, y: number) {
  return valueNoise(x, y) * 0.55 + valueNoise(x * 2.1 + 7, y * 2.1 + 3) * 0.3 + valueNoise(x * 4.3 + 1, y * 4.3 + 9) * 0.15;
}

/** Stepped hills, rising out of a flat court around the name. Same input, same world. */
export function terrain(x: number, z: number) {
  const dx = (x - NAME_CENTER.x) / 1.25;
  const dz = z - NAME_CENTER.z;
  const d = Math.sqrt(dx * dx + dz * dz);
  const rim = smoothstep(84, 210, d);
  // Lower on the left, where the words sit against the sky; the town climbs to the right.
  const side = 0.34 + 0.66 * smoothstep(-140, 40, x);
  const hills = rim * (0.28 + fbm(x * 0.011 + 3, z * 0.011 + 7)) * 66 * side;
  return Math.floor(hills / 2.2) * 2.2;
}

export type House = { x: number; z: number; halfW: number; halfL: number; eave: number; roof: number; ground: number };

/**
 * A neighbourhood of crow-stepped brick houses on the slopes around the court. Each sits on
 * its own plot, set by a jittered grid so the rows feel laid out rather than scattered.
 */
export function buildHouses(spec: Pick<GridSpec, "cols" | "rows" | "minX" | "minZ">) {
  const houses: House[] = [];
  const maxX = spec.minX + spec.cols * BRICK_W;
  const maxZ = spec.minZ + spec.rows * BRICK_D;
  for (let gx = spec.minX + 12; gx < maxX - 12; gx += 25) {
    for (let gz = spec.minZ + 12; gz < maxZ - 8; gz += 29) {
      const jitterX = (hash2(gx, gz) - 0.5) * 7;
      const jitterZ = (hash2(gz, gx) - 0.5) * 8;
      const x = gx + jitterX;
      const z = gz + jitterZ;
      const dx = (x - NAME_CENTER.x) / 1.25;
      const dz = z - NAME_CENTER.z;
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d < 92) continue;
      // The view from the opening shot runs through here; keep it open.
      if (z > 20 && Math.abs(x) < 44) continue;
      // Nor behind the headline.
      if (x < -38 && z < -60) continue;
      if (hash2(gx * 1.7, gz * 0.9) < 0.3) continue;
      const seed = hash2(x, z);
      houses.push({
        x,
        z,
        halfW: 6 + Math.round(seed * 2) * 2,
        halfL: 6 + hash2(z, x) * 5,
        eave: 3.2 + seed * 2.6,
        roof: 3.4 + hash2(x + 3, z) * 2.2,
        ground: terrain(x, z),
      });
    }
  }
  return houses;
}

/** A house's height at a point, or 0 outside it. The roof steps down to each side. */
export function houseHeight(house: House, x: number, z: number) {
  const across = Math.abs(x - house.x);
  if (across > house.halfW || Math.abs(z - house.z) > house.halfL) return 0;
  const steps = 3;
  const level = Math.floor((1 - across / (house.halfW + 0.001)) * steps + 0.5) / steps;
  return house.ground + house.eave + house.roof * level;
}

export type NameFit = { lines: string[]; size: number };

const PLACEHOLDER = "YOUR NAME";
/** Line spacing against font size: tight, because capitals have no descenders to clear. */
const LEADING = 0.88;

/** Every way to break these words into at most three lines, keeping word order. */
function breakings(words: string[]): string[][] {
  if (words.length <= 1) return [words];
  const result: string[][] = [[words.join(" ")]];
  for (let a = 1; a < words.length; a++) {
    const first = words.slice(0, a).join(" ");
    result.push([first, words.slice(a).join(" ")]);
    for (let b = a + 1; b < words.length; b++) {
      result.push([first, words.slice(a, b).join(" "), words.slice(b).join(" ")]);
    }
  }
  return result;
}

/**
 * Sets a name as large as it will go in a box, in capitals, on up to three lines. Names too
 * long to stay legible in bricks are shortened here; the full name stays in the page's text.
 */
export function fitName(
  name: string,
  box: { width: number; height: number; maxSize: number; minSize: number; comfortSize?: number },
  measure: (text: string, size: number) => number,
): NameFit {
  const clean = name.trim().replace(/\s+/g, " ").toLocaleUpperCase() || PLACEHOLDER;
  const fit = (words: string[]) => {
    let top: NameFit = { lines: [words.join(" ")], size: 0 };
    for (const lines of breakings(words)) {
      const widest = Math.max(...lines.map((l) => measure(l, 100) / 100));
      const size = Math.min(box.maxSize, box.width / widest, box.height / (lines.length * LEADING));
      if (size > top.size) top = { lines, size };
    }
    return top;
  };
  // More than twelve words would make the search below slow, and no longer reads as a name.
  const words = clean.split(" ").slice(0, 12);
  let best = fit(words);
  // A name too long to read in bricks stands on its first part; the page keeps it in full.
  const comfort = box.comfortSize ?? box.minSize;
  if (best.size < comfort) {
    for (const shorter of [words[0], words[0].split("-")[0]]) {
      const attempt = fit([shorter]);
      if (attempt.size > best.size) best = attempt;
      if (best.size >= comfort) break;
    }
  }
  if (best.size >= box.minSize) return best;

  // Still too small: keep the size legible and trim the longest line until it fits.
  const lines = best.lines.map((line) => {
    let cut = line;
    while (cut.length > 1 && measure(`${cut}…`, box.minSize) > box.width) cut = cut.slice(0, -1);
    return cut === line && measure(line, box.minSize) <= box.width ? line : `${cut.trimEnd()}…`;
  });
  return { lines, size: box.minSize };
}

export const nameLineHeight = (size: number) => size * LEADING;
