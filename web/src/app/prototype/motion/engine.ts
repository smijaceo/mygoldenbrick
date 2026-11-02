/**
 * The world, drawn with plain WebGL2: about 40,000 bricks on one draw call, no 3D library.
 * It loads only on this route, and everything readable on the page lives in ordinary HTML,
 * so if any of this fails the page still works and still says the same thing.
 */
import {
  BRICK_D,
  BRICK_W,
  MAX_HEIGHT,
  NAME_CENTER,
  brickCenter,
  buildHouses,
  clamp01,
  fitName,
  gridFor,
  hash2,
  houseHeight,
  nameLineHeight,
  smoothstep,
  terrain,
  type Tier,
} from "./field";
import { BLOOM_DOWN_FS, BLOOM_UP_FS, BRICK_FS, BRICK_VS, COMPOSITE_FS, LIGHT_FS, SKY_FS, TRIANGLE_VS } from "./shaders";

type Vec3 = [number, number, number];
type Program = { program: WebGLProgram; u: Record<string, WebGLUniformLocation | null> };

export type Reading = { q: number; flipA: number; flipB: number; night: number; nameTint: number };
export type ScreenRect = { left: number; top: number; right: number; bottom: number };

export type Engine = {
  setReading(r: Reading): void;
  setName(name: string): void;
  setNameFont(family: string): void;
  setPlots(a: ScreenRect | null, b: ScreenRect | null): void;
  setMosaic(which: 0 | 1, source: HTMLCanvasElement): void;
  setGold(count: number): void;
  /** Moves the travelling light to a point on screen. Intensity 0 turns it off. */
  setFlight(x: number, y: number, intensity: number): void;
  /** A brick landing or a tap: sends a ripple out from a point on screen. */
  ripple(x: number, y: number, strength: number): void;
  setStill(still: boolean): void;
  skipIntro(): void;
  resize(): void;
  destroy(): void;
  stats(): { fps: number; p95: number; scale: number; bricks: number; frames: number; simMs: number; initMs: { shaders: number; field: number; firstDraw: number } };
};

export type EngineOptions = {
  canvas: HTMLCanvasElement;
  tier: Tier;
  still: boolean;
  /** "hold" freezes the first frame, "rest" starts at the end of the opening. */
  intro: "play" | "hold" | "rest";
  /** Give up at once if graphics are being done by the CPU. */
  refuseSoftware: boolean;
  cancelled?: () => boolean;
  onFirstFrame: () => void;
  onLost: () => void;
};

const FOV_NEAR = 40;
const OVERHEAD_Y = 90;
const TAN_HALF = Math.tan(((FOV_NEAR / 2) * Math.PI) / 180);
const SUN: Vec3 = normalize([0.46, 0.17, -0.87]);
const GROUND_BASE = -3;

function normalize(v: Vec3): Vec3 {
  const l = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / l, v[1] / l, v[2] / l];
}
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const mixV = (a: Vec3, b: Vec3, t: number): Vec3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function perspective(fovDeg: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan((fovDeg * Math.PI) / 360);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

function lookAt(eye: Vec3, target: Vec3, up: Vec3) {
  const z = normalize(sub(eye, target));
  const x = normalize(cross(up, z));
  const y = cross(z, x);
  return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1]);
}

function multiply(a: Float32Array, b: Float32Array) {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[r + 4] * b[c * 4 + 1] + a[r + 8] * b[c * 4 + 2] + a[r + 12] * b[c * 4 + 3];
    }
  }
  return o;
}

function invert(m: Float32Array) {
  const [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = m;
  const b00 = a00 * a11 - a01 * a10;
  const b01 = a00 * a12 - a02 * a10;
  const b02 = a00 * a13 - a03 * a10;
  const b03 = a01 * a12 - a02 * a11;
  const b04 = a01 * a13 - a03 * a11;
  const b05 = a02 * a13 - a03 * a12;
  const b06 = a20 * a31 - a21 * a30;
  const b07 = a20 * a32 - a22 * a30;
  const b08 = a20 * a33 - a23 * a30;
  const b09 = a21 * a32 - a22 * a31;
  const b10 = a21 * a33 - a23 * a31;
  const b11 = a22 * a33 - a23 * a32;
  const det = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
  return new Float32Array([
    (a11 * b11 - a12 * b10 + a13 * b09) * det,
    (a02 * b10 - a01 * b11 - a03 * b09) * det,
    (a31 * b05 - a32 * b04 + a33 * b03) * det,
    (a22 * b04 - a21 * b05 - a23 * b03) * det,
    (a12 * b08 - a10 * b11 - a13 * b07) * det,
    (a00 * b11 - a02 * b08 + a03 * b07) * det,
    (a32 * b02 - a30 * b05 - a33 * b01) * det,
    (a20 * b05 - a22 * b02 + a23 * b01) * det,
    (a10 * b10 - a11 * b08 + a13 * b06) * det,
    (a01 * b08 - a00 * b10 - a03 * b06) * det,
    (a30 * b04 - a31 * b02 + a33 * b00) * det,
    (a21 * b02 - a20 * b04 - a23 * b00) * det,
    (a11 * b07 - a10 * b09 - a12 * b06) * det,
    (a00 * b09 - a01 * b07 + a02 * b06) * det,
    (a31 * b01 - a30 * b03 - a32 * b00) * det,
    (a20 * b03 - a21 * b01 + a22 * b00) * det,
  ]);
}

/** A bevelled brick: top, bevel, corners, walls and underside, in about two dozen triangles. */
function brickGeometry() {
  const verts: number[] = [];
  const indices: number[] = [];
  const add = (cx: number, cz: number, inset: number, top: number, drop: number, n: Vec3, face: number) => {
    verts.push(cx, cz, inset, top, drop, n[0], n[1], n[2], face);
    return verts.length / 9 - 1;
  };
  const quad = (a: number, b: number, c: number, d: number) => indices.push(a, b, c, a, c, d);
  const up: Vec3 = [0, 1, 0];
  quad(add(-1, 1, 1, 1, 0, up, 0), add(1, 1, 1, 1, 0, up, 0), add(1, -1, 1, 1, 0, up, 0), add(-1, -1, 1, 1, 0, up, 0));
  const k = Math.SQRT1_2;
  const sides: [number, number, number, number, Vec3][] = [
    [-1, 1, 1, 1, [0, 0, 1]],
    [1, 1, 1, -1, [1, 0, 0]],
    [1, -1, -1, -1, [0, 0, -1]],
    [-1, -1, -1, 1, [-1, 0, 0]],
  ];
  for (const [ax, az, bx, bz, n] of sides) {
    const nb: Vec3 = [n[0] * k, k, n[2] * k];
    quad(add(ax, az, 0, 1, 1, nb, 3), add(bx, bz, 0, 1, 1, nb, 3), add(bx, bz, 1, 1, 0, nb, 3), add(ax, az, 1, 1, 0, nb, 3));
    quad(add(ax, az, 0, 0, 0, n, 1), add(bx, bz, 0, 0, 0, n, 1), add(bx, bz, 0, 1, 1, n, 1), add(ax, az, 0, 1, 1, n, 1));
  }
  const down: Vec3 = [0, -1, 0];
  quad(add(-1, -1, 0, 0, 0, down, 2), add(1, -1, 0, 0, 0, down, 2), add(1, 1, 0, 0, 0, down, 2), add(-1, 1, 0, 0, 0, down, 2));
  return { verts: new Float32Array(verts), indices: new Uint16Array(indices) };
}

/** Starts compiling. Nothing here waits, so the page stays responsive while the driver works. */
function startProgram(gl: WebGL2RenderingContext, vs: string, fs: string) {
  const make = (type: number, source: string) => {
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    return shader;
  };
  const program = gl.createProgram()!;
  const vertex = make(gl.VERTEX_SHADER, vs);
  const fragment = make(gl.FRAGMENT_SHADER, fs);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  return { program, vertex, fragment };
}

/** Waits for the driver, a frame at a time, where it can report progress. */
async function programsReady(gl: WebGL2RenderingContext, programs: WebGLProgram[]) {
  const ext = gl.getExtension("KHR_parallel_shader_compile");
  if (!ext) return;
  const started = performance.now();
  while (performance.now() - started < 10000) {
    if (gl.isContextLost()) return;
    if (programs.every((p) => gl.getProgramParameter(p, ext.COMPLETION_STATUS_KHR))) return;
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }
}

function finishProgram(gl: WebGL2RenderingContext, started: ReturnType<typeof startProgram>): Program {
  const { program, vertex, fragment } = started;
  if (!gl.getProgramParameter(program, gl.LINK_STATUS) && !gl.isContextLost()) {
    throw new Error(`Shaders failed: ${gl.getProgramInfoLog(program)} ${gl.getShaderInfoLog(vertex)} ${gl.getShaderInfoLog(fragment)}`);
  }
  const u: Program["u"] = {};
  const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
  for (let i = 0; i < count; i++) {
    const info = gl.getActiveUniform(program, i)!;
    u[info.name] = gl.getUniformLocation(program, info.name);
  }
  return { program, u };
}

type Target = { fbo: WebGLFramebuffer; tex: WebGLTexture; w: number; h: number };

function makeTarget(gl: WebGL2RenderingContext, w: number, h: number, internal: number, format: number, type: number): Target {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  return { fbo, tex, w, h };
}

/** The camera's four stops, framed so the name fills the width of any screen. */
function posesFor(aspect: number) {
  const wide = aspect >= 1;
  const nameW = wide ? 168 : 86;
  const nameDist = Math.max(120, (nameW / 2 / 0.86) / (TAN_HALF * aspect));
  const pitch = (46 * Math.PI) / 180;
  const c: Vec3 = [NAME_CENTER.x, 0, NAME_CENTER.z];
  return [
    {
      eye: (wide ? [-6, 7.2, 66] : [-1, 8.6, 66]) as Vec3,
      target: (wide ? [12, 21, -60] : [1, 25, -60]) as Vec3,
      fov: wide ? 44 : 50,
      top: 0,
    },
    {
      eye: [0, Math.sin(pitch) * nameDist, c[2] + Math.cos(pitch) * nameDist] as Vec3,
      target: [0, 0, c[2] + (wide ? 25 : 28)] as Vec3,
      fov: FOV_NEAR,
      top: 0,
    },
    { eye: [0, OVERHEAD_Y, c[2]] as Vec3, target: [0, 0, c[2]] as Vec3, fov: FOV_NEAR, top: 1 },
    {
      eye: [wide ? -14 : 4, nameDist * 1.0, c[2] + nameDist * 0.92] as Vec3,
      target: [wide ? -28 : 0, 0, c[2] + (wide ? 40 : 56)] as Vec3,
      fov: FOV_NEAR + 2,
      top: 0,
    },
  ];
}

/** True for graphics done by the CPU, where this scene would stall the whole page. */
export function isSoftwareRenderer(gl: WebGL2RenderingContext) {
  const info = gl.getExtension("WEBGL_debug_renderer_info");
  const name = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
  return /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name);
}

