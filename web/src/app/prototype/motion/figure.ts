/**
 * Mike Bjork, built of small blocks and drawn from his portrait: bald head, short grey beard,
 * a big smile, navy blazer over an open pale blue shirt, arms folded, a watch on his wrist.
 * Also what he does: walk over to the gold brick, pick it up and hold it high.
 * Nothing here touches the browser, so all of it can be tested on its own.
 *
 * Grid: x runs to the viewer's right, y up, z towards the viewer. He faces +z.
 */
export const VOXEL = 0.3;
/** Rows of blocks from the soles of his shoes to the top of his head. */
export const FIGURE_ROWS = 42;
/** The rows his head, torso and arms turn about. */
export const NECK_ROW = 26.5;
export const HIP_ROW = 13.5;
export const SHOULDER_ROW = 24.5;
export const SHOULDER_X = 9;
/** From his shoulder to his fingertips, in blocks. */
export const ARM_REACH = 17;

export const PART_BODY = 0;
export const PART_HEAD = 1;
export const PART_EYE = 2;
export const PART_FOLDED = 3;
export const PART_ARM_RIGHT = 4;
export const PART_ARM_LEFT = 5;
export const PART_LEG_RIGHT = 6;
export const PART_LEG_LEFT = 7;
type Part = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
type Rgb = readonly [number, number, number];

export type Voxel = {
  x: number;
  y: number;
  z: number;
  color: Rgb;
  part: Part;
  /** 1 out in the open, lower in a crease, so folded arms read at a distance. */
  occlusion: number;
  seed: number;
  /** Where an arm block starts, within his folded arms, when the arms come undone. */
  from: { x: number; y: number; z: number };
};

// Linear light, so the world's lighting does the work. Close to his photo, but deep enough to
// sit in the dusk with the clay around him rather than look pasted on top of it.
const SKIN: Rgb = [0.72, 0.42, 0.31];
const SKIN_SHADE: Rgb = [0.47, 0.25, 0.19];
const SKIN_WARM: Rgb = [0.76, 0.37, 0.27];
const SKIN_HIGH: Rgb = [0.84, 0.54, 0.41];
const BEARD: Rgb = [0.5, 0.46, 0.42];
const BEARD_DARK: Rgb = [0.25, 0.22, 0.2];
const BROW: Rgb = [0.3, 0.21, 0.16];
const EYE_BLUE: Rgb = [0.06, 0.2, 0.44];
const LID: Rgb = [0.08, 0.04, 0.035];
const MOUTH: Rgb = [0.045, 0.014, 0.014];
const TEETH: Rgb = [1, 0.95, 0.82];
const BLAZER: Rgb = [0.02, 0.055, 0.19];
const BLAZER_LIGHT: Rgb = [0.03, 0.08, 0.25];
const BLAZER_DARK: Rgb = [0.012, 0.035, 0.13];
const SHIRT: Rgb = [0.66, 0.76, 0.9];
const SHIRT_SHADE: Rgb = [0.44, 0.54, 0.7];
const TROUSER: Rgb = [0.045, 0.045, 0.06];
const SHOE: Rgb = [0.12, 0.06, 0.032];
const SOLE: Rgb = [0.025, 0.018, 0.016];
const STRAP: Rgb = [0.17, 0.08, 0.04];
const WATCH: Rgb = [0.92, 0.82, 0.62];

/** How wide his head is at each row, from the chin of his beard to the top of his dome. */
const HEAD_HALF: Record<number, number> = {
  27: 3, 28: 4, 29: 4.6, 30: 5, 31: 5.3, 32: 5.6, 33: 5.6, 34: 5.6, 35: 5.6, 36: 5.6, 37: 5.6, 38: 5.4, 39: 5, 40: 4.4, 41: 3.2,
};

// His face, as seen from the front, eleven blocks wide. A dot leaves plain skin.
const FACE: Record<number, string> = {
  37: ".bbb...bbb.",
  35: "..dEd.dEd..",
  34: "..sss.sss..",
  33: ".c..nNn..c.",
  32: "Gc..nNn..cG",
  31: "GGmgggggmGG",
  30: "GGGTTTTTGGG",
  29: "GGGGgggGGGG",
  28: ".GGGGGGGGG.",
  27: "..GGGGGGG..",
};

