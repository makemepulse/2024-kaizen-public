attribute vec2 aPosition;
attribute vec2 aTexCoord;

varying vec2 vUv;

void main(void){
  gl_Position = vec4(aPosition, 0.0, 1.0);
  vUv = aTexCoord;
}