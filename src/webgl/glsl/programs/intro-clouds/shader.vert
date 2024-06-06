attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vUv;
varying float vDepth;
uniform mat4 uMVP;
uniform float uDist;
uniform float uCamZ;

void main(void) {
  vec4 pos = vec4(aPosition, 1.0);

  gl_Position = uMVP * pos;
  vUv = aTexCoord;
  
  vDepth = smoothstep(130., 0., abs(uCamZ - gl_Position.z));
  // vDepth =  1. - length(abs(uCamZ - gl_Position.z) / 150.);
}