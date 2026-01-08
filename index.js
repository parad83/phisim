// code HEAVLY inspired by https://registry.khronos.org/webgl/sdk/demos/google/shiny-teapot/index.html
var gl = null;
var g_programObject = null;
var g_width = 0;
var g_height = 0;

var g_vbo = null;
var g_axes_vbo = null;

var model = new Matrix4x4();
var view = new Matrix4x4();
var projection = new Matrix4x4();

var I = new Matrix4x4();
I.loadIdentity();

var g_positionLoc = -1;
var g_axesLoc = -1;
var u_mvpLoc = -1;

var controller = null;

var positions = new Float32Array([0.5, -0.5, 0.0, -1, -0.5, 0, 1, 0, -0.5]);

var pos_x = 0;
var pos_y = 0;
var s = 0.01;

// axis offset from (0,0)
var ax_o_x = 0;
var ax_o_y = 0;

var vertexSource = [
  "attribute vec3 g_position;",
  "uniform mat4 u_mvp;",
  "void main() {",
  "  gl_Position = u_mvp * vec4(g_position, 1.0);",
  "}",
].join("\n");

var fragmentSource = [
  "precision mediump float;",
  "",
  "void main()",
  "{",
  "gl_FragColor = vec4(1.0, 0.5, 0.2, 1.0);",
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
    pos_x -= controller.deltaX * s;
    pos_y += controller.deltaY * s;

    draw();
  };

  init();
  draw();
}

function init() {
  gl.viewport(0, 0, g_width, g_height);
  gl.enable(gl.DEPTH_TEST);
  // Can use this to make the background opaque
  // gl.clearColor(0.3, 0.2, 0.2, 1.);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  initTriangle();
  initShaders();
  //   g_bumpTexture = loadTexture("bump.jpg");
  //   g_envTexture = loadCubeMap("skybox", "jpg");

  g_axes_vbo = gl.createBuffer();
}

function initTriangle() {
  g_vbo = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, g_vbo);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
}

function drawAxis() {
  const axes = buildAxis();

  gl.bindBuffer(gl.ARRAY_BUFFER, g_axes_vbo);
  gl.bufferData(gl.ARRAY_BUFFER, axes, gl.DYNAMIC_DRAW);

  gl.useProgram(g_programObject);

  gl.uniformMatrix4fv(u_mvpLoc, false, new Float32Array(I.elements));

  gl.enableVertexAttribArray(g_positionLoc);
  gl.vertexAttribPointer(g_positionLoc, 3, gl.FLOAT, false, 0, 0);

  // width can only be 1 on firefox
  gl.disable(gl.DEPTH_TEST);
  gl.drawArrays(gl.LINES, 0, 4);
  gl.enable(gl.DEPTH_TEST);
}

function draw() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  checkGLError();

  projection.loadIdentity();
  //   projection.perspective(45, g_width / g_height, 10, 500);

  view.loadIdentity();
  //   view.translate(0, -10, -100.0);

  model.loadIdentity();
  //   model.rotate(controller.xRot, 1, 0, 0);
  //   model.rotate(controller.yRot, 0, 1, 0);

  model.translate(pos_x, pos_y, 0);

  var mvp = new Matrix4x4();
  mvp.multiply(model);
  mvp.multiply(view);
  mvp.multiply(projection);

  gl.useProgram(g_programObject);

  gl.uniformMatrix4fv(u_mvpLoc, false, new Float32Array(mvp.elements));

  gl.bindBuffer(gl.ARRAY_BUFFER, g_vbo);
  gl.enableVertexAttribArray(g_positionLoc);
  gl.vertexAttribPointer(g_positionLoc, 3, gl.FLOAT, false, 0, 0);

  gl.drawArrays(gl.TRIANGLES, 0, 3);

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
      "Error linking program: \n" + gl.getProgramInfoLog(programObject)
    );
    gl.deleteProgram(programObject);
    return;
  }
  g_programObject = programObject;

  // for setting the uniforms

  g_positionLoc = gl.getAttribLocation(g_programObject, "g_position");
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
    output("Error compiling shader:\n" + infoLog);
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function checkGLError() {
  var error = gl.getError();
  if (error != gl.NO_ERROR && error != gl.CONTEXT_LOST_WEBGL) {
    var str = "GL Error: " + error;
    output(str);
    throw str;
  }
}

function buildAxis() {
  ax_o_x = Math.max(-1, Math.min(1, pos_x));
  ax_o_y = Math.max(-1, Math.min(1, pos_y));

  return new Float32Array([
    ax_o_x,
    -1.0,
    0.0,
    ax_o_x,
    1.0,
    0.0,
    -1.0,
    ax_o_y,
    0.0,
    1.0,
    ax_o_y,
    0.0,
  ]);
}
