attribute vec3 aPosition;
attribute vec4 aSettings;
attribute vec3 aAge;

uniform mat4 uView;
uniform float uTime;
uniform mat4 uProjection;
uniform sampler2D uNoise;
uniform float uParticlesSpeed;

varying float vOpacity;
varying float vRandom;

void main(void){
  vec4 pos = vec4(aPosition, 1.0);
  // pos.y += uTime * aSettings.z;
  pos.y = mod(pos.y, aAge.y) - 5.0;

  pos.z += uTime * aSettings.w;
  pos.z = mod(pos.z, aAge.z) -100.0;

  float life = ((pos.y+5.0) / aAge.y) * ((pos.z+100.0) / aAge.z);

  pos.x += (texture2D(uNoise, vec2(pos.x, pos.y * .1)).r * 4. - 2.) * life * .5;
  // pos.z += (texture2D(uNoise, vec2(pos.y * .1, pos.z)).r * 4. - 2.) * life * .5;

  float smoothedScale = smoothstep(0., .2, life);
  smoothedScale *= 1. - smoothstep(.2, 1., life);

  gl_Position = uProjection * uView * pos;
  gl_PointSize = 30. * aSettings.x * smoothedScale;

  vOpacity = aSettings.y;
  vRandom = aSettings.x;
}