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

function enterEq(ele) {
  if (event.key === "Enter") {
    const input = ele;
    console.log("Entered equation: " + input);
    // alert(ele.value);
    // const tokens = ele.value.split(" ");
    // console.log(tokens);

    const s_struct = expr(input);
    // console.log(s_struct);

    state.equations.push(new EQFunction(input, rgba(255, 0, 0, 255), s_struct));

    const newequation = document.createElement("div");
    const index = state.equations.length - 1;
    console.log(index);
    newequation.textContent = s_struct.toString();
    document.getElementById("eq-list").appendChild(newequation);

    return index;
    // console.log(state.equations);

    // const VARS = {
    //   x: 10,
    // };
    // const s = expr(ele.value);
    // s.eval(VARS);
    // console.log("brackets: " + brackets);
    // console.log("result: " + s.eval(VARS));
  }
}

function zoomIn(ax_o_x, ax_o_y) {
  state.zoom *= 1.1;
}

function zoomOut(ax_o_x, ax_o_y) {
  state.zoom *= 0.9;
}

function resetZoom() {
  state.zoom = 1;
}

function linspace(min, max, n) {
  return Array.from({ length: n }, (_, i) => min + (i * (max - min)) / (n - 1));
}

const rgba = (r, g, b, a = 255) => new Uint8Array([r, g, b, a]);

class EQFunction {
  constructor(eq, color, s_struct) {
    this.eq = eq;
    this.color = color;
    this.s_struct = s_struct;
    this.x = linspace(-1 * state.zoom, 1 * state.zoom, 400);
    this.y = this.x.map((x) => s_struct.eval({ x }));
  }

  solve(ax_o_x, ax_o_y) {
    this.x = linspace(
      (-1 - Math.abs(ax_o_x)) * state.zoom,
      (1 + Math.abs(ax_o_x)) * state.zoom,
      400,
    );
    {
    }
    for (let i = 0; i < this.x.length; i++) {
      this.y[i] = this.s_struct.eval({ x: this.x[i] - ax_o_x }) + ax_o_y;
    }
  }

  getPositions() {
    const verts = new Float32Array(this.x.length * 3);
    for (let i = 0; i < this.x.length; i++) {
      verts[i * 3] = this.x[i]; // x
      verts[i * 3 + 1] = this.y[i]; // y
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

export { enterEq, zoomIn, zoomOut, resetZoom, rgba, EQFunction, CanvasData };
