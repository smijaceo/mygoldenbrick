import { HIP_ROW, NECK_ROW, SHOULDER_ROW, SHOULDER_X } from "./figure";

/**
 * The look of the world. Colours here are linear light, so values above 1 are fine: the
 * final pass adds glow to whatever is brightest, then maps it all down to the screen.
 */

const SKY = /* glsl */ `
uniform vec3 uSun;
uniform float uNight;

vec3 skyColor(vec3 d) {
  float up = max(d.y, 0.0);
  vec3 zenith = mix(vec3(0.0105, 0.0150, 0.0640), vec3(0.0040, 0.0060, 0.0260), uNight);
  vec3 middle = mix(vec3(0.0750, 0.0480, 0.1450), vec3(0.0240, 0.0190, 0.0700), uNight);
  vec3 horizon = mix(vec3(0.800, 0.335, 0.190), vec3(0.260, 0.095, 0.095), uNight);
  vec3 c = mix(horizon, middle, smoothstep(0.0, 0.13, up));
  c = mix(c, zenith, smoothstep(0.07, 0.52, up));
  float s = max(dot(d, uSun), 0.0);
  c += vec3(1.3, 0.56, 0.26) * (pow(s, 12.0) * 0.12 + pow(s, 90.0) * 0.55) * (1.0 - 0.65 * uNight) * (1.0 - smoothstep(0.1, 0.4, up));
  // Below the horizon there is only the dark under the bricks.
  if (d.y < 0.0) c = mix(c, vec3(0.018, 0.016, 0.040), smoothstep(0.0, -0.22, d.y));
  return c;
}
`;

const NOISE = /* glsl */ `
float hash12(vec2 p) {
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1, 0)), f.x), mix(hash12(i + vec2(0, 1)), hash12(i + vec2(1, 1)), f.x), f.y);
}
`;

const HAZE = /* glsl */ `
uniform float uFog;
// Haze thickens with distance and pools low to the ground.
vec3 withHaze(vec3 col, vec3 V, float dist, float y) {
  vec3 dir = -V;
  vec3 hazeDir = normalize(vec3(dir.x, max(dir.y, 0.015), dir.z));
  float height = exp(-max(y, 0.0) * 0.045);
  float column = 1.0 - smoothstep(0.08, 0.5, -dir.y);
  float fog = (1.0 - exp(-pow(dist * uFog, 1.7) * (0.55 + 0.45 * height))) * (0.08 + 0.92 * column);
  return mix(col, skyColor(hazeDir), clamp(fog, 0.0, 1.0));
}
`;

export const BRICK_VS = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec2 aCorner;
layout(location = 1) in vec3 aMeta;   // inset under the bevel, 1 at the top ring, drop to the bevel's foot
layout(location = 2) in vec3 aNormal;
layout(location = 3) in float aFace;  // 0 top, 1 side, 2 underside, 3 bevel
layout(location = 4) in vec3 iBrick;  // world x, world z, seed
layout(location = 5) in float iH;     // height of the top
layout(location = 6) in vec2 iFlags;  // windows, gold

uniform mat4 uVP;
uniform mat4 uModel;
uniform float uHero;
uniform vec2 uHalf;
uniform float uGap;
uniform float uBevel;
uniform float uBase;
uniform vec4 uPlotA;
uniform vec4 uPlotB;
uniform vec2 uFlip;
uniform vec3 uCam;
uniform float uFar;
uniform float uFarRise;

out vec3 vP;
out vec3 vN;
out vec2 vMos;
out vec3 vCurve;
flat out float vFace;
flat out float vSeed;
flat out float vLit;
flat out float vGold;
flat out float vH;
flat out float vWhich;

const float PI = 3.14159265;

float inPlot(vec2 c, vec4 plot) {
  return step(plot.x, c.x - uHalf.x) * step(c.x + uHalf.x, plot.z) * step(plot.y, c.y - uHalf.y) * step(c.y + uHalf.y, plot.w);
}

