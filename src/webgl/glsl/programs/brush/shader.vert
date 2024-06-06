attribute vec3 aPosition;
attribute vec2 aTexCoord;

varying vec2 vUv;


void main(void){
  vec4 pos = vec4(aPosition, 1.0);

  gl_Position = pos;
  vUv = aTexCoord;
}