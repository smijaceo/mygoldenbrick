import { ramp } from "./field";

/**
 * How the page's ordinary scroll position drives the world. The page is a normal document:
 * these are only readings of where it is, so scrolling back simply plays everything in reverse.
 */
export type Marks = {
  /** Scroll position where the name section reaches the top of the window. */
  nameTop: number;
  /** Where the name has been read and the camera starts to move on. */
  nameRest: number;
  /** Where the demo section is pinned, and where it lets go. */
  demoStart: number;
  demoEnd: number;
  /** Where the closing section reaches the top of the window. */
  closeTop: number;
  /** Which stretch of scroll turns each panel's bricks over, and which turns them back. */
  siteIn: [number, number];
  siteOut: [number, number];
  inboxIn: [number, number];
  inboxOut: [number, number];
};

export type Reading = {
  /** Camera position along its path: 0 opening, 1 over the name, 2 overhead, 3 closing. */
  q: number;
  flipA: number;
  flipB: number;
  /** 0 at dusk, 1 once it is properly dark. */
  night: number;
  /** How strongly the name stands out in the paving: gone while the demo is on. */
  nameTint: number;
};

export function timeline(y: number, m: Marks): Reading {
  let q: number;
  if (y <= m.nameTop) q = ramp(y, 0, m.nameTop);
  else if (y <= m.nameRest) q = 1;
  else if (y <= m.demoStart) q = 1 + ramp(y, m.nameRest, m.demoStart);
  else if (y <= m.demoEnd) q = 2;
  else q = 2 + ramp(y, m.demoEnd, m.closeTop);

  return {
    q,
    flipA: ramp(y, m.siteIn[0], m.siteIn[1]) * (1 - ramp(y, m.siteOut[0], m.siteOut[1])),
    flipB: ramp(y, m.inboxIn[0], m.inboxIn[1]) * (1 - ramp(y, m.inboxOut[0], m.inboxOut[1])),
    night: ramp(y, m.demoEnd, m.closeTop),
    nameTint: Math.max(1 - ramp(y, m.siteIn[0], m.siteIn[0] + (m.siteIn[1] - m.siteIn[0]) * 0.4), ramp(y, m.demoEnd, m.closeTop)),
  };
}

/** The scroll position where the demo is ready to use: both panels showing, nothing leaving. */
export const demoRest = (m: Marks) => m.inboxIn[1] + 2;
