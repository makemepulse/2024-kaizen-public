attribute vec3 aPosition;
attribute vec2 aTexCoord;

uniform mat4 uVP;
uniform mat4 uWorldMatrix;
uniform vec2 uHeatmapScale;

varying float vWorldZ;
varying vec2 vTexCoord;
varying vec2 vHeatmapCoord;

void main( void ){
  vec4 worldPos = uWorldMatrix * vec4(aPosition, 1.0);
  gl_Position = uVP * worldPos;

  vTexCoord = aTexCoord;
  vWorldZ = worldPos.z;
  vHeatmapCoord = worldPos.xz * uHeatmapScale + vec2(0.5);
}
