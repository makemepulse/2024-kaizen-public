precision highp float;


{{ require( "nanogl-pbr/glsl/includes/glsl-compat.vert" )() }}

IN vec2 aTexCoord0;

OUT vec2 vTexCoordVP;
OUT vec2 vTexCoordFull;

uniform vec2 uViewportScale;

void main(void)
{
  vTexCoordVP   = aTexCoord0 * uViewportScale;
  vTexCoordFull = aTexCoord0;

  gl_Position.xy = 2.0 * aTexCoord0-vec2(1.0,1.0);
  gl_Position.zw = vec2(0.0,1.0);
}
