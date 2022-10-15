precision mediump float;

attribute vec2 vPosition;
uniform vec2 uScale;

void main() {
  gl_PointSize = 1.0;
  gl_Position = vec4(vPosition / uScale, 0.0, 1.0);
}