const hash = (x: number, y: number, z: number) => {
  const v = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return v - Math.floor(v);
};

const key = (x: number, y: number, z: number) => `${x},${y},${z}`;

/** Parts move apart, so one can't hide another: a raised arm mustn't leave a hole behind it. */
const groupOf = (part: Part) => (part === PART_EYE ? PART_HEAD : part);

export function buildFigure(): Voxel[] {
  const cells = new Map<string, { x: number; y: number; z: number; color: Rgb; part: Part }>();
  const put = (x: number, y: number, z: number, color: Rgb, part: Part = PART_BODY) => {
    cells.set(key(x, y, z), { x, y, z, color, part });
  };
  const box = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, color: Rgb, part: Part = PART_BODY) => {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) put(x, y, z, color, part);
  };

  // Shoes and legs: sturdy, with just a line of daylight between them.
  for (const [a, b, part] of [[-6, -1, PART_LEG_RIGHT], [1, 6, PART_LEG_LEFT]] as const) {
    box(a, b, 0, 0, -2, 5, SOLE, part);
    box(a, b, 1, 1, -2, 5, SHOE, part);
    box(a, b, 2, 2, -2, 3, SHOE, part);
    box(a, b, 3, 12, -2, 2, TROUSER, part);
  }
  box(-6, 6, 13, 13, -2, 2, TROUSER);

  // The blazer, a little broad, as he is.
  box(-7, 7, 14, 26, -3, 3, BLAZER);
  box(-6, 6, 14, 20, 4, 4, BLAZER);
  box(-9, 9, 24, 25, -3, 3, BLAZER);
  box(-8, 8, 26, 26, -3, 3, BLAZER);
  box(-7, 7, 14, 14, -3, 4, BLAZER_DARK);

  // Arms folded, as in his portrait. Right arm underneath, its hand resting on the far sleeve...
  box(-10, -8, 15, 23, -3, 3, BLAZER, PART_FOLDED);
  box(8, 10, 15, 23, -3, 3, BLAZER, PART_FOLDED);
  box(-10, -8, 15, 20, 4, 6, BLAZER, PART_FOLDED);
  box(-7, 3, 15, 17, 5, 6, BLAZER_DARK, PART_FOLDED);
  for (let x = 4; x <= 7; x++) box(x, x, 21, 22, 5, 6, x % 2 ? SKIN_SHADE : SKIN, PART_FOLDED);
  // ...left across the top: sleeve, shirt cuff, watch, hand.
  box(8, 10, 16, 22, 4, 7, BLAZER, PART_FOLDED);
  box(1, 7, 18, 20, 5, 7, BLAZER_LIGHT, PART_FOLDED);
  box(-1, 0, 18, 20, 5, 7, SHIRT, PART_FOLDED);
  box(-3, -2, 18, 20, 5, 7, STRAP, PART_FOLDED);
  box(-3, -2, 19, 19, 8, 8, WATCH, PART_FOLDED);
  box(-7, -4, 18, 20, 5, 7, SKIN, PART_FOLDED);
  box(-7, -7, 18, 20, 7, 7, SKIN_SHADE, PART_FOLDED);

  // The same arms hanging free, for when he has something to do. They stay hidden until then.
  for (const [side, part] of [[-1, PART_ARM_RIGHT], [1, PART_ARM_LEFT]] as const) {
    const [a, b] = side < 0 ? [-10, -8] : [8, 10];
    box(a, b, 12, 25, -1, 1, BLAZER, part);
    box(a, b, 11, 11, -1, 1, SHIRT, part);
    box(a, b, 8, 10, -1, 1, SKIN, part);
  }
  box(8, 10, 12, 12, -1, 1, STRAP, PART_ARM_LEFT);
  put(9, 12, 2, WATCH, PART_ARM_LEFT);

  // Open-necked shirt between the lapels.
  const open: Record<number, number> = { 21: 0, 22: 1, 23: 1, 24: 2, 25: 2, 26: 3 };
  for (let y = 21; y <= 26; y++) {
    const half = open[y];
    box(-half, half, y, y, 3, 3, SHIRT);
    box(-half - 2, -half - 1, y, y, 4, 4, BLAZER_LIGHT);
    box(half + 1, half + 2, y, y, 4, 4, BLAZER_LIGHT);
  }
  box(0, 0, 21, 24, 3, 3, SHIRT_SHADE);
  box(-1, 1, 26, 26, 3, 3, SKIN_SHADE);
  box(0, 0, 25, 25, 3, 3, SKIN_SHADE);
  box(-4, -2, 26, 26, 3, 4, SHIRT);
  box(2, 4, 26, 26, 3, 4, SHIRT);

  // Head: a rounded block, bald on top, with the beard wrapping round his jaw.
  const front = new Map<string, number>();
  for (let y = 27; y <= 41; y++) {
    const half = HEAD_HALF[y];
    for (let x = -6; x <= 6; x++) {
      for (let z = -6; z <= 6; z++) {
        if (Math.max(Math.abs(x), Math.abs(z)) * 0.55 + Math.hypot(x, z) * 0.45 > half) continue;
        const onJaw = z >= -1 && (y <= 31 || (y <= 33 && Math.abs(x) >= 5));
        const color = onJaw
          ? hash(x, y, z) > 0.68 ? BEARD_DARK : BEARD
          : y >= 39 && z >= 0 && Math.abs(x) <= 2 ? SKIN_HIGH : y <= 31 ? SKIN_SHADE : SKIN;
        put(x, y, z, color, PART_HEAD);
        const at = key(x, y, 0);
        front.set(at, Math.max(front.get(at) ?? -99, z));
      }
    }
  }
  const paint: Record<string, Rgb> = {
    b: BROW, E: EYE_BLUE, d: LID, s: SKIN_SHADE, n: SKIN_SHADE, N: SKIN_HIGH, c: SKIN_WARM,
    m: MOUTH, T: TEETH, g: BEARD_DARK,
  };
  for (const [row, text] of Object.entries(FACE)) {
    const y = Number(row);
    [...text].forEach((ch, i) => {
      const x = i - 5;
      const z = front.get(key(x, y, 0));
      if (z === undefined || ch === ".") return;
      const color = ch === "G" ? (hash(x, y, 3) > 0.72 ? BEARD_DARK : BEARD) : paint[ch];
      put(x, y, z, color, ch === "E" || ch === "d" ? PART_EYE : PART_HEAD);
    });
  }
  // Nose and ears stand proud of the block.
  const noseZ = (front.get(key(0, 33, 0)) ?? 5) + 1;
  box(-1, 1, 32, 32, noseZ, noseZ, SKIN, PART_HEAD);
  box(0, 0, 33, 33, noseZ, noseZ, SKIN_HIGH, PART_HEAD);
  for (const x of [-6, 6]) {
    box(x, x, 33, 35, -1, 0, SKIN, PART_HEAD);
    put(x, 34, 0, SKIN_SHADE, PART_HEAD);
  }

  // Only blocks that can be seen are kept, and creases are darkened.
  const sameGroup = (x: number, y: number, z: number, part: Part) => {
    const other = cells.get(key(x, y, z));
    return !!other && groupOf(other.part) === groupOf(part);
  };
  const seen = [...cells.values()].filter(({ x, y, z, part }) =>
    ![[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]].every(([a, b, c]) => sameGroup(x + a, y + b, z + c, part)));
  const folded = seen.filter((c) => c.part === PART_FOLDED);
  return seen.map((cell, i) => {
    const { x, y, z, part } = cell;
    let around = 0;
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
      if ((a || b || c) && sameGroup(x + a, y + b, z + c, part)) around++;
    }
    // A block on a flat wall has 17 neighbours. Anything more means it sits in a crease.
    const occlusion = Math.max(0.55, Math.min(1, 1 - Math.max(0, around - 17) * 0.06));
    const isArm = part === PART_ARM_RIGHT || part === PART_ARM_LEFT;
    const start = isArm ? folded[(i * 7) % folded.length] : cell;
    return { ...cell, occlusion, seed: hash(x, y, z), from: { x: start.x, y: start.y, z: start.z } };
  });
}

