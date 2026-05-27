// code HEAVLY inspired by https://registry.khronos.org/webgl/sdk/demos/google/shiny-teapot/index.html
var gl = null;
var labels_ctx = null;
var labelsCanvas = null;
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

var controller = null;
const blackColor = [0, 0, 0, 1];

// TODO move all to main
import {
  rgba,
  EQFunction,
  zoomIn,
  zoomOut,
  resetZoom,
  concatFloat32,
  concatUInt8,
} from "./utils.js";

import { state } from "./state.js";
import { expr } from "./libs/pratt.js";

const axes_color = [140 / 255, 140 / 255, 140 / 255, 0.7];

var axesBuffer = null;
var axesCapacity = 0;

var labelsArrayX = null;
var labelsArrayY = null;
var x_tick = 1;
var y_tick = 1;

function ensureAxesBuffer() {
  const totalLines = 2 * (state.num_of_axis + 1) + 2;
  const neededFloats = totalLines * 2 * 7;

  labelsArrayX = new Array(totalLines / 2 - 2);
  labelsArrayY = new Array(totalLines / 2 - 2);

  if (!axesBuffer || axesCapacity < neededFloats) {
    axesBuffer = new Float32Array(neededFloats);
    axesCapacity = neededFloats;
  }

  return axesBuffer;
}

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
  labelsCanvas = document.getElementById("labels");
  labels_ctx = labelsCanvas.getContext("2d");

  labels_ctx.clearRect(0, 0, labelsCanvas.width, labelsCanvas.height);
  labels_ctx.fillStyle = "black";
  labels_ctx.font = "12px lm";

  var ratio = window.devicePixelRatio ? window.devicePixelRatio : 1;
  c.width = 800 * ratio;
  c.height = 800 * ratio;

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
  const { verts, vertexCount } = buildAxis();

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
  gl.drawArrays(gl.LINES, 0, vertexCount);
  //   gl.enable(gl.DEPTH_TEST);
}

function draw() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  labels_ctx.clearRect(0, 0, labelsCanvas.width, labelsCanvas.height);

  checkGLError();

  projection.loadIdentity();
  projection.scale(g_height / g_width, 1, 1);

  view.loadIdentity();
  model.loadIdentity();

  var mvp = new Matrix4x4();
  mvp.multiply(model);
  mvp.multiply(view);
  mvp.multiply(projection);

  g_mvp = mvp;

  gl.useProgram(g_programObject);

  gl.uniformMatrix4fv(u_mvpLoc, false, new Float32Array(mvp.elements));

  drawAxis();

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

  const vertsPerEq = 400;
  const totalVerts = positions.length / 3;
  //   gl.disable(gl.DEPTH_TEST);
  for (let first = 0; first < totalVerts; first += vertsPerEq) {
    gl.drawArrays(gl.LINE_STRIP, first, vertsPerEq);
  }
  //   gl.enable(gl.DEPTH_TEST);
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
    alert(str);
  }
}

function buildAxis() {
  const axes = ensureAxesBuffer();
  const vertexCount = updateAxes(axes, ax_o_x, ax_o_y, axes_color);

  return { verts: axes, vertexCount };
}

function updateAxes(axes, x, y, color) {
  const spacing = 2 / state.num_of_axis;

  const offsetX = x % spacing;
  const offsetY = y % spacing;

  let line = 0;

  function writeLine(x1, y1, z1, x2, y2, z2, color) {
    let o = line * 2 * 7;

    axes[o++] = x1;
    axes[o++] = y1;
    axes[o++] = z1;
    axes[o++] = color[0];
    axes[o++] = color[1];
    axes[o++] = color[2];
    axes[o++] = color[3];

    axes[o++] = x2;
    axes[o++] = y2;
    axes[o++] = z2;
    axes[o++] = color[0];
    axes[o++] = color[1];
    axes[o++] = color[2];
    axes[o++] = color[3];

    line++;
  }

  for (let i = 0; i <= state.num_of_axis; i++) {
    const gx = -1 + offsetX + i * spacing;
    const gy = -1 + offsetY + i * spacing;

    const lx = ((gx - ax_o_x) / spacing) * state.x_tick;
    const ly = ((gy - ax_o_y) / spacing) * state.y_tick;

    // let rounding_offset = state.num_of_axis % 2 == 0 ? )? 0 : 2;A
    let rounding_offset = 2;
    if (lx.toFixed(1) != 0) {
      label(lx.toFixed(rounding_offset), gx, ax_o_y - 0.02);
    }
    if (ly.toFixed(1) != 0) {
      label(ly.toFixed(rounding_offset), ax_o_x - 0.06, gy);
    }

    writeLine(gx, -1, 0, gx, 1, 0, color);
    writeLine(-1, gy, 0, 1, gy, 0, color);
  }

  // draw main axes last so they stay visible
  writeLine(x, -1, 0, x, 1, 0, blackColor);
  writeLine(-1, y, 0, 1, y, 0, blackColor);
  label("0", x - 0.02, y - 0.02);

  return line * 2;
}

