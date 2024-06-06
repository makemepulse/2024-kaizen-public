{{@version}}

{{ require( "nanogl-pbr/glsl/includes/glsl-compat.vert" )() }}

IN vec2 aPosition;
OUT vec2 vTexCoord;

uniform mat4 uMVP;
uniform float uScale;

void main(void){
  gl_Position = uMVP * vec4(aPosition, 0.0, 1.0);
  vTexCoord=  aPosition * uScale;
}