// Each brick's turn starts when the wave from the plot's centre reaches it.
float turnOf(vec2 c, vec4 plot, float progress, float seed) {
  vec2 centre = 0.5 * (plot.xy + plot.zw);
  vec2 half_ = max(0.5 * (plot.zw - plot.xy), vec2(0.001));
  float d = length((c - centre) / half_) / 1.4143;
  float start = d * 0.6 + seed * 0.1;
  return smoothstep(start, start + 0.3, progress);
}

void main() {
  vec2 c = iBrick.xy;
  float seed = iBrick.z;
  vFace = aFace;
  vSeed = seed;
  vLit = iFlags.x;
  vGold = iFlags.y;

  if (uHero > 0.5) {
    vec3 p = vec3(aCorner.x * (1.0 - aMeta.x * 0.075), aMeta.y > 0.5 ? 0.33 - aMeta.z * 0.075 : -0.33, aCorner.y * (0.5 - aMeta.x * 0.075));
    vec4 w = uModel * vec4(p, 1.0);
    vP = w.xyz;
    vN = mat3(uModel) * aNormal;
    vCurve = mat3(uModel) * (p * vec3(0.17, 0.55, 0.36));
    vMos = vec2(0.0);
    vWhich = 0.0;
    vH = 1.0;
    gl_Position = uVP * w;
    return;
  }

  float which = 0.0;
  float turn = 0.0;
  float closing = 0.0;
  vec2 progress = uFlip;
  vec4 plot = vec4(0.0, 0.0, 1.0, 1.0);
  if (progress.x > 0.001 && inPlot(c, uPlotA) > 0.5) {
    which = 1.0; plot = uPlotA;
    turn = turnOf(c, plot, progress.x, seed);
    closing = smoothstep(0.92, 1.0, progress.x);
  } else if (progress.y > 0.001 && inPlot(c, uPlotB) > 0.5) {
    which = 2.0; plot = uPlotB;
    turn = turnOf(c, plot, progress.y, seed);
    closing = smoothstep(0.92, 1.0, progress.y);
  }
  vWhich = which;

  // A turning brick is a slab at ground level; everything else is a column down to the base.
  float height = uFar > 0.5 ? iH * uFarRise : iH;
  float top = which > 0.5 ? height * (1.0 - smoothstep(0.0, 0.15, turn)) : height;
  float body = which > 0.5 && turn > 0.0 ? 0.5 : top - uBase;
  // Joints close up with distance, before they get thin enough to shimmer.
  float away = length(vec3(c.x, top, c.y) - uCam);
  float gap = uGap * (1.0 - closing) * (1.0 - smoothstep(55.0, 170.0, away));
  vec3 p = vec3(
    aCorner.x * (uHalf.x - gap - aMeta.x * uBevel),
    aMeta.y > 0.5 ? -aMeta.z * uBevel : -body,
    aCorner.y * (uHalf.y - gap - aMeta.x * uBevel)
  );
  vec3 n = aNormal;

  float lift = 0.0;
  if (turn > 0.0) {
    float a = PI * turn;
    float ca = cos(a);
    float sa = sin(a);
    // Turn about the brick's long axis, through its middle.
    float py = p.y + body * 0.5;
    p.y = ca * py - sa * p.z - body * 0.5;
    p.z = sa * py + ca * p.z;
    n = vec3(n.x, ca * n.y - sa * n.z, sa * n.y + ca * n.z);
    lift = sin(a) * uHalf.y * 1.4;
    // At rest the turned face is exactly level with the ground, so the picture lines up.
    p.y += body * smoothstep(0.5, 1.0, turn);
  }

  vec3 world = vec3(c.x + p.x, top + p.y + lift, c.y + p.z);
  vP = world;
  vN = n;
  vCurve = vec3(0.0);
  vH = top;
  vMos = (vec2(c.x + aCorner.x * uHalf.x, c.y - aCorner.y * uHalf.y) - plot.xy) / (plot.zw - plot.xy);
  gl_Position = uVP * vec4(world, 1.0);
}
`;

export const BRICK_FS = /* glsl */ `#version 300 es
precision highp float;
in vec3 vP;
in vec3 vN;
in vec2 vMos;
in vec3 vCurve;
flat in float vFace;
flat in float vSeed;
flat in float vLit;
flat in float vGold;
flat in float vH;
flat in float vWhich;

