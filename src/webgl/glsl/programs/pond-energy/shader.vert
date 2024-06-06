attribute vec3 aPosition;
attribute vec4 aSettings;

uniform mat4 uProjection;
uniform mat4 uView;
uniform float uTime;
uniform sampler2D uNoise;
uniform float uScaleFactor;
uniform vec3 uOffset;

varying float vOpacity;
varying float vRandom;

void main(void){
  vec4 pos = vec4(aPosition, 1.0);
  pos.y += uTime * aSettings.w;
  pos.y = mod(pos.y, aSettings.z);

  float life = pos.y / aSettings.z;

  pos.xyz += uOffset;

  pos.x += (texture2D(uNoise, vec2(pos.x, pos.y * .1)).r * 4. - 2.) * life * .5;
  pos.z += (texture2D(uNoise, vec2(pos.y * .1, pos.z)).r * 4. - 2.) * life * .5;

  float smoothedScale = smoothstep(0., .2, life);
  smoothedScale *= 1. - smoothstep(.2, 1., life);

  gl_Position = uProjection * uView * pos;
  gl_PointSize = 15. * aSettings.x * smoothedScale * 10. * uScaleFactor / gl_Position.w;

  vOpacity = aSettings.y;
  vRandom = aSettings.x;
}