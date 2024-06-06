attribute vec3 aPosition;
attribute vec2 aParams;
attribute float aRotation;

uniform mat4 uVP;
uniform mat4 uWorldMatrix;

varying vec2 vParams;
varying float vAngle;

void main() {
  vec4 pos = uVP * uWorldMatrix * vec4(aPosition, 1.0);

  gl_Position = pos;
  gl_PointSize = 2000.;

  vParams = aParams;
  vAngle = aRotation;
}