uniform vec3 uCam;
uniform sampler2D uLight;
uniform sampler2D uMosA;
uniform sampler2D uMosB;
uniform vec4 uField;
uniform vec4 uGoldA;
uniform vec4 uGoldB;
uniform float uWindows;
uniform float uNameTint;
uniform float uFar;
uniform float uTime;
uniform vec4 uFigure;  // where he stands (x, z), his height, how much of him is built
out vec4 outColor;
${SKY}
${HAZE}
${NOISE}
const vec3 GOLD = vec3(1.0, 0.70, 0.27);

// The figure's long shadow, worked out directly: he is too slim for the height map's steps to
// catch. Wide at the shoulders, narrow at the legs and head, softer the further it falls.
float figureShade(vec2 p) {
  vec2 away = -normalize(uSun.xz);
  vec2 r = p - uFigure.xy;
  float along = dot(r, away);
  float t = along / (uFigure.z * length(uSun.xz) / uSun.y);
  if (t < -0.02 || t > 1.1) return 1.0;
  float across = abs(r.x * away.y - r.y * away.x);
  float width = mix(mix(1.9, 3.1, smoothstep(0.3, 0.36, t)), 1.7, smoothstep(0.6, 0.66, t));
  float blur = 0.3 + along * 0.02;
  float inside = 1.0 - smoothstep(width - blur, width + blur, across);
  float ends = smoothstep(-0.02, 0.0, t) * (1.0 - smoothstep(0.94, 1.08, t));
  return 1.0 - inside * ends * mix(0.8, 0.3, clamp(t * 1.4, 0.0, 1.0)) * uFigure.w;
}

vec3 goldSurface(vec3 N, vec3 V, float ndv, vec3 P) {
  vec3 R = reflect(-V, N);
  float f = pow(1.0 - ndv, 5.0);
  // Metal is only as good as what it mirrors: dark ground, dusk overhead, a hot band of horizon.
  vec3 env = mix(vec3(0.034, 0.015, 0.008), vec3(0.17, 0.115, 0.22), smoothstep(-0.2, 0.6, R.y));
  float band = exp(-pow((R.y - 0.03) / 0.085, 2.0));
  env += vec3(2.1, 1.28, 0.56) * band;
  env += vec3(0.85, 0.5, 0.22) * exp(-pow((R.y + 0.34) / 0.11, 2.0));
  env += vec3(3.4, 2.3, 1.15) * pow(max(dot(R, uSun), 0.0), 44.0);
  vec3 c = env * mix(vec3(1.0, 0.68, 0.20), vec3(1.0), f);
  c += vec3(1.0, 0.58, 0.14) * 0.085;
  return c;
}

