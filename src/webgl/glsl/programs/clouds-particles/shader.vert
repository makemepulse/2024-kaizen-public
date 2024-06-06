attribute vec3 aPosition;
attribute float aSettings;

uniform float uTime;
uniform float uOffset;
uniform float uMaxSize;
uniform float uMinX;
uniform float uMaxX;
uniform float uScaleSubtract;
uniform mat4 uVP;
uniform mat4 uWorldMatrix;

varying vec3 vWorldPos;
varying vec3 vLocalPos;
varying float vOpacity;

void main(void) {
  vec3 localPos = aPosition;
  localPos.x = uMinX + mod(-uTime + localPos.x, uMaxX - uMinX);
  vec4 pos = uWorldMatrix * vec4(localPos, 1.0);

  gl_Position = uVP * pos;
  gl_PointSize = uMaxSize / gl_Position.w;

  vWorldPos = pos.xyz;
  vLocalPos = localPos.xyz;

  vOpacity = aSettings;
}