/** Where he stands. On a phone he moves left a little, so the gold brick doesn't hide him. */
export const figureAt = (wide: boolean) => (wide ? { x: 3, z: 24 } : { x: -2.5, z: 24 });

/** Half his width, as a share of his height: how far from his centre a pointer counts as on him. */
export const FIGURE_HALF_WIDTH = 0.27;

/* ---------- What he does ---------- */

/** Bent this far at the hips, with arms hanging straight down, his hands reach the ground. */
const GRAB_BEND = 1.19;
const WALK_SPEED = 7;
/** Radians of leg swing per unit walked, so his feet keep pace with the ground. */
const STRIDE = 0.77;
const HOLD_SECONDS = 3;

type Place = { x: number; z: number };

export type Pose = {
  x: number;
  z: number;
  yaw: number;
  bend: number;
  armRight: number;
  armLeft: number;
  /** How far his arms lean in, so his hands meet under the brick. */
  inward: number;
  shrug: number;
  legRight: number;
  legLeft: number;
  /** 0 arms folded, 1 arms free. */
  free: number;
  /** 0 the brick is where it lies, 1 it's in his hands. */
  grip: number;
  /** 0 arms down, 1 arms overhead. */
  lift: number;
  hop: number;
  lookX: number;
  lookY: number;
  stride: number;
  walking: number;
};

export const idlePose = (home: Place): Pose => ({
  x: home.x, z: home.z, yaw: 0, bend: 0, armRight: 0, armLeft: 0, inward: 0, shrug: 0,
  legRight: 0, legLeft: 0, free: 0, grip: 0, lift: 0, hop: 0, lookX: 0, lookY: 0, stride: 0, walking: 0,
});

/** Works out the route from where he stands to just behind the brick, facing the same way it lies. */
export function planFor(home: Place, brick: Place, brickYaw: number) {
  // Shoulders to hands, bent at the hips: how far in front of his feet his hands come down.
  const reach = (SHOULDER_ROW - HIP_ROW) * Math.sin(GRAB_BEND) * VOXEL;
  const spot = { x: brick.x - Math.sin(brickYaw) * reach, z: brick.z - Math.cos(brickYaw) * reach };
  const distance = Math.hypot(spot.x - home.x, spot.z - home.z);
  const walk = distance / WALK_SPEED;
  const readyEnd = 0.5;
  const walkEnd = readyEnd + walk;
  const turnEnd = walkEnd + 0.3;
  const bendEnd = turnEnd + 0.5;
  const liftEnd = bendEnd + 1.15;
  const landAt = liftEnd + 0.42;
  const holdEnd = liftEnd + HOLD_SECONDS;
  const lowerEnd = holdEnd + 1.05;
  const straightEnd = lowerEnd + 0.5;
  const turnBackEnd = straightEnd + 0.28;
  const walkBackEnd = turnBackEnd + walk;
  const end = walkBackEnd + 0.6;
  return {
    home, brick, brickYaw, spot, distance,
    walkYaw: Math.atan2(spot.x - home.x, spot.z - home.z),
    homeYaw: Math.atan2(home.x - spot.x, home.z - spot.z),
    readyEnd, walkEnd, turnEnd, bendEnd, liftEnd, landAt, holdEnd, lowerEnd, straightEnd, turnBackEnd, walkBackEnd, end,
  };
}
export type Plan = ReturnType<typeof planFor>;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ease = (t: number, a: number, b: number) => {
  const u = clamp01((t - a) / (b - a));
  return u * u * (3 - 2 * u);
};
/** Turns the short way round. */
const turn = (from: number, to: number, u: number) => {
  const d = ((((to - from + Math.PI) % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2)) - Math.PI;
  return from + d * u;
};

export function poseAt(p: Plan, t: number): Pose {
  const out = ease(t, p.readyEnd, p.walkEnd);
  const back = ease(t, p.turnBackEnd, p.walkBackEnd);
  const along = out - back;

  let yaw = turn(0, p.walkYaw, ease(t, 0.1, p.readyEnd));
  yaw = turn(yaw, p.brickYaw, ease(t, p.walkEnd - 0.1, p.turnEnd));
  yaw = turn(yaw, p.homeYaw, ease(t, p.straightEnd, p.turnBackEnd));
  yaw = turn(yaw, 0, ease(t, p.walkBackEnd - 0.1, p.end));

  const bend = GRAB_BEND * (ease(t, p.turnEnd, p.bendEnd) * (1 - ease(t, p.bendEnd, p.liftEnd))
    + ease(t, p.holdEnd, p.lowerEnd) * (1 - ease(t, p.lowerEnd, p.straightEnd)));
  const lift = ease(t, p.bendEnd, p.liftEnd) * (1 - ease(t, p.holdEnd, p.lowerEnd));

  const walking = ease(t, p.readyEnd, p.readyEnd + 0.2) * (1 - ease(t, p.walkEnd - 0.2, p.walkEnd))
    + ease(t, p.turnBackEnd, p.turnBackEnd + 0.2) * (1 - ease(t, p.walkBackEnd - 0.2, p.walkBackEnd));
  const stride = (out + back) * p.distance * STRIDE;
  const leg = Math.sin(stride) * 0.55 * walking;
  const swing = Math.sin(stride) * 0.45 * walking;

  // Arms follow gravity while he's bent over, then go up past his head.
  const holding = ease(t, p.liftEnd, p.liftEnd + 0.3) * (1 - ease(t, p.holdEnd - 0.2, p.holdEnd));
  const arm = -bend * (1 - lift) - Math.PI * lift + Math.sin((t - p.liftEnd) * 3.2) * 0.035 * holding;

  const hopU = clamp01((t - p.liftEnd) / (p.landAt - p.liftEnd));
  return {
    x: p.home.x + (p.spot.x - p.home.x) * along,
    z: p.home.z + (p.spot.z - p.home.z) * along,
    yaw,
    bend,
    armRight: arm + swing,
    armLeft: arm - swing,
    inward: 0.19 * lift,
    shrug: 1.5 * lift,
    legRight: leg,
    legLeft: -leg,
    free: ease(t, 0, p.readyEnd) * (1 - ease(t, p.walkBackEnd, p.end)),
    grip: ease(t, p.bendEnd - 0.16, p.bendEnd) * (1 - ease(t, p.lowerEnd, p.lowerEnd + 0.14)),
    lift,
    hop: t > p.liftEnd && t < p.landAt ? 4 * hopU * (1 - hopU) * 0.7 : 0,
    lookX: 0,
    lookY: -0.35 * (bend / GRAB_BEND) - 0.14 * lift,
    stride,
    walking,
  };
}

/** The middle of the brick when it's in his hands, relative to the ground under his feet. */
export function brickInHands(pose: Pose) {
  const arm = (pose.armRight + pose.armLeft) / 2;
  // Gripped by its ends down low; resting on his palms up high.
  const length = (ARM_REACH + (-1.5 + 4.2 * pose.lift)) * Math.cos(pose.inward);
  const y0 = SHOULDER_ROW + pose.shrug - length * Math.cos(arm) - HIP_ROW;
  const z0 = -length * Math.sin(arm);
  const y = HIP_ROW + y0 * Math.cos(pose.bend) - z0 * Math.sin(pose.bend);
  const z = y0 * Math.sin(pose.bend) + z0 * Math.cos(pose.bend);
  return {
    x: pose.x + Math.sin(pose.yaw) * z * VOXEL,
    y: (y + 0.5) * VOXEL,
    z: pose.z + Math.cos(pose.yaw) * z * VOXEL,
  };
}