void main() {
  vec3 toCam = uCam - vP;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  vec3 N = normalize(vN);

  if (vWhich > 0.5 && vFace > 1.5 && vFace < 2.5) {
    vec3 tile = vWhich < 1.5 ? texture(uMosA, vMos).rgb : texture(uMosB, vMos).rgb;
    float shade = 0.55 + 0.45 * max(N.y, 0.0);
    outColor = vec4(tile * 1.3 * shade, 1.0);
    return;
  }

  float isTop = step(vFace, 0.5);
  float isSide = step(0.5, vFace) * step(vFace, 1.5);

  vec2 lookup = (vP.xz - uField.xy) / uField.zw;
  vec2 lit = uFar > 0.5 ? vec2(1.0, 0.82) : texture(uLight, lookup).rg;
  float shadow = lit.r;
  float ao = lit.g;
  float figureShadow = 1.0;
  if (uFar < 0.5 && uFigure.w > 0.0) {
    figureShadow = figureShade(vP.xz);
    shadow *= figureShadow;
    vec2 fromFeet = vP.xz - uFigure.xy;
    ao *= 1.0 - 0.6 * exp(-dot(fromFeet, fromFeet) / 7.0) * uFigure.w;
  }

  // Fired clay: each brick its own colour, some burnt darker.
  vec3 clay = mix(vec3(0.112, 0.064, 0.080), vec3(0.215, 0.110, 0.108), vSeed);
  clay = mix(clay, clay * vec3(0.60, 0.58, 0.72), step(0.90, fract(vSeed * 7.31)));
  float nearness = 1.0 - smoothstep(38.0, 150.0, dist);
  clay = mix(vec3(0.150, 0.082, 0.092), clay, nearness * 0.92 + 0.08);

  float fade = nearness;
  if (vFace > 2.5) N = normalize(mix(vec3(0.0, 1.0, 0.0), N, 0.08 + 0.92 * nearness));
  float wet = 0.0;
  float isName = step(0.4, vLit);
  isName *= uNameTint;
  if (isTop > 0.5) clay = mix(clay, vec3(0.90, 0.58, 0.33), 0.9 * isName);
  if (isTop > 0.5) {
    float mott = vnoise(vP.xz * vec2(1.7, 3.1) + vSeed * 37.0) * 0.6 + vnoise(vP.xz * 7.0 + vSeed * 11.0) * 0.4;
    clay *= 1.0 + (mott - 0.5) * 0.46 * nearness;
    // Standing water after rain, pooled across the plain in large soft shapes.
    wet = smoothstep(0.36, 0.72, vnoise(vP.xz * 0.05 + 11.0) + 0.28 * vnoise(vP.xz * 0.23));
    clay *= mix(1.0, mix(0.72, 0.92, isName), wet);
    if (uFar < 0.5) {
      vec2 e = vec2(0.05, 0.0);
      float n0 = vnoise(vP.xz * 9.0);
      vec2 g = vec2(vnoise((vP.xz + e.xy) * 9.0) - n0, vnoise((vP.xz + e.yx) * 9.0) - n0);
      N = normalize(N + vec3(g.x, 0.0, g.y) * (1.0 - wet * 0.85) * 1.1 * fade);
    }
  }

  vec3 emissive = vec3(0.0);
  if (isSide > 0.5) {
    float along = abs(N.x) > abs(N.z) ? vP.z : vP.x;
    // Courses of brick, painted down the walls, fading out before they would shimmer.
    float cy = vP.y / 0.42;
    float row = floor(cy);
    float cx = along / 0.92 + 0.5 * mod(row, 2.0);
    float w = fwidth(cy);
    float joint = smoothstep(0.0, 0.14 + w, min(fract(cy), 1.0 - fract(cy)));
    joint = min(joint, smoothstep(0.0, 0.06 + fwidth(cx), min(fract(cx), 1.0 - fract(cx))));
    joint = mix(joint, 0.8, smoothstep(0.25, 0.8, w));
    clay *= 0.72 + 0.42 * hash12(vec2(row, floor(cx)) + vSeed);
    clay *= 0.5 + 0.5 * joint;

    // Lit windows: this is the hour people photograph houses, because someone seems to be home.
    if (vLit > 0.01) {
      vec2 wc = vec2(along / 1.02, vP.y / 1.34);
      vec2 id = floor(wc);
      vec2 f = fract(wc) - 0.5;
      float px = fwidth(wc.y);
      float pane = smoothstep(0.22 + px, 0.22 - px, abs(f.x)) * smoothstep(0.27 + px, 0.27 - px, abs(f.y));
      float roll = hash12(id + floor(vSeed * 64.0));
      float on = step(roll, vLit * uWindows);
      float warmth = 0.75 + 0.5 * hash12(id.yx + 3.0);
      float glow = pane * on * warmth * step(0.5, vP.y);
      // Too far to resolve panes: the wall gives off their average light instead.
      glow = mix(glow, 0.05 * vLit * uWindows, smoothstep(0.3, 0.8, px));
      emissive += vec3(1.0, 0.60, 0.24) * glow * 1.25;
    }
  }

  float ndl = max(dot(N, uSun), 0.0);
  vec3 sunLight = vec3(1.05, 0.56, 0.36) * mix(1.0, 0.25, uNight);
  vec3 ambient = mix(vec3(0.085, 0.060, 0.085), mix(vec3(0.27, 0.27, 0.66), vec3(0.10, 0.11, 0.30), uNight), 0.5 + 0.5 * N.y);
  float wallFall = isSide > 0.5 ? mix(0.42, 1.0, smoothstep(0.0, max(vH, 1.0), vP.y)) : 1.0;
  float occ = (0.25 + 0.75 * ao) * wallFall;
  vec3 col = clay * (ambient * occ + sunLight * ndl * shadow);

  // The wet surface mirrors the sky, most strongly at a low angle.
  float ndv = max(dot(N, V), 0.0);
  float fres = 0.035 + 0.965 * pow(1.0 - ndv, 5.0);
  vec3 R = reflect(-V, N);
  float mirror = fres * mix(0.34, 1.0, wet) * (isTop > 0.5 ? 1.0 : 0.3) * (0.4 + 0.6 * ao);
  col = mix(col, skyColor(R), clamp(mirror, 0.0, 1.0));
  col *= mix(0.58, 1.0, figureShadow);

  // Gold light falling on the bricks around it, and streaked across the wet.
  for (int i = 0; i < 2; i++) {
    vec4 g = i == 0 ? uGoldA : uGoldB;
    if (g.w <= 0.0) continue;
    vec3 L = g.xyz - vP;
    float d2 = dot(L, L);
    vec3 Ln = L / sqrt(max(d2, 0.0001));
    float wrap = max(dot(N, Ln), 0.0) * 0.8 + 0.2;
    col += clay * GOLD * wrap * g.w * 4.0 / (1.0 + d2 * 0.05);
    float t = max(dot(L, R), 0.0);
    float miss = length(L - R * t);
    col += GOLD * g.w * exp(-miss * miss * 0.5) * (0.12 + 1.5 * fres) * (0.18 + wet) * isTop;
  }

  if (vGold > 0.01) {
    vec3 Ng = normalize(normalize(vN) + vCurve);
    vec3 metal = goldSurface(Ng, V, max(dot(Ng, V), 0.0), vP);
    col = mix(col, metal, vGold);
    if (uFar < 0.5) col += vec3(1.0, 0.56, 0.11) * 0.62 * vGold;
    emissive *= 1.0 - vGold;
  }
  col += emissive + vec3(0.050, 0.026, 0.012) * isTop * isName;

  outColor = vec4(withHaze(col, V, dist, vP.y), 1.0);
}
`;

/** The block figure: small blocks that rise out of the ground, then stand, walk and lift. */
export const FIGURE_VS = /* glsl */ `#version 300 es
precision highp float;
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNormal;
layout(location = 2) in vec2 aUv;
layout(location = 3) in vec3 iCell;
layout(location = 4) in vec4 iColor;  // colour, and how open the block's surroundings are
layout(location = 5) in vec2 iMeta;   // which part it belongs to, seed
layout(location = 6) in vec3 iFrom;   // where an arm block starts when his arms come undone

