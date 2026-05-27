import { state } from "./state.js";
import { expr } from "./libs/pratt.js";

export function concatFloat32(arr) {
  const total = arr.reduce((s, a) => s + a.length, 0);
  //   console.log(total);
  const out = new Float32Array(total);

  let offset = 0;
  for (const a of arr) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

export function concatUInt8(arr) {
  const total = arr.reduce((s, a) => s + a.length, 0);
  const out = new Uint8Array(total);

  let offset = 0;
  for (const a of arr) {
    out.set(a, offset);
    offset += a.length;
  }
  return out;
}

function zoomIn(ax_o_x, ax_o_y) {
  state.zoom *= 1.1;
}

function zoomOut(ax_o_x, ax_o_y) {
  state.zoom *= 0.9;
}

function resetZoom() {}

export function linspace(min, max, n) {
  return Array.from({ length: n }, (_, i) => min + (i * (max - min)) / (n - 1));
}

const rgba = (r, g, b, a = 255) => new Uint8Array([r, g, b, a]);

class EQFunction {
  constructor(eq, color, s_struct, min_x, max_x, resolution = 400) {
    this.eq = eq;
    this.color = color;
    this.s_struct = s_struct;
    this.solve(min_x, max_x, resolution);
  }

  solve(min_x, max_x, resolution = 400) {
    this.x = linspace(min_x, max_x, resolution);
    this.y = this.x.map((x) => this.s_struct.eval({ x, e: Math.E }));
    console.log(this.x);
    console.log(this.y);
  }

  getPositions(xmin, xmax, ymin, ymax) {
    const verts = new Float32Array(this.x.length * 3);
    for (let i = 0; i < this.x.length; i++) {
      let x = this.x[i];
      let y = this.y[i];
      verts[i * 3] = ((x - xmin) / (xmax - xmin)) * 2 - 1;
      verts[i * 3 + 1] = ((y - ymin) / (ymax - ymin)) * 2 - 1; // y
      verts[i * 3 + 2] = 0.0; // z
    }
    return verts;
  }

  getColors() {
    const cols = new Uint8Array(this.x.length * 4);
    for (let i = 0; i < this.x.length; i++) {
      cols[i * 4] = this.color[0];
      cols[i * 4 + 1] = this.color[1];
      cols[i * 4 + 2] = this.color[2];
      cols[i * 4 + 3] = this.color[3];
    }
    return cols;
  }
}

class CanvasData {
  constructor() {
    this.functions = [];

    CanvasData.instance = this;
  }

  static getInstance() {
    if (!CanvasData.instance) {
      CanvasData.instance = new CanvasData();
    }
    return CanvasData.instance;
  }
}

export { zoomIn, zoomOut, resetZoom, rgba, EQFunction, CanvasData };
