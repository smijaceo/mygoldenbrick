import { describe, expect, it } from "vitest";
import {
  FIGURE_ROWS, PART_ARM_LEFT, PART_ARM_RIGHT, PART_BODY, PART_EYE, PART_FOLDED, PART_HEAD, VOXEL,
  brickInHands, buildFigure, idlePose, planFor, poseAt,
} from "./figure";

describe("the block figure", () => {
  const voxels = buildFigure();
  const has = new Set(voxels.map((v) => `${v.x},${v.y},${v.z}`));

  it("stays light enough to draw on a phone", () => {
    expect(voxels.length).toBeGreaterThan(800);
    expect(voxels.length).toBeLessThan(6000);
  });

  it("stands on the ground and reaches its full height", () => {
    expect(Math.min(...voxels.map((v) => v.y))).toBe(0);
    expect(Math.max(...voxels.map((v) => v.y))).toBe(FIGURE_ROWS - 1);
  });

  it("has no loose blocks floating free of the body", () => {
    const start = voxels.find((v) => v.y === 0)!;
    const seen = new Set([`${start.x},${start.y},${start.z}`]);
    const queue = [start as { x: number; y: number; z: number }];
    // Hidden blocks are removed, so a shell may touch itself only across a corner or a gap of one.
    while (queue.length) {
      const { x, y, z } = queue.pop()!;
      for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (let c = -2; c <= 2; c++) {
        const at = `${x + a},${y + b},${z + c}`;
        if (has.has(at) && !seen.has(at)) {
          seen.add(at);
          queue.push({ x: x + a, y: y + b, z: z + c });
        }
      }
    }
    expect(seen.size).toBe(voxels.length);
  });

  it("gives him two eyes that blink, on a head that can turn", () => {
    const eyes = voxels.filter((v) => v.part === PART_EYE);
    expect(eyes.some((v) => v.x < 0)).toBe(true);
    expect(eyes.some((v) => v.x > 0)).toBe(true);
    expect(eyes.every((v) => v.y === 35)).toBe(true);
    expect(voxels.filter((v) => v.part === PART_HEAD).every((v) => v.y >= 27)).toBe(true);
  });

  it("keeps every colour and shade in range", () => {
    for (const v of voxels) {
      for (const channel of v.color) {
        expect(channel).toBeGreaterThanOrEqual(0);
        expect(channel).toBeLessThanOrEqual(1);
      }
      expect(v.occlusion).toBeGreaterThan(0);
      expect(v.occlusion).toBeLessThanOrEqual(1);
    }
  });

  it("leaves his chest solid when his arms come undone", () => {
    const body = voxels.filter((v) => v.part === PART_BODY);
    for (let y = 18; y <= 20; y++) {
      for (let x = -6; x <= 6; x++) {
        expect(body.some((v) => v.x === x && v.y === y && v.z === 4)).toBe(true);
      }
    }
  });

  it("makes each free arm from blocks that start in his folded arms", () => {
    const folded = new Set(voxels.filter((v) => v.part === PART_FOLDED).map((v) => `${v.x},${v.y},${v.z}`));
    const arms = voxels.filter((v) => v.part === PART_ARM_LEFT || v.part === PART_ARM_RIGHT);
    expect(arms.length).toBeGreaterThan(100);
    for (const v of arms) expect(folded.has(`${v.from.x},${v.from.y},${v.from.z}`)).toBe(true);
  });
});

describe.each([
  ["wide screen", { x: 3, z: 24 }, { x: 12, z: 30 }],
  ["phone", { x: -2.5, z: 24 }, { x: 1.5, z: 34 }],
])("walking over and holding up the brick, on a %s", (_, home, brick) => {
  const plan = planFor(home, brick, -0.34);
  const distance = (a: { x: number; z: number }, b: { x: number; z: number }) => Math.hypot(a.x - b.x, a.z - b.z);

  it("starts and ends exactly as he stands when idle", () => {
    const idle = idlePose(home);
    for (const t of [0, plan.end]) {
      const pose = poseAt(plan, t);
      expect(pose.x).toBeCloseTo(idle.x);
      expect(pose.z).toBeCloseTo(idle.z);
      expect(pose.bend).toBeCloseTo(0);
      expect(pose.free).toBeCloseTo(0);
      expect(pose.grip).toBeCloseTo(0);
      expect(pose.lift).toBeCloseTo(0);
      expect(pose.legRight).toBeCloseTo(0);
      expect(Math.abs(Math.sin(pose.yaw))).toBeCloseTo(0);
    }
  });

  it("never jumps from one frame to the next", () => {
    const step = 1 / 60;
    let last = poseAt(plan, 0);
    for (let t = step; t <= plan.end; t += step) {
      const pose = poseAt(plan, t);
      expect(distance(pose, last)).toBeLessThan(0.3);
      expect(Math.abs(Math.sin(pose.yaw - last.yaw))).toBeLessThan(0.2);
      expect(Math.abs(pose.bend - last.bend)).toBeLessThan(0.1);
      expect(Math.abs(pose.armRight - last.armRight)).toBeLessThan(0.2);
      last = pose;
    }
  });

  it("gets his hands to the brick before he takes hold of it", () => {
    const pose = poseAt(plan, plan.bendEnd);
    const hands = brickInHands(pose);
    expect(pose.grip).toBeCloseTo(1);
    expect(distance(hands, brick)).toBeLessThan(0.35);
    expect(Math.abs(hands.y - 0.76)).toBeLessThan(0.35);
  });

  it("puts it back where it was", () => {
    const pose = poseAt(plan, plan.lowerEnd);
    expect(distance(brickInHands(pose), brick)).toBeLessThan(0.35);
    expect(poseAt(plan, plan.lowerEnd + 0.2).grip).toBeCloseTo(0);
  });

  it("holds it clear above his head, facing the way the brick lies", () => {
    const pose = poseAt(plan, plan.liftEnd + 1);
    const crown = FIGURE_ROWS * VOXEL;
    const hands = brickInHands(pose);
    expect(pose.lift).toBeCloseTo(1);
    expect(pose.grip).toBeCloseTo(1);
    expect(hands.y - 0.76).toBeGreaterThan(crown);
    expect(distance(hands, pose)).toBeLessThan(0.3);
    expect(pose.yaw).toBeCloseTo(-0.34);
  });

  it("keeps the brick in his hands the whole way up", () => {
    let last = brickInHands(poseAt(plan, plan.bendEnd));
    for (let t = plan.bendEnd; t <= plan.liftEnd; t += 1 / 60) {
      const hands = brickInHands(poseAt(plan, t));
      expect(Math.hypot(hands.x - last.x, hands.y - last.y, hands.z - last.z)).toBeLessThan(0.6);
      last = hands;
    }
  });

  it("stays on his feet: only the walk moves them", () => {
    const pose = poseAt(plan, plan.liftEnd + 1);
    expect(pose.legRight).toBeCloseTo(0);
    expect(pose.walking).toBeCloseTo(0);
    expect(poseAt(plan, (plan.readyEnd + plan.walkEnd) / 2).walking).toBeGreaterThan(0.9);
  });
});