uniform mat4 uVP;
uniform vec3 uAt;
uniform float uVoxel;
uniform float uRows;
uniform float uBuild;
uniform float uBreath;
uniform float uBlink;
uniform float uYaw;
uniform vec3 uLook;   // his head: turned, tipped, tilted
uniform float uBend;
uniform float uFree;
uniform float uShrug;
uniform float uInward;
uniform vec2 uArms;   // his right, his left
uniform vec2 uLegs;   // his right, his left

out vec3 vP;
out vec3 vN;
out vec3 vColor;
out vec2 vUv;
flat out float vSeed;
flat out float vOpen;

const float NECK = ${NECK_ROW.toFixed(1)};
const float HIP = ${HIP_ROW.toFixed(1)};
const float SHOULDER = ${SHOULDER_ROW.toFixed(1)};
const float SHOULDER_X = ${SHOULDER_X.toFixed(1)};

vec3 turnY(vec3 v, float a) {
  float c = cos(a), s = sin(a);
  return vec3(v.x * c + v.z * s, v.y, -v.x * s + v.z * c);
}
vec3 turnX(vec3 v, float a) {
  float c = cos(a), s = sin(a);
  return vec3(v.x, v.y * c - v.z * s, v.y * s + v.z * c);
}
vec3 turnZ(vec3 v, float a) {
  float c = cos(a), s = sin(a);
  return vec3(v.x * c - v.y * s, v.x * s + v.y * c, v.z);
}

