precision lowp float;

attribute vec2 aPosition;

uniform mat4 uUnproject;

varying lowp vec3 vRaydir;

void main( void ){
  vec4 pos = vec4( aPosition, .5, 1.0 );
  vRaydir = normalize( (uUnproject * pos).xyz );
  gl_Position = pos;
}