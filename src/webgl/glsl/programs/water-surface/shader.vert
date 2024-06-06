attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec4 vPosition;
varying vec2 vUv;

uniform mat4 uMVP;

void main(void){
  vec4 pos = vec4(aPosition, 1.0);

  gl_Position = uMVP * pos;
  
  vPosition = gl_Position;
  vUv = aTexCoord;
}