void main() {
  float part = iMeta.x;
  float seed = iMeta.y;
  bool head = part > 0.5 && part < 2.5;
  bool folded = part > 2.5 && part < 3.5;
  bool arm = part > 3.5 && part < 5.5;
  bool leg = part > 5.5;

  // Laid from the ground up, like a course of bricks, each block arriving a moment apart.
  float start = (iCell.y / uRows) * 0.72 + seed * 0.14;
  float built = smoothstep(start, start + 0.14, uBuild);
  float size = built;
  vec3 cell = iCell;
  // When his arms come undone their blocks fly from one arrangement to the other.
  if (folded) size *= 1.0 - smoothstep(seed * 0.35, seed * 0.35 + 0.3, uFree);
  if (arm) {
    float moved = smoothstep(0.2 + seed * 0.35, 0.55 + seed * 0.45, uFree);
    size *= smoothstep(0.0, 0.25, moved);
    cell = mix(iFrom, iCell, moved);
  }
  vec3 p = cell + aPos * size;
  p.y -= (1.0 - built) * 7.0;
  vec3 n = aNormal;

  if (head) {
    vec3 neck = vec3(0.0, NECK, 0.0);
    p = neck + turnY(turnX(turnZ(p - neck, uLook.z), uLook.y), uLook.x);
    n = turnY(turnX(turnZ(n, uLook.z), uLook.y), uLook.x);
  } else if (arm) {
    float side = part < 4.5 ? -1.0 : 1.0;
    float swing = part < 4.5 ? uArms.x : uArms.y;
    vec3 shoulder = vec3(side * SHOULDER_X, SHOULDER, 0.0);
    p = shoulder + turnX(turnZ(p - shoulder, -side * uInward), swing) + vec3(0.0, uShrug, 0.0);
    n = turnX(turnZ(n, -side * uInward), swing);
  } else if (leg) {
    vec3 hip = vec3(0.0, HIP, 0.0);
    float swing = part < 6.5 ? uLegs.x : uLegs.y;
    p = hip + turnX(p - hip, swing);
    n = turnX(n, swing);
  }
  if (!leg) {
    // Only the top half breathes and bends; his feet stay where they are.
    p.y += uBreath * (arm ? 1.0 : smoothstep(13.0, 26.0, iCell.y));
    vec3 hip = vec3(0.0, HIP, 0.0);
    p = hip + turnX(p - hip, uBend);
    n = turnX(n, uBend);
  }
  p = turnY(p, uYaw);
  n = turnY(n, uYaw);

  vec3 world = uAt + vec3(p.x, p.y + 0.5, p.z) * uVoxel;
  vP = world;
  vN = n;
  vUv = aUv;
  vSeed = seed;
  vOpen = iColor.a;
  // A blink: the eye blocks take the colour of his eyelids for a moment.
  vColor = part > 1.5 && part < 2.5 && uBlink > 0.5 ? vec3(0.47, 0.25, 0.19) : iColor.rgb;
  gl_Position = uVP * vec4(world, 1.0);
}
`;

export const FIGURE_FS = /* glsl */ `#version 300 es
precision highp float;
in vec3 vP;
in vec3 vN;
in vec3 vColor;
in vec2 vUv;
flat in float vSeed;
flat in float vOpen;

uniform vec3 uCam;
uniform vec4 uGoldA;
uniform vec4 uGoldB;
out vec4 outColor;
${SKY}
${HAZE}
const vec3 GOLD = vec3(1.0, 0.70, 0.27);

