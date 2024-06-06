attribute vec3 aPosition;
attribute float aAlpha;
attribute float aSize;
attribute vec4 aMovement;
uniform mat4 uVP;
uniform mat4 uWorldMatrix;
varying float vOpacity;
varying float vOffset;
varying float vSize;

void main() {
  vec4 pos = uVP * uWorldMatrix * vec4(aPosition, 1.0);

  gl_Position = pos;
  gl_PointSize = (90. - aSize) / gl_Position.w;

  vOpacity = aAlpha;
  vOffset = aMovement.x;
  vSize = aSize;
}