function updateAll() {
  //   console.log(state.equations.map((eq) => eq.getPositions().slice(0, 10)));
  const { xmin, xmax, ymin, ymax } = minmax();
  try {
    state.equations.forEach((eq) => eq.solve(xmin, xmax));
  } catch (err) {
    console.log("aught");
    showError(err);
  }
  positions = concatFloat32(
    state.equations.map((eq) => eq.getPositions(xmin, xmax, ymin, ymax)),
  );
  colors = concatUInt8(state.equations.map((eq) => eq.getColors()));
}

window.main = main;

window.addEventListener("DOMContentLoaded", () => {
  document.getElementById("center").addEventListener("click", () => {
    ax_o_x = 0;
    ax_o_y = 0;

    updateAll();
    bindBuffers();
    draw();
    // drawAxis();
  });
  document.getElementById("clear").addEventListener("click", () => {
    state.equations = [];
    updateAll();
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
    // console.log(positions.length, colors.length);
  });
  document.getElementById("grid-input").addEventListener("keydown", () => {
    // resetZoom();
    // drawAxis();
    if (event.key === "Enter") {
      // cheakkyyyy
      var val = document.getElementById("grid-input").value;
      if (val > 0) {
        state.num_of_axis = val;
        updateAll();
        bindBuffers();

        draw();
      }
    }
  });
  document.getElementById("x-tick").addEventListener("keydown", () => {
    // resetZoom();
    // drawAxis();
    if (event.key === "Enter") {
      // cheakkyyyy
      var val = document.getElementById("x-tick").value;
      if (val > 0) {
        state.x_tick = val;
        updateAll();
        bindBuffers();

        draw();
      }
    }
  });
  document.getElementById("y-tick").addEventListener("keydown", () => {
    // resetZoom();
    // drawAxis();
    if (event.key === "Enter") {
      // cheakkyyyy
      var val = document.getElementById("y-tick").value;
      if (val > 0) {
        state.y_tick = val;
        updateAll();
        bindBuffers();

        draw();
      }
    }
  });
});

function ndcToCanvas(nx, ny, canvas) {
  return {
    x: (nx + 1) * 0.5 * canvas.width,
    y: (1 - (ny + 1) * 0.5) * canvas.height,
  };
}

function label(text, x, y) {
  const p = ndcToCanvas(x, y, labelsCanvas);
  labels_ctx.fillText(text, p.x - 4, p.y + 4);
}

function minmax() {
  const visibleXUnits = state.num_of_axis * state.x_tick;
  const visibleYUnits = state.num_of_axis * state.y_tick;

  const centerX = -ax_o_x * (visibleXUnits / 2);
  const centerY = -ax_o_y * (visibleYUnits / 2);

  const xmin = centerX - visibleXUnits / 2;
  const xmax = centerX + visibleXUnits / 2;
  const ymin = centerY - visibleYUnits / 2;
  const ymax = centerY + visibleYUnits / 2;

  return { xmin, xmax, ymin, ymax };
}

function enterEq(ele) {
  if (event.key === "Enter") {
    const input = ele;
    // alert(ele.value);
    // const tokens = ele.value.split(" ");
    // console.log(tokens);

    let s_struct;

    try {
      s_struct = expr(input);
    } catch (err) {
      showError(err);
      return;
    }
    // console.log(s_struct);

    const { xmin, xmax, ymin, ymax } = minmax();

    state.equations.push(
      new EQFunction(
        input,
        rgba(255, 0, 0, 255),
        s_struct,
        xmin,
        xmax,
        ymin,
        ymax,
      ),
    );

    const newequation = document.createElement("li");
    const index = state.equations.length - 1;
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

function showError(message) {
  const errorBox = document.getElementById("error-message");

  errorBox.textContent = message;
  errorBox.style.display = "block";

  setTimeout(() => {
    errorBox.style.display = "none";
  }, 3000);
}