void main() {
  vec3 toCam = uCam - vP;
  float dist = length(toCam);
  vec3 V = toCam / dist;
  vec3 N = normalize(vN);

  // Fired like the bricks: every block its own shade, with a dark joint around it.
  vec3 base = mix(vColor, vec3(0.2, 0.11, 0.11), 0.08) * (0.86 + 0.28 * vSeed);
  vec2 e = min(vUv, 1.0 - vUv);
  float w = fwidth(vUv.x) + fwidth(vUv.y);
  float joint = smoothstep(0.0, 0.09 + w, min(e.x, e.y));
  joint = mix(joint, 0.86, smoothstep(0.22, 0.6, w));
  base *= 0.7 + 0.3 * joint;

  // The same dusk as the world: low sun behind him, blue sky above. He also catches what comes
  // back off the wet ground, which is what lets his face read with the sun at his back.
  // Anything facing up or towards the sun takes the last warm light, so his edges glow.
  float ndl = max(dot(N, uSun), 0.0) + max(N.y, 0.0) * 0.28;
  vec3 sunLight = vec3(1.05, 0.56, 0.36) * mix(1.0, 0.25, uNight);
  vec3 ambient = mix(vec3(0.085, 0.060, 0.085), mix(vec3(0.27, 0.27, 0.66), vec3(0.10, 0.11, 0.30), uNight), 0.5 + 0.5 * N.y);
  vec3 bounceDir = normalize(vec3(0.18, 0.28, 0.94));
  vec3 bounce = mix(vec3(0.34, 0.235, 0.215), vec3(0.14, 0.115, 0.18), uNight) * (max(dot(N, bounceDir), 0.0) * 0.85 + 0.15);
  float ground = mix(0.62, 1.0, smoothstep(0.0, 3.5, vP.y));
  vec3 col = base * ((ambient + bounce) * vOpen * ground + sunLight * ndl * 1.5);

  float ndv = max(dot(N, V), 0.0);
  float fres = 0.03 + 0.97 * pow(1.0 - ndv, 5.0);
  col = mix(col, skyColor(reflect(-V, N)), clamp(fres * 0.1, 0.0, 1.0));

  // Gold light falls on him as it falls on everything nearby.
  for (int i = 0; i < 2; i++) {
    vec4 g = i == 0 ? uGoldA : uGoldB;
    if (g.w <= 0.0) continue;
    vec3 L = g.xyz - vP;
    float d2 = dot(L, L);
    vec3 Ln = L / sqrt(max(d2, 0.0001));
    float wrap = max(dot(N, Ln), 0.0) * 0.8 + 0.2;
    col += base * GOLD * wrap * g.w * 4.0 / (1.0 + d2 * 0.05);
  }

  outColor = vec4(withHaze(col, V, dist, vP.y), 1.0);
}
`;

export const TRIANGLE_VS = /* glsl */ `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 1.0, 1.0);
}
`;

export const SKY_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform mat4 uInvVP;
uniform vec3 uCam;
out vec4 outColor;
${SKY}
${NOISE}
void main() {
  vec4 far = uInvVP * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec3 d = normalize(far.xyz / far.w - uCam);
  vec3 c = skyColor(d);
  if (d.y > 0.0) {
    // A little high cloud, stretched along the horizon, catching the last of the light.
    vec2 q = d.xz / (d.y + 0.14);
    float cloud = vnoise(q * vec2(0.55, 2.0) + 4.0) * 0.6 + vnoise(q * vec2(1.3, 4.6)) * 0.4;
    cloud = smoothstep(0.52, 0.86, cloud) * smoothstep(0.02, 0.2, d.y) * smoothstep(0.75, 0.25, d.y);
    c = mix(c, c * 0.6 + vec3(0.26, 0.115, 0.095) * (1.0 - 0.7 * uNight), cloud * 0.42);
  }
  outColor = vec4(c, 1.0);
}
`;

/**
 * Soft shadow and contact shade for the whole field, worked out from the heights alone.
 * Walking a height map costs the same however many bricks there are, and it stays soft.
 */
