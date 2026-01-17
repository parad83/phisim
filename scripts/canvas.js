// code HEAVLY inspired by https://registry.khronos.org/webgl/sdk/demos/google/shiny-teapot/index.html
var gl = null;
var g_programObject = null;
var g_width = 0;
var g_height = 0;

var g_vbo_pos = null;
var g_vbo_col = null;
var g_axes_vbo = null;

var model = new Matrix4x4();
var view = new Matrix4x4();
var projection = new Matrix4x4();
var g_mvp = new Matrix4x4();

var I = new Matrix4x4();
I.loadIdentity();

var a_positionLoc = -1;
var u_mvpLoc = -1;
var a_colorLoc = -1;

var x_ticks = 10;
var y_ticks = 10;

var controller = null;

// TODO move all to main
import {
  rgba,
  EQFunction,
  zoomIn,
  zoomOut,
  resetZoom,
  enterEq,
  concatFloat32,
  concatUInt8,
} from "./utils.js";

import { state } from "./state.js";
import { expr } from "./libs/pratt.js";

// const s_struct = expr("2*x");

// var eq = new EQFunction("y=2x", red, s_struct);
// var positions = new Float32Array([0.5, -0.5, 0.0, -1, -0.5, 0, 1, 0, -0.5]);
// var colors = new Float32Array([1, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 1]);
// var positions = eq.getPositions();

var positions = [];
var colors = [];

var s = 8;

// axis offset from (0,0)
var ax_o_x = 0;
var ax_o_y = 0;

const FLOAT_SIZE = 4;
const STRIDE = 7 * FLOAT_SIZE;

var vertexSource = [
  "attribute vec3 a_position;",
  "attribute vec4 a_color;",
  "",
  "varying vec4 v_color;",
  "",
  "uniform mat4 u_mvp;",
  "",
  "void main() {",
  "  gl_Position = u_mvp * vec4(a_position, 1.0);",
  "  v_color = a_color;",
  "}",
].join("\n");

var fragmentSource = [
  "precision mediump float;",
  "",
  "varying vec4 v_color;",
  "",
  "void main()",
  "{",
  "gl_FragColor = v_color;",
  "}",
].join("\n");

function main() {
  var c = document.getElementById("c");

  var ratio = window.devicePixelRatio ? window.devicePixelRatio : 1;
  c.width = 800 * ratio;
  c.height = 600 * ratio;

  gl = WebGLUtils.setupWebGL(c);

  if (!gl) return;
  g_width = c.width;
  g_height = c.height;

  controller = new CameraController(c);
  controller.onchange = function (xRot, yRot) {
    // pos_x -= controller.deltaX * s;
    // pos_y += controller.deltaY * s;

    const worldPerPixelX = (2 * state.zoom) / g_width;
    const worldPerPixelY = (2 * state.zoom) / g_height;

    ax_o_x += -controller.deltaX * worldPerPixelX * 1 * s;
    ax_o_y += controller.deltaY * worldPerPixelY * 1 * s;

    // ax_o_x = Math.max(-1, Math.min(1, pos_x));
    // ax_o_y = Math.max(-1, Math.min(1, pos_y));
    // ax_o_x = pos_x;
    // ax_o_y = pos_y;

    updateAll();
    bindBuffers();

    draw();
    // drawAxis();
  };

  init();
  //   updateEquation();
  bindBuffers();
  draw();
  //   drawAxis();
}

function updateEquation(index) {
  state.equations[index].solve(ax_o_x, ax_o_y);
  positions = concatFloat32(state.equations.map((eq) => eq.getPositions()));
  colors = concatUInt8(state.equations.map((eq) => eq.getColors()));
  //   console.log(positions[0]);
  //   bindBuffers();
}

function init() {
  gl.viewport(0, 0, g_width, g_height);
  //   gl.enable(gl.DEPTH_TEST);
  // Can use this to make the background opaque
  // gl.clearColor(0.3, 0.2, 0.2, 1.);
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  initBuffers();
  initShaders();
  //   g_bumpTexture = loadTexture("bump.jpg");
  //   g_envTexture = loadCubeMap("skybox", "jpg");

  g_axes_vbo = gl.createBuffer();
}

function bindBuffers() {
  if (!g_vbo_pos || !g_vbo_col) return;
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vbo_pos);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vbo_col);
  gl.bufferData(gl.ARRAY_BUFFER, colors, gl.DYNAMIC_DRAW);
}

function initBuffers() {
  g_vbo_pos = gl.createBuffer();
  g_vbo_col = gl.createBuffer();
  //   bindBuffers();
}

function drawAxis() {
  const verts = buildAxis();

  gl.bindBuffer(gl.ARRAY_BUFFER, g_axes_vbo);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.DYNAMIC_DRAW);

  gl.useProgram(g_programObject);

  gl.uniformMatrix4fv(u_mvpLoc, false, new Float32Array(g_mvp.elements));

  gl.enableVertexAttribArray(a_positionLoc);
  gl.vertexAttribPointer(a_positionLoc, 3, gl.FLOAT, false, STRIDE, 0); // since 3 positions + 4 colors = 7 float sizes

  gl.enableVertexAttribArray(a_colorLoc);
  gl.vertexAttribPointer(
    a_colorLoc,
    4,
    gl.FLOAT,
    false,
    STRIDE,
    3 * FLOAT_SIZE,
  ); // since 3 positions followed by 4 colors

  // width can only be 1 on firefox
  //   gl.disable(gl.DEPTH_TEST);
  gl.drawArrays(gl.LINES, 0, 4);
  //   gl.enable(gl.DEPTH_TEST);
}

