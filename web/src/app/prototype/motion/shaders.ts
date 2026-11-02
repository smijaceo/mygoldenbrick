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
uniform float uFog;
uniform float uTime;
out vec4 outColor;
${SKY}
${NOISE}
const vec3 GOLD = vec3(1.0, 0.70, 0.27);

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

  // Haze thickens with distance and pools low to the ground.
  vec3 dir = -V;
  vec3 hazeDir = normalize(vec3(dir.x, max(dir.y, 0.015), dir.z));
  float height = exp(-max(vP.y, 0.0) * 0.045);
  float column = 1.0 - smoothstep(0.08, 0.5, -dir.y);
  float fog = (1.0 - exp(-pow(dist * uFog, 1.7) * (0.55 + 0.45 * height))) * (0.08 + 0.92 * column);
  outColor = vec4(mix(col, skyColor(hazeDir), clamp(fog, 0.0, 1.0)), 1.0);
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