export const LIGHT_FS = (steps: number) => /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uH;
uniform vec2 uUnit;
uniform vec3 uSun;
uniform float uMaxH;
out vec4 outColor;
float H(vec2 uv) { return texture(uH, uv).r * uMaxH; }
void main() {
  float h0 = H(vUv);
  vec2 dir = normalize(uSun.xz);
  float rise = uSun.y / length(uSun.xz);
  float s = 1.0;
  float t = 1.1;
  for (int i = 0; i < ${steps}; i++) {
    float hh = H(vUv + dir * t * uUnit);
    float ray = h0 + rise * t + 0.2;
    s = min(s, clamp(1.0 - (hh - ray) / (0.5 + t * 0.16), 0.0, 1.0));
    t *= 1.42;
  }
  float occ = 0.0;
  const vec2 ring[6] = vec2[](vec2(1, 0), vec2(0.5, 0.866), vec2(-0.5, 0.866), vec2(-1, 0), vec2(-0.5, -0.866), vec2(0.5, -0.866));
  for (int i = 0; i < 6; i++) {
    vec2 d = ring[i];
    occ += clamp((H(vUv + d * 1.5 * uUnit) - h0) / 1.6, 0.0, 1.0) * 0.5;
    occ += clamp((H(vUv + d.yx * 4.0 * uUnit) - h0) / 5.0, 0.0, 1.0) * 0.32;
    occ += clamp((H(vUv + d * 10.0 * uUnit) - h0) / 12.0, 0.0, 1.0) * 0.18;
  }
  outColor = vec4(s, clamp(1.0 - occ / 3.2, 0.0, 1.0), 0.0, 1.0);
}
`;

export const BLOOM_DOWN_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uPx;
uniform float uThreshold;
out vec4 outColor;
void main() {
  vec3 c = texture(uTex, vUv).rgb * 4.0;
  c += texture(uTex, vUv + uPx * vec2(-1, -1)).rgb;
  c += texture(uTex, vUv + uPx * vec2(1, -1)).rgb;
  c += texture(uTex, vUv + uPx * vec2(-1, 1)).rgb;
  c += texture(uTex, vUv + uPx * vec2(1, 1)).rgb;
  c /= 8.0;
  if (uThreshold > 0.0) {
    float b = max(c.r, max(c.g, c.b));
    c *= smoothstep(uThreshold, uThreshold * 2.0, b);
  }
  outColor = vec4(c, 1.0);
}
`;

export const BLOOM_UP_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uTex;
uniform vec2 uPx;
out vec4 outColor;
void main() {
  vec3 c = texture(uTex, vUv + uPx * vec2(-1, 0)).rgb;
  c += texture(uTex, vUv + uPx * vec2(1, 0)).rgb;
  c += texture(uTex, vUv + uPx * vec2(0, -1)).rgb;
  c += texture(uTex, vUv + uPx * vec2(0, 1)).rgb;
  c += texture(uTex, vUv + uPx * vec2(-0.7, -0.7)).rgb * 2.0;
  c += texture(uTex, vUv + uPx * vec2(0.7, -0.7)).rgb * 2.0;
  c += texture(uTex, vUv + uPx * vec2(-0.7, 0.7)).rgb * 2.0;
  c += texture(uTex, vUv + uPx * vec2(0.7, 0.7)).rgb * 2.0;
  outColor = vec4(c / 12.0, 1.0);
}
`;

export const COMPOSITE_FS = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv;
uniform sampler2D uScene;
uniform sampler2D uBloom;
uniform float uExposure;
uniform float uBloomAmt;
uniform float uTime;
uniform float uAspect;
out vec4 outColor;
float grain(vec2 p, float t) {
  return fract(sin(dot(p + t, vec2(12.9898, 78.233))) * 43758.5453);
}
vec3 filmic(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
void main() {
  vec3 c = texture(uScene, vUv).rgb + texture(uBloom, vUv).rgb * uBloomAmt;
  vec2 q = (vUv - 0.5) * vec2(min(uAspect, 1.0) * 1.1 + 0.4, 1.0);
  c *= 1.0 - dot(q, q) * 0.55;
  c = filmic(c * uExposure);
  c = pow(c, vec3(1.0 / 2.2));
  // A breath of film grain, which also stops the sky's gradient from banding.
  c += (grain(gl_FragCoord.xy, uTime) - 0.5) * 0.022;
  outColor = vec4(c, 1.0);
}
`;
