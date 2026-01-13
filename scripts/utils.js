import { state } from "./state.js";
import { expr } from "./libs/pratt.js";

function enterEq(ele) {
  if (event.key === "Enter") {
    // alert(ele.value);
    // const tokens = ele.value.split(" ");
    // console.log(tokens);

    const s = expr(ele.value);
    // console.log("brackets: " + brackets);
    console.log("result: " + s);
  }
}

function zoomIn() {
  state.zoom *= 1.1;
}

function zoomOut() {
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
  constructor(eq, color) {
    this.eq = eq;
    this.color = color;
    this.x = linspace(-100 * state.zoom, 100 * state.zoom, 40000);
    this.y = this.x.map((x) => Math.sin(x));
  }

  solve(ax_o_x, ax_o_y) {
    this.x = linspace(-100 * state.zoom, 100 * state.zoom, 40000);
    {
    }
    for (let i = 0; i < this.x.length; i++) {
      this.y[i] = Math.sin(this.x[i] - ax_o_x) + ax_o_y;
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