export async function createEngine(opts: EngineOptions): Promise<Engine> {
  const { canvas } = opts;
  const initStart = performance.now();
  const context = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "high-performance", depth: false, stencil: false });
  if (!context) throw new Error("WebGL2 is not available");
  const gl = context;
  if (opts.refuseSoftware && isSoftwareRenderer(gl)) throw new Error("Graphics are running on the CPU");

  const floatColor = !!gl.getExtension("EXT_color_buffer_float") || !!gl.getExtension("EXT_color_buffer_half_float");
  const COLOR_INTERNAL = floatColor ? gl.RGBA16F : gl.RGBA8;
  const COLOR_TYPE = floatColor ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;

  const spec = gridFor(opts.tier);
  const { cols, rows } = spec;
  const count = cols * rows;
  const fieldW = cols * BRICK_W;
  const fieldD = rows * BRICK_D;

  const compiling = [
    startProgram(gl, BRICK_VS, BRICK_FS),
    startProgram(gl, TRIANGLE_VS, SKY_FS),
    startProgram(gl, TRIANGLE_VS, LIGHT_FS(spec.shadowSteps)),
    startProgram(gl, TRIANGLE_VS, BLOOM_DOWN_FS),
    startProgram(gl, TRIANGLE_VS, BLOOM_UP_FS),
    startProgram(gl, TRIANGLE_VS, COMPOSITE_FS),
  ];
  await programsReady(gl, compiling.map((c) => c.program));
  if (opts.cancelled?.()) throw new Error("Cancelled");
  const [brickProgram, skyProgram, lightProgram, downProgram, upProgram, compositeProgram] = compiling.map((c) => finishProgram(gl, c));
  const emptyVao = gl.createVertexArray()!;

  const compiledAt = performance.now();
  /* ---------- The field: every brick's position, resting height and motion ---------- */
  const brick = new Float32Array(count * 3);
  const base = new Float32Array(count);
  const distance = new Float32Array(count);
  const h = new Float32Array(count);
  const vel = new Float32Array(count);
  const goal = new Float32Array(count);
  const stiff = new Float32Array(count);
  const flags = new Float32Array(count * 2);
  const heightPx = new Uint8Array(cols * 2 * rows);
  const nameMask = new Uint8Array(count);
  const nameRise = new Float32Array(count);
  const houseLit = new Float32Array(count);
  const extra = new Float32Array(count);

  const houses = buildHouses(spec);
  const heroAt = opts.canvas.clientWidth >= opts.canvas.clientHeight ? { x: 12, z: 30 } : { x: 1.5, z: 34 };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const i = r * cols + c;
      const p = brickCenter(spec, c, r);
      const seed = hash2(c + 0.5, r + 0.5);
      brick[i * 3] = p.x;
      brick[i * 3 + 1] = p.z;
      brick[i * 3 + 2] = seed;
      base[i] = terrain(p.x, p.z);
      distance[i] = Math.hypot(p.x - heroAt.x, p.z - heroAt.z);
      stiff[i] = 15 + hash2(c * 3.1, r * 1.7) * 13;
    }
  }
  for (const house of houses) {
    const r0 = Math.max(0, Math.floor((house.z - house.halfL - spec.minZ) / BRICK_D) - 1);
    const r1 = Math.min(rows - 1, Math.ceil((house.z + house.halfL - spec.minZ) / BRICK_D) + 1);
    const c0 = Math.max(0, Math.floor((house.x - house.halfW - spec.minX) / BRICK_W) - 1);
    const c1 = Math.min(cols - 1, Math.ceil((house.x + house.halfW - spec.minX) / BRICK_W) + 1);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = r * cols + c;
        const hh = houseHeight(house, brick[i * 3], brick[i * 3 + 1]);
        if (hh > base[i]) {
          base[i] = hh;
          houseLit[i] = 0.26;
          flags[i * 2] = 0.26;
        }
      }
    }
  }

  const farList: number[] = [];
  const farFlags: number[] = [];
  const farHeights: number[] = [];
  {
    const reach = opts.tier === "high" ? { x: 640, near: 230, far: -780 } : { x: 620, near: 230, far: -760 };
    const nearX0 = spec.minX + 2;
    const nearX1 = spec.minX + fieldW - 2;
    const nearZ0 = spec.minZ + 2;
    const nearZ1 = spec.minZ + fieldD - 2;
    for (let z = reach.far; z < reach.near; z += spec.farD) {
      const row = Math.round((z - reach.far) / spec.farD);
      for (let x = -reach.x; x < reach.x; x += spec.farW) {
        const px = x + (row % 2) * spec.farW * 0.5;
        if (px + spec.farW / 2 > nearX0 && px - spec.farW / 2 < nearX1 && z + spec.farD / 2 > nearZ0 && z - spec.farD / 2 < nearZ1) continue;
        farList.push(px, z, hash2(px, z));
        farHeights.push(terrain(px, z));
        farFlags.push(hash2(px * 2, z) > 0.88 && px > -80 ? 0.3 : 0, 0);
      }
    }
  }
  const farCount = farList.length / 3;

  /* ---------- Buffers ---------- */
  const geometry = brickGeometry();
  const geoBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, geoBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, geometry.verts, gl.STATIC_DRAW);
  const indexBuffer = gl.createBuffer()!;

  const brickBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, brickBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, brick, gl.STATIC_DRAW);
  const heightBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, heightBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, h, gl.DYNAMIC_DRAW);
  const flagBuffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, flagBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flags, gl.DYNAMIC_DRAW);

  const bindBrickVao = (brickBuf: WebGLBuffer, heightBuf: WebGLBuffer, flagBuf: WebGLBuffer) => {
    const vao = gl.createVertexArray()!;
    gl.bindVertexArray(vao);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, geometry.indices, gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, geoBuffer);
    const stride = 9 * 4;
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, stride, 0);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, stride, 2 * 4);
    gl.enableVertexAttribArray(2);
    gl.vertexAttribPointer(2, 3, gl.FLOAT, false, stride, 5 * 4);
    gl.enableVertexAttribArray(3);
    gl.vertexAttribPointer(3, 1, gl.FLOAT, false, stride, 8 * 4);
    gl.bindBuffer(gl.ARRAY_BUFFER, brickBuf);
    gl.enableVertexAttribArray(4);
    gl.vertexAttribPointer(4, 3, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(4, 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, heightBuf);
    gl.enableVertexAttribArray(5);
    gl.vertexAttribPointer(5, 1, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(5, 1);
    gl.bindBuffer(gl.ARRAY_BUFFER, flagBuf);
    gl.enableVertexAttribArray(6);
    gl.vertexAttribPointer(6, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(6, 1);
    gl.bindVertexArray(null);
    return vao;
  };
  const nearVao = bindBrickVao(brickBuffer, heightBuffer, flagBuffer);

  const staticBuffer = (data: number[]) => {
    const b = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, b);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    return b;
  };
  const farVao = bindBrickVao(staticBuffer(farList), staticBuffer(farHeights), staticBuffer(farFlags));
  const heroVao = bindBrickVao(staticBuffer([0, 0, 0.5]), staticBuffer([0]), staticBuffer([0, 1]));

  /* ---------- Height map and the lighting worked out from it ---------- */
  const heightTex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, heightTex);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, cols * 2, rows, 0, gl.RED, gl.UNSIGNED_BYTE, heightPx);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const lightTarget = makeTarget(gl, cols * 2 * spec.lightScale, rows * spec.lightScale, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE);

  const makeMosaic = () => {
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return tex;
  };
  const mosaics = [makeMosaic(), makeMosaic()];

  /* ---------- Targets the picture is drawn into ---------- */
  let width = 1;
  let height = 1;
  let cssW = 1;
  let cssH = 1;
  let scale = 1;
  const maxScale = Math.min(window.devicePixelRatio || 1, opts.tier === "high" ? 1.75 : 1.6);
  scale = maxScale;
  let sceneMsaa: { fbo: WebGLFramebuffer; color: WebGLRenderbuffer; depth: WebGLRenderbuffer } | null = null;
  let scene: Target | null = null;
  let blooms: Target[] = [];

  const disposeTargets = () => {
    if (sceneMsaa) {
      gl.deleteFramebuffer(sceneMsaa.fbo);
      gl.deleteRenderbuffer(sceneMsaa.color);
      gl.deleteRenderbuffer(sceneMsaa.depth);
    }
    for (const t of [scene, ...blooms]) {
      if (!t) continue;
      gl.deleteFramebuffer(t.fbo);
      gl.deleteTexture(t.tex);
    }
    blooms = [];
  };

  const allocate = () => {
    cssW = canvas.clientWidth || 1;
    cssH = canvas.clientHeight || 1;
    width = Math.max(1, Math.round(cssW * scale));
    height = Math.max(1, Math.round(cssH * scale));
    canvas.width = width;
    canvas.height = height;
    disposeTargets();
    const maxSamples = gl.getParameter(gl.MAX_SAMPLES) as number;
    const samples = Math.min(4, maxSamples);
    const fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    const color = gl.createRenderbuffer()!;
    gl.bindRenderbuffer(gl.RENDERBUFFER, color);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, COLOR_INTERNAL, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, color);
    const depth = gl.createRenderbuffer()!;
    gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
    gl.renderbufferStorageMultisample(gl.RENDERBUFFER, samples, gl.DEPTH_COMPONENT24, width, height);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
    sceneMsaa = { fbo, color, depth };
    scene = makeTarget(gl, width, height, COLOR_INTERNAL, gl.RGBA, COLOR_TYPE);
    let bw = width;
    let bh = height;
    for (let i = 0; i < 4; i++) {
      bw = Math.max(2, bw >> 1);
      bh = Math.max(2, bh >> 1);
      blooms.push(makeTarget(gl, bw, bh, COLOR_INTERNAL, gl.RGBA, COLOR_TYPE));
    }
  };
  allocate();

  /* ---------- State ---------- */
  const reading: Reading = { q: 0, flipA: 0, flipB: 0, night: 0, nameTint: 1 };
  const smooth = { q: 0, typed: 0, flipA: 0, flipB: 0, night: 0, nameTint: 1 };
  let name = "";
  let fontFamily = "sans-serif";
  let nameAmount = 0;
  let appliedNameAmount = -1;
  let goldCount = 0;
  let appliedGold = -1;
  let nameCells: number[] = [];
  let still = opts.still;
  let targetsDirty = true;
  let flagsDirty = true;
  let heightsDirty = true;
  let renderRequested = true;
  let introTime = opts.intro === "rest" || opts.still ? 100 : 0;
  let introHeld = opts.intro === "hold";
  let introActive = introTime < 100;
  let impacted = introTime >= 100;
  let cameraShake = 0;
  let time = 0;
  let last = 0;
  let raf = 0;
  let lost = false;
  let firstFrame = true;
  let plotA: [number, number, number, number] = [0, 0, 0, 0];
  let plotB: [number, number, number, number] = [0, 0, 0, 0];
  const gold = { flightX: 0, flightZ: 0, flightOn: 0, pulse: 0 };
  const pointer = { x: 0, y: 0, nx: 0, ny: 0, sx: 0, sy: 0, active: false, moved: 0 };
  let invVP = new Float32Array(16);
  let camEye: Vec3 = [0, 0, 0];
  const frameTimes: number[] = [];
  let frames = 0;
  let simMs = 0;
  let slowFrames = 0;
  let verySlow = 0;
  let fastFrames = 0;

  /** Where a point on screen lands on the ground, with the camera as it is now. */
  const groundAt = (px: number, py: number, plane = 0): [number, number] | null => {
    const nx = (px / cssW) * 2 - 1;
    const ny = 1 - (py / cssH) * 2;
    const m = invVP;
    const w = m[3] * nx + m[7] * ny + m[11] + m[15];
    const fx = (m[0] * nx + m[4] * ny + m[8] + m[12]) / w;
    const fy = (m[1] * nx + m[5] * ny + m[9] + m[13]) / w;
    const fz = (m[2] * nx + m[6] * ny + m[10] + m[14]) / w;
    const dx = fx - camEye[0];
    const dy = fy - camEye[1];
    const dz = fz - camEye[2];
    if (dy >= -0.0001) return null;
    const t = (plane - camEye[1]) / dy;
    return [camEye[0] + dx * t, camEye[2] + dz * t];
  };

  /* ---------- The name, set in bricks ---------- */
  const rasterize = () => {
    const wide = cssW >= cssH;
    const boxW = wide ? 168 : 86;
    const boxH = wide ? 76 : 118;
    const scratch = document.createElement("canvas").getContext("2d", { willReadFrequently: true })!;
    const measure = (text: string, size: number) => {
      scratch.font = `800 ${size}px ${fontFamily}`;
      return scratch.measureText(text).width;
    };
    const fit = fitName(name, { width: boxW, height: boxH, maxSize: wide ? 56 : 40, minSize: wide ? 11 : 10, comfortSize: wide ? 24 : 17 }, measure);
    const resolution = 2;
    const can = scratch.canvas;
    can.width = boxW * resolution;
    can.height = boxH * resolution;
    scratch.fillStyle = "#fff";
    scratch.textAlign = "center";
    scratch.textBaseline = "middle";
    scratch.font = `800 ${fit.size * resolution}px ${fontFamily}`;
    const line = nameLineHeight(fit.size) * resolution;
    const top = can.height / 2 - (line * (fit.lines.length - 1)) / 2;
    fit.lines.forEach((l, n) => scratch.fillText(l, can.width / 2, top + n * line));
    const data = scratch.getImageData(0, 0, can.width, can.height).data;
    const sample = (x: number, z: number) => {
      const u = Math.floor((x - (NAME_CENTER.x - boxW / 2)) * resolution);
      const v = Math.floor((z - (NAME_CENTER.z - boxH / 2)) * resolution);
      if (u < 0 || v < 0 || u >= can.width || v >= can.height) return 0;
      return data[(v * can.width + u) * 4 + 3];
    };
    nameCells = [];
    for (let i = 0; i < count; i++) {
      const x = brick[i * 3];
      const z = brick[i * 3 + 1];
      const hit = sample(x - 0.5, z) + sample(x + 0.5, z) + sample(x, z - 0.25) + sample(x, z + 0.25);
      const on = hit > 4 * 110 ? 1 : 0;
      nameMask[i] = on;
      if (on) {
        nameCells.push(i);
        // Blocks of different heights, so the letters read as buildings with a skyline.
        const block = hash2(Math.floor(x / 7), Math.floor(z / 6));
        nameRise[i] = 4.2 + block * 4.4;
      }
      flags[i * 2] = on ? 0.55 : houseLit[i];
    }
    // A fixed shuffle, so each sample inquiry always goes to the same place in a given name.
    nameCells.sort((a, b) => hash2(a, 3.3) - hash2(b, 3.3));
    appliedGold = -1;
    flagsDirty = true;
    targetsDirty = true;
  };

  const applyGold = () => {
    extra.fill(0);
    for (let i = 0; i < count; i++) flags[i * 2 + 1] = 0;
    for (let n = 0; n < Math.min(goldCount, nameCells.length); n++) {
      const i = nameCells[n];
      flags[i * 2 + 1] = 1;
      extra[i] = 1.6;
    }
    appliedGold = goldCount;
    flagsDirty = true;
    targetsDirty = true;
  };

  /** What height every brick is trying to reach, given the opening, the name and the plots. */
  const updateGoals = () => {
    const afterImpact = introActive ? introTime - 1.25 : 100;
    for (let i = 0; i < count; i++) {
      let rise = 1;
      if (introActive) {
        const start = distance[i] / 95;
        rise = smoothstep(start, start + 1.5, afterImpact);
      }
      let g = base[i] * rise;
      if (nameMask[i]) g = Math.max(g, (nameRise[i] + extra[i]) * nameAmount);
      else if (extra[i]) g += extra[i];
      goal[i] = g;
    }
    if (!introActive) targetsDirty = false;
    appliedNameAmount = nameAmount;
  };

  const simulate = (dt: number) => {
    const k = cols;
    const wave = 70;
    const damp = 3.4;
    for (let i = 0; i < count; i++) {
      const d = h[i] - goal[i];
      const col = i % k;
      const left = col > 0 ? h[i - 1] - goal[i - 1] : d;
      const right = col < k - 1 ? h[i + 1] - goal[i + 1] : d;
      const up = i >= k ? h[i - k] - goal[i - k] : d;
      const down = i < count - k ? h[i + k] - goal[i + k] : d;
      const accel = -stiff[i] * d + wave * (left + right + up + down - 4 * d) - damp * vel[i];
      vel[i] += accel * dt;
    }
    for (let i = 0; i < count; i++) {
      h[i] += vel[i] * dt;
    }
  };

  const impulse = (x: number, z: number, radius: number, power: number) => {
    const c0 = Math.max(0, Math.floor((x - radius * 2.2 - spec.minX) / BRICK_W));
    const c1 = Math.min(cols - 1, Math.ceil((x + radius * 2.2 - spec.minX) / BRICK_W));
    const r0 = Math.max(0, Math.floor((z - radius * 2.2 - spec.minZ) / BRICK_D));
    const r1 = Math.min(rows - 1, Math.ceil((z + radius * 2.2 - spec.minZ) / BRICK_D));
    const rr = radius * radius;
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const i = r * cols + c;
        const dx = brick[i * 3] - x;
        const dz = brick[i * 3 + 1] - z;
        vel[i] += power * Math.exp(-(dx * dx + dz * dz) / rr);
      }
    }
  };

  /* ---------- Drawing ---------- */
  const fullscreen = () => {
    gl.bindVertexArray(emptyVao);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const heroMatrix = (y: number, tilt: number, yaw: number) => {
    const size = 2.3;
    const ca = Math.cos(yaw);
    const sa = Math.sin(yaw);
    const ct = Math.cos(tilt);
    const st = Math.sin(tilt);
    // Scale, tilt about x, then turn about y, then move into place.
    return new Float32Array([
      ca * size, 0, -sa * size, 0,
      sa * st * size, ct * size, ca * st * size, 0,
      sa * ct * size, -st * size, ca * ct * size, 0,
      heroAt.x, y, heroAt.z, 1,
    ]);
  };

  const render = (dt: number) => {
    const aspect = cssW / cssH;
    const q = smooth.q;
    const poses = posesFor(aspect);
    const seg = Math.min(2, Math.floor(q));
    const f = smoothstep(0, 1, q - seg);
    const a = poses[seg];
    const b = poses[seg + 1];
    let eye = mixV(a.eye, b.eye, f);
    let target = mixV(a.target, b.target, f);
    const fov = a.fov + (b.fov - a.fov) * f;
    const top = a.top + (b.top - a.top) * f;

    // The camera leans a little towards the pointer, and drifts when left alone.
    const free = 1 - top;
    if (!still) {
      pointer.sx += (pointer.nx - pointer.sx) * (1 - Math.exp(-dt * 2.6));
      pointer.sy += (pointer.ny - pointer.sy) * (1 - Math.exp(-dt * 2.6));
      const drift = Math.sin(time * 0.17) * 0.5;
      const closeness = 1 - smoothstep(0, 1, q);
      const lean = 1.2 + (1 - closeness) * 3;
      eye = [eye[0] + (pointer.sx * lean + drift) * free, eye[1] + (-pointer.sy * lean * 0.35 + Math.sin(time * 0.23) * 0.12 * closeness) * free, eye[2]];
      if (cameraShake > 0.001) {
        eye = [eye[0] + Math.sin(time * 61) * cameraShake * 0.12, eye[1] + Math.sin(time * 47) * cameraShake * 0.2, eye[2]];
        target = [target[0], target[1] + Math.sin(time * 53) * cameraShake * 0.1, target[2]];
        cameraShake *= Math.exp(-dt * 6);
      }
    }

    const angle = top * Math.PI * 0.5;
    const up: Vec3 = [0, Math.cos(angle), -Math.sin(angle)];
    const view = lookAt(eye, target, up);
    const proj = perspective(fov, aspect, 0.5, 1800);
    const vp = multiply(proj, view);
    invVP = invert(vp);
    camEye = eye;

    /* Light pass, only when something has moved */
    if (heightsDirty) {
      for (let r = 0; r < rows; r++) {
        const offset = r & 1;
        for (let c = 0; c < cols; c++) {
          const i = r * cols + c;
          const v = Math.max(0, Math.min(255, (h[i] / MAX_HEIGHT) * 255));
          const px = r * cols * 2 + c * 2 + offset;
          heightPx[px] = v;
          if (c < cols - 1 || !offset) heightPx[px + 1] = v;
        }
      }
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, heightTex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, cols * 2, rows, gl.RED, gl.UNSIGNED_BYTE, heightPx);

      gl.bindFramebuffer(gl.FRAMEBUFFER, lightTarget.fbo);
      gl.viewport(0, 0, lightTarget.w, lightTarget.h);
      gl.disable(gl.DEPTH_TEST);
      gl.useProgram(lightProgram.program);
      gl.uniform1i(lightProgram.u.uH, 0);
      gl.uniform2f(lightProgram.u.uUnit, 1 / fieldW, 1 / fieldD);
      gl.uniform3fv(lightProgram.u.uSun, SUN);
      gl.uniform1f(lightProgram.u.uMaxH, MAX_HEIGHT);
      fullscreen();

      gl.bindBuffer(gl.ARRAY_BUFFER, heightBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, h);
      heightsDirty = false;
    }
    if (flagsDirty) {
      gl.bindBuffer(gl.ARRAY_BUFFER, flagBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, flags);
      flagsDirty = false;
    }

    /* The scene */
    const msaa = sceneMsaa!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, msaa.fbo);
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST);
    gl.depthFunc(gl.LEQUAL);
    gl.enable(gl.CULL_FACE);
    gl.cullFace(gl.BACK);

    const p = brickProgram;
    const windowsOn = smoothstep(2.0, 6.0, introTime) * (0.5 + 0.5 * smooth.night);
    gl.useProgram(p.program);
    gl.uniformMatrix4fv(p.u.uVP, false, vp);
    gl.uniform3fv(p.u.uCam, eye);
    gl.uniform3fv(p.u.uSun, SUN);
    gl.uniform1f(p.u.uNight, smooth.night);
    gl.uniform1f(p.u.uTime, time);
    gl.uniform4f(p.u.uField, spec.minX, spec.minZ, fieldW, fieldD);
    gl.uniform1f(p.u.uWindows, windowsOn);
    gl.uniform1f(p.u.uNameTint, smooth.nameTint * Math.max(smooth.typed, smoothstep(0.25, 0.7, q)));
    gl.uniform1f(p.u.uFog, 1 / 400);
    gl.uniform1f(p.u.uFarRise, smoothstep(1.7, 4.6, introTime));
    gl.uniform1f(p.u.uBase, GROUND_BASE);
    gl.uniform4fv(p.u.uPlotA, plotA);
    gl.uniform4fv(p.u.uPlotB, plotB);
    gl.uniform2f(p.u.uFlip, smooth.flipA, smooth.flipB);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, lightTarget.tex);
    gl.uniform1i(p.u.uLight, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, mosaics[0]);
    gl.uniform1i(p.u.uMosA, 1);
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, mosaics[1]);
    gl.uniform1i(p.u.uMosB, 2);

    // Gold: the first brick, and the light travelling with an inquiry.
    const fall = introHeld ? 0 : clamp01((introTime - 0.45) / 0.8);
    const visible = !introHeld && introTime > 0.42;
    const landed = fall >= 1;
    const dropY = landed ? 0 : (1 - fall * fall) * 60;
    const settle = landed ? Math.max(0, Math.exp(-(introTime - 1.25) * 6) * Math.sin((introTime - 1.25) * 16)) * 0.5 : 0;
    const heroY = 0.76 + dropY + settle;
    const heroLight = visible ? 0.9 + Math.sin(time * 0.9) * 0.08 + gold.pulse * 3 : 0;
    gl.uniform4f(p.u.uGoldA, heroAt.x, heroY + 1.2, heroAt.z, heroLight);
    if (gold.flightOn > 0.001) {
      gl.uniform4f(p.u.uGoldB, gold.flightX, 7, gold.flightZ, gold.flightOn * 2.4);
    } else {
      gl.uniform4f(p.u.uGoldB, 0, 0, 0, 0);
    }
    gold.pulse *= Math.exp(-dt * 3.5);

    gl.uniform1f(p.u.uHero, 0);
    gl.uniform1f(p.u.uFar, 0);
    gl.uniform2f(p.u.uHalf, BRICK_W / 2, BRICK_D / 2);
    gl.uniform1f(p.u.uGap, 0.045);
    gl.uniform1f(p.u.uBevel, 0.06);
    gl.bindVertexArray(nearVao);
    gl.drawElementsInstanced(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0, count);

    gl.uniform1f(p.u.uFar, 1);
    gl.uniform2f(p.u.uHalf, spec.farW / 2, spec.farD / 2);
    gl.uniform1f(p.u.uGap, 0.1);
    gl.uniform1f(p.u.uBevel, 0.14);
    gl.uniform2f(p.u.uFlip, 0, 0);
    gl.bindVertexArray(farVao);
    gl.drawElementsInstanced(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0, farCount);

    if (visible) {
      const tilt = landed ? 0 : (1 - fall) * 1.2;
      const yaw = -0.34 + (landed ? 0 : (1 - fall) * 2.2);
      gl.uniform1f(p.u.uHero, 1);
      gl.uniform1f(p.u.uFar, 1);
      gl.uniformMatrix4fv(p.u.uModel, false, heroMatrix(heroY, tilt, yaw));
      gl.bindVertexArray(heroVao);
      gl.drawElementsInstanced(gl.TRIANGLES, geometry.indices.length, gl.UNSIGNED_SHORT, 0, 1);
    }

    gl.disable(gl.CULL_FACE);
    gl.depthMask(false);
    gl.useProgram(skyProgram.program);
    gl.uniformMatrix4fv(skyProgram.u.uInvVP, false, invVP);
    gl.uniform3fv(skyProgram.u.uCam, eye);
    gl.uniform3fv(skyProgram.u.uSun, SUN);
    gl.uniform1f(skyProgram.u.uNight, smooth.night);
    fullscreen();
    gl.depthMask(true);
    gl.disable(gl.DEPTH_TEST);

    /* Resolve, glow, and out to the screen */
    const sceneTarget = scene!;
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, msaa.fbo);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, sceneTarget.fbo);
    gl.blitFramebuffer(0, 0, width, height, 0, 0, width, height, gl.COLOR_BUFFER_BIT, gl.NEAREST);

    gl.useProgram(downProgram.program);
    gl.uniform1i(downProgram.u.uTex, 0);
    gl.activeTexture(gl.TEXTURE0);
    let source = sceneTarget;
    blooms.forEach((t, i) => {
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo);
      gl.viewport(0, 0, t.w, t.h);
      gl.bindTexture(gl.TEXTURE_2D, source.tex);
      gl.uniform2f(downProgram.u.uPx, 1 / source.w, 1 / source.h);
      gl.uniform1f(downProgram.u.uThreshold, i === 0 ? 1.15 : 0);
      fullscreen();
      source = t;
    });
    gl.useProgram(upProgram.program);
    gl.uniform1i(upProgram.u.uTex, 0);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    for (let i = blooms.length - 1; i > 0; i--) {
      const from = blooms[i];
      const to = blooms[i - 1];
      gl.bindFramebuffer(gl.FRAMEBUFFER, to.fbo);
      gl.viewport(0, 0, to.w, to.h);
      gl.bindTexture(gl.TEXTURE_2D, from.tex);
      gl.uniform2f(upProgram.u.uPx, 1 / from.w, 1 / from.h);
      fullscreen();
    }
    gl.disable(gl.BLEND);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, width, height);
    gl.useProgram(compositeProgram.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sceneTarget.tex);
    gl.uniform1i(compositeProgram.u.uScene, 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, blooms[0].tex);
    gl.uniform1i(compositeProgram.u.uBloom, 1);
    const introLight = 0.74 + 0.26 * smoothstep(1.0, 3.2, introTime);
    gl.uniform1f(compositeProgram.u.uExposure, (0.98 - 0.2 * top) * introLight * (1 + gold.pulse * 0.2));
    gl.uniform1f(compositeProgram.u.uBloomAmt, 0.75);
    gl.uniform1f(compositeProgram.u.uTime, still ? 0 : time % 10);
    gl.uniform1f(compositeProgram.u.uAspect, aspect);
    fullscreen();
    gl.bindVertexArray(null);
  };

  const builtAt = performance.now();
  let firstDrawMs = 0;

  /* ---------- The loop ---------- */
  const step = (now: number) => {
    if (lost) return;
    if (!still) raf = requestAnimationFrame(step);
    const raw = last ? (now - last) / 1000 : 1 / 60;
    last = now;
    const dt = Math.min(raw, 1 / 20);
    time += dt;
    const started = performance.now();

    if (introActive && !introHeld) {
      const before = introTime;
      introTime += dt;
      if (before < 1.25 && introTime >= 1.25 && !impacted) {
        impacted = true;
        impulse(heroAt.x, heroAt.z, 5.5, -36);
        impulse(heroAt.x, heroAt.z, 15, 13);
        gold.pulse = 1;
        cameraShake = 1;
      }
      if (introTime > 8) introActive = false;
      targetsDirty = true;
    }

    // Name: visible while it is being typed, and whenever the camera is over it.
    const typedTarget = name.trim() ? 1 : 0;
    const blend = still ? 1 : 1 - Math.exp(-dt * 5);
    smooth.typed += (typedTarget - smooth.typed) * (still ? 1 : 1 - Math.exp(-dt * 1.7));
    const scrollQ = reading.q;
    const targetQ = Math.max(scrollQ, scrollQ < 1 ? smooth.typed * 0.72 : 0);
    smooth.q += (targetQ - smooth.q) * blend;
    smooth.flipA += (reading.flipA - smooth.flipA) * (still ? 1 : 1 - Math.exp(-dt * 7));
    smooth.flipB += (reading.flipB - smooth.flipB) * (still ? 1 : 1 - Math.exp(-dt * 7));
    smooth.night += (reading.night - smooth.night) * blend;
    smooth.nameTint += (reading.nameTint - smooth.nameTint) * blend;

    const showName = Math.max(name.trim() ? 1 : 0, smoothstep(0.25, 0.7, smooth.q));
    const leaving = 1 - smoothstep(1.2, 1.7, smooth.q);
    const returning = smoothstep(2.35, 2.85, smooth.q);
    nameAmount = Math.max(showName * leaving, returning);
    if (Math.abs(nameAmount - appliedNameAmount) > 0.002) targetsDirty = true;
    if (goldCount !== appliedGold) applyGold();
    if (targetsDirty) updateGoals();

    if (pointer.active && !still && smooth.q < 1.4) {
      const hit = groundAt(pointer.x, pointer.y);
      if (hit && pointer.moved > 0) {
        // Bricks swell up to meet the pointer as it passes over them.
        impulse(hit[0], hit[1], 7, Math.min(pointer.moved * 0.022, 5.5));
      }
      pointer.moved *= 0.8;
    }

    if (still) {
      h.set(goal);
      vel.fill(0);
      heightsDirty = true;
    } else {
      simulate(1 / 60);
      if (dt > 1 / 45) simulate(1 / 60);
      heightsDirty = true;
    }
    simMs += (performance.now() - started - simMs) * 0.05;

    render(dt);
    frames++;

    if (firstFrame) {
      firstFrame = false;
      firstDrawMs = performance.now() - started;
      opts.onFirstFrame();
    }

    // Under about ten frames a second the page itself feels stuck, so sharpness goes first and
    // then the whole 3D scene. The first frames are excused: they include warming up.
    if (!still && frames > 2) {
      if (raw > 1.2) verySlow += 12;
      else if (raw > 0.25) verySlow += 3;
      else if (raw > 0.1) verySlow += 1;
      else verySlow = Math.max(0, verySlow - 0.25);
      if (verySlow >= 6) {
        const hopeless = verySlow >= 12;
        verySlow = 0;
        if (scale > 0.7 && !hopeless) {
          scale = 0.7;
          allocate();
        } else {
          lost = true;
          cancelAnimationFrame(raf);
          opts.onLost();
          return;
        }
      }
    }

    if (!still && raw < 0.2) {
      frameTimes.push(raw * 1000);
      if (frameTimes.length > 120) frameTimes.shift();
      // Trade sharpness for smoothness when the machine is struggling, and win it back.
      if (raw > 1 / 42) slowFrames++;
      else slowFrames = Math.max(0, slowFrames - 1);
      if (raw < 1 / 58) fastFrames++;
      else fastFrames = 0;
      if (slowFrames > 26 && scale > 0.7) {
        scale = Math.max(0.7, scale * 0.82);
        slowFrames = 0;
        fastFrames = -600;
        allocate();
      } else if (fastFrames > 480 && scale < maxScale) {
        scale = Math.min(maxScale, scale * 1.12);
        fastFrames = -300;
        allocate();
      }
    }
    renderRequested = false;
  };

  const requestRender = () => {
    if (still && !renderRequested && !lost) {
      renderRequested = true;
      requestAnimationFrame(step);
    }
  };

  // A tab coming back after being hidden isn't a slow frame.
  const onVisibility = () => {
    last = 0;
  };
  document.addEventListener("visibilitychange", onVisibility);

  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
    cancelAnimationFrame(raf);
    opts.onLost();
  };
  canvas.addEventListener("webglcontextlost", onLost);

  const onPointerMove = (e: PointerEvent) => {
    if (e.pointerType === "touch") return;
    const dx = e.clientX - pointer.x;
    const dy = e.clientY - pointer.y;
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.nx = (e.clientX / cssW) * 2 - 1;
    pointer.ny = (e.clientY / cssH) * 2 - 1;
    pointer.active = true;
    pointer.moved = Math.min(240, pointer.moved + Math.hypot(dx, dy));
  };
  const onPointerDown = (e: PointerEvent) => {
    const el = e.target as HTMLElement | null;
    if (el?.closest("a, button, input, textarea, select, label, [data-panel]")) return;
    if (still || smooth.q >= 1.4) return;
    const hit = groundAt(e.clientX, e.clientY);
    if (hit) impulse(hit[0], hit[1], 6, 18);
  };
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });

  updateGoals();
  rasterize();
  updateGoals();
  if (opts.intro === "rest" || opts.still) h.set(goal);

  if (still) requestAnimationFrame(step);
  else raf = requestAnimationFrame(step);

  return {
    setReading(r) {
      const changed = r.q !== reading.q || r.flipA !== reading.flipA || r.flipB !== reading.flipB || r.night !== reading.night || r.nameTint !== reading.nameTint;
      Object.assign(reading, r);
      if (changed) requestRender();
    },
    setName(next) {
      if (next === name) return;
      name = next;
      rasterize();
      requestRender();
    },
    setNameFont(family) {
      fontFamily = family;
      rasterize();
      requestRender();
    },
    setPlots(a, b) {
      const pxPerUnit = cssH / (2 * OVERHEAD_Y * TAN_HALF);
      const toWorld = (rect: ScreenRect): [number, number, number, number] => [
        NAME_CENTER.x + (rect.left - cssW / 2) / pxPerUnit,
        NAME_CENTER.z + (rect.top - cssH / 2) / pxPerUnit,
        NAME_CENTER.x + (rect.right - cssW / 2) / pxPerUnit,
        NAME_CENTER.z + (rect.bottom - cssH / 2) / pxPerUnit,
      ];
      plotA = a ? toWorld(a) : [0, 0, 0, 0];
      plotB = b ? toWorld(b) : [0, 0, 0, 0];
      requestRender();
    },
    setMosaic(which, source) {
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, mosaics[which]);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.SRGB8_ALPHA8, gl.RGBA, gl.UNSIGNED_BYTE, source);
      requestRender();
    },
    setGold(n) {
      goldCount = n;
      requestRender();
    },
    setFlight(x, y, intensity) {
      if (intensity <= 0) {
        gold.flightOn = 0;
        return;
      }
      const hit = groundAt(x, y);
      if (hit) {
        gold.flightX = hit[0];
        gold.flightZ = hit[1];
      }
      gold.flightOn = intensity;
    },
    ripple(x, y, strength) {
      const hit = groundAt(x, y);
      if (hit) {
        impulse(hit[0], hit[1], 6, -22 * strength);
        impulse(hit[0], hit[1], 18, 8 * strength);
      }
    },
    setStill(next) {
      if (next === still) return;
      still = next;
      cancelAnimationFrame(raf);
      last = 0;
      if (still) {
        renderRequested = false;
        requestRender();
      } else {
        raf = requestAnimationFrame(step);
      }
    },
    skipIntro() {
      if (!introActive && !introHeld) return;
      introHeld = false;
      introTime = 100;
      introActive = false;
      impacted = true;
      targetsDirty = true;
      updateGoals();
      h.set(goal);
      vel.fill(0);
      heightsDirty = true;
      requestRender();
    },
    resize() {
      allocate();
      rasterize();
      requestRender();
    },
    destroy() {
      lost = true;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    },
    stats() {
      const sorted = [...frameTimes].sort((x, y) => x - y);
      const avg = frameTimes.reduce((s, v) => s + v, 0) / (frameTimes.length || 1);
      return {
        fps: Math.round(1000 / (avg || 16.7)),
        p95: Math.round((sorted[Math.floor(sorted.length * 0.95)] ?? 0) * 10) / 10,
        scale: Math.round(scale * 100) / 100,
        bricks: count + farCount,
        frames,
        simMs: Math.round(simMs * 100) / 100,
        initMs: { shaders: Math.round(compiledAt - initStart), field: Math.round(builtAt - compiledAt), firstDraw: Math.round(firstDrawMs) },
      };
    },
  };
}