function draw() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  checkGLError();

  projection.loadIdentity();
  projection.ortho(
    -state.zoom, // left
    state.zoom, // right
    -state.zoom, // bottom
    state.zoom, // top
    -1, // near
    1, // far
  );
  //   projection.perspective(260, 1, 10, 10000);

  view.loadIdentity();
  //   view.translate(0, -10, -10.0);

  model.loadIdentity();
  //   model.rotate(controller.xRot, 1, 0, 0);
  //   model.rotate(controller.yRot, 0, 1, 0);

  //   model.translate(pos_x, pos_y, 0);

  var mvp = new Matrix4x4();
  mvp.multiply(model);
  mvp.multiply(view);
  mvp.multiply(projection);

  g_mvp = mvp;

  gl.useProgram(g_programObject);

  gl.uniformMatrix4fv(u_mvpLoc, false, new Float32Array(mvp.elements));

  gl.bindBuffer(gl.ARRAY_BUFFER, g_vbo_pos);
  gl.enableVertexAttribArray(a_positionLoc);
  gl.vertexAttribPointer(a_positionLoc, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, g_vbo_col);
  gl.enableVertexAttribArray(a_colorLoc);
  gl.vertexAttribPointer(a_colorLoc, 4, gl.UNSIGNED_BYTE, true, 0, 0);

  // cheaky assuming all positions are same length for same equation :)))
  // maybe later optimise for constant functions and then need to change but wtv
  // always 400 positions for each equation
  // since 3 coordinates its 3 * 400
  console.log(
    "eqcount",
    state.equations.length,
    "verts",
    positions.length / 3,
    "colors",
    colors.length,
  );
  console.log(state.equations.map((e) => e.s_struct));
  const vertsPerEq = 400;
  const totalVerts = positions.length / 3;
  //   gl.disable(gl.DEPTH_TEST);
  for (let first = 0; first < totalVerts; first += vertsPerEq) {
    gl.drawArrays(gl.LINE_STRIP, first, vertsPerEq);
  }
  //   gl.enable(gl.DEPTH_TEST);
  drawAxis();
  checkGLError();
}

function initShaders() {
  var vertexShader = loadShader(gl.VERTEX_SHADER, vertexSource);
  var fragmentShader = loadShader(gl.FRAGMENT_SHADER, fragmentSource);
  if (!vertexShader || !fragmentShader) return;

  // Create the program object
  var programObject = gl.createProgram();
  gl.attachShader(programObject, vertexShader);
  gl.attachShader(programObject, fragmentShader);
  gl.linkProgram(programObject);

  // Check the link status
  var linked = gl.getProgramParameter(programObject, gl.LINK_STATUS);
  if (!linked && !gl.isContextLost()) {
    console.log(
      "Error linking program: \n" + gl.getProgramInfoLog(programObject),
    );
    gl.deleteProgram(programObject);
    return;
  }
  g_programObject = programObject;

  // for setting the uniforms

  a_positionLoc = gl.getAttribLocation(g_programObject, "a_position");
  a_colorLoc = gl.getAttribLocation(g_programObject, "a_color");
  u_mvpLoc = gl.getUniformLocation(g_programObject, "u_mvp");
}

function loadShader(type, shaderSrc) {
  var shader = gl.createShader(type);
  // Load the shader source
  gl.shaderSource(shader, shaderSrc);
  // Compile the shader
  gl.compileShader(shader);
  // Check the compile status
  if (
    !gl.getShaderParameter(shader, gl.COMPILE_STATUS) &&
    !gl.isContextLost()
  ) {
    var infoLog = gl.getShaderInfoLog(shader);
    console.log("Error compiling shader:\n" + infoLog);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function checkGLError() {
  var error = gl.getError();
  if (error != gl.NO_ERROR && error != gl.CONTEXT_LOST_WEBGL) {
    var str = "GL Error: " + error;
    console.log(str);
    // throw str;
  }
}

// function buildSemiAxis(from, f) {
//   const interval = (2 * ax_o_x) / x_ticks;
//   //   const interval_y = (2 * ax_o_y) / y_ticks;

//   const verts = new Float32Array(interval * 7*2);

//   for (let i = 0; i < interval; i++) {
//     verts[i * 14] = 1
//   }
// }

function buildAxis() {
  // with black colors
  return new Float32Array([
    ax_o_x,
    -state.zoom,
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
    //
    ax_o_x,
    state.zoom,
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
    //
    -state.zoom,
    ax_o_y,
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
    //
    state.zoom,
    ax_o_y,
    0.0,
    0.0,
    0.0,
    0.0,
    1.0,
  ]);
}

function updateAll() {
  console.log(state.equations.map((eq) => eq.getPositions().slice(0, 10)));
  state.equations.forEach((eq) => eq.solve(ax_o_x, ax_o_y));
  positions = concatFloat32(state.equations.map((eq) => eq.getPositions()));
  colors = concatUInt8(state.equations.map((eq) => eq.getColors()));
}

window.main = main;

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("zoom-in").addEventListener("click", () => {
    zoomIn(ax_o_x, ax_o_y);
    updateAll();
    bindBuffers();
    draw();
    // drawAxis();
  });

  document.getElementById("zoom-out").addEventListener("click", () => {
    zoomOut(ax_o_x, ax_o_y);
    updateAll();
    bindBuffers();
    draw();
    // drawAxis();
  });

  document.getElementById("center").addEventListener("click", () => {
    resetZoom();

    bindBuffers();
    draw();
    // drawAxis();
  });
  document.getElementById("eq-input").addEventListener("keydown", () => {
    // resetZoom();
    // drawAxis();
    if (event.key === "Enter") {
      // cheakkyyyy
      var index = enterEq(document.getElementById("eq-input").value);
      console.log(state.equations.length);
      //   updateEquation(index);
      updateAll();
      bindBuffers();
      draw();
    }
    console.log(positions.length, colors.length);
  });
});
