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

const dynamic_vertex_source_part_a_func = [
  "attribute float a_t;",
  "",
  "uniform float u_t_min;",
  "uniform float u_t_max;",
  "uniform float u_xmin;",
  "uniform float u_xmax;",
  "uniform float u_ymin;",
  "uniform float u_ymax;",
  "",
  "uniform mat4 u_mvp;",
  "float f(float x) {",
];

const dynamic_vertex_source_part_b_func = [
  "}",
  "",
  "void main() {",
  "  float x = mix(u_xmin, u_xmax, a_t);",
  "  float y = f(x);",
  "",
  "  float ndx = ((x - u_xmin) / (u_xmax - u_xmin)) * 2.0 - 1.0;",
  "  float ndy = ((y - u_ymin) / (u_ymax - u_ymin)) * 2.0 - 1.0;",
  "",
  "  gl_Position = u_mvp * vec4(ndx, ndy, 0.0, 1.0);",
  "}",
];

const dynamic_vertex_source_part_a_par = [
  "attribute float a_t;",
  "",
  "uniform float u_t_min;",
  "uniform float u_t_max;",
  "uniform float u_xmin;",
  "uniform float u_xmax;",
  "uniform float u_ymin;",
  "uniform float u_ymax;",
  "",
  "uniform mat4 u_mvp;",
];

const dynamic_vertex_source_part_b_par = [
  "",
  "void main() {",
  "  float t = mix(u_t_min, u_t_max, a_t);",
  "  float x = fx(t);",
  "  float y = fy(t);",
  "",
  "  float ndx = ((x - u_xmin) / (u_xmax - u_xmin)) * 2.0 - 1.0;",
  "  float ndy = ((y - u_ymin) / (u_ymax - u_ymin)) * 2.0 - 1.0;",
  "",
  "  gl_Position = u_mvp * vec4(ndx, ndy, 0.0, 1.0);",
  "}",
];

class EQFunction {
  constructor(eq, type, s_structy, s_structx = null, u_t_min = 0, u_t_max = 0) {
    this.eq = eq;
    this.type = type;
    this.s_structy = s_structy;
    this.s_structx = s_structx;
    this.u_t_min = u_t_min;
    this.u_t_max = u_t_max;

    let glsly;
    glsly = s_structy.eval();
    if (type == "function") {
      this.template = dynamic_vertex_source_part_a_func
        .concat(`return ${glsly};`, dynamic_vertex_source_part_b_func)
        .join("\n");
    } else if (type == "parametric") {
      let glslx = s_structx.eval();
      this.template = dynamic_vertex_source_part_a_par
        .concat(
          [
            "float fx(float x) {",
            `return ${glslx};`,
            "}",
            "float fy(float x) {",
            `return ${glsly};`,
            "}",
          ],
          dynamic_vertex_source_part_b_par,
        )
        .join("\n");
    }

    console.log(this.template);
  }
}

export { zoomIn, zoomOut, resetZoom, rgba, EQFunction };
