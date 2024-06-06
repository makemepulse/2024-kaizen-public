attribute vec4 aPosScale;
attribute vec4 aSettings;

uniform mat4 uProjection;
uniform mat4 uView;
uniform vec2 uScale;
uniform float uTime;
uniform float uOffset;
uniform float uMaxSize;
uniform sampler2D uNoise;

varying vec3 vWorldPos;
varying float vOpacity;
varying float vVisibility;

void main(void){
  vec4 pos = vec4(aPosScale.xyz, 1.0);

  pos.y += uTime * aSettings.w;
  pos.y = mod(pos.y, aSettings.z);

  float life = pos.y / aSettings.z;

  pos.x += (texture2D(uNoise, vec2(pos.x, pos.y * .03)).r * 4. - 2.) * life * .5;
  pos.z += (texture2D(uNoise, vec2(pos.y * .03, pos.z)).r * 4. - 2.) * life * .5;
  pos.z += uOffset;

  float lifeScale = smoothstep(0., .2, life);
  lifeScale *= 1. - smoothstep(.2, 1., life);

  float scaleSubtract = 1. - mix(uScale.x, uScale.y, aSettings.x);
  float scale = max(aPosScale.w * lifeScale - scaleSubtract, 0.);

  gl_Position = uProjection * uView * pos;
  gl_PointSize = 30. * uMaxSize * scale / gl_Position.w;

  vWorldPos = pos.xyz;

  vOpacity = aSettings.y;
  vVisibility = step(0.0001, scale);
}