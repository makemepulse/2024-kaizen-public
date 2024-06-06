precision highp float;
attribute vec3 aPosition;
attribute vec2 aTexCoord;
varying vec2 vUv;
void main() {
  gl_Position = vec4(aPosition, 1.0);
  vUv = aTexCoord;
}