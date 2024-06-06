precision highp float;

#if __VERSION__ == 300
  #define IN in
  #define OUT out
#else
  #define IN attribute
  #define OUT varying
#endif


IN vec2 aTexCoord0;

OUT vec2 vTexCoordVP;
OUT vec2 vTexCoordFull;

uniform vec2 uViewportScale;

{{@precode}}

void main(void)
{
  vTexCoordVP   = aTexCoord0 * uViewportScale;
  vTexCoordFull = aTexCoord0;

  {{@code}}

  gl_Position.xy = 2.0 * aTexCoord0-vec2(1.0,1.0);
  gl_Position.zw = vec2(0.0,1.0);
}
