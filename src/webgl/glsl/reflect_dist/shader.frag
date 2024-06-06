
#pragma SLOT definitions
#pragma SLOT precision


#if __VERSION__ == 300
  #define IN in
#else
  #define IN varying
#endif

#pragma SLOT pf

IN vec3 vWorldPos;

uniform vec3 uCamPos;
uniform float uDistScale;
uniform float uGroundHeight;

void main(void){

  #pragma SLOT f
  float camDist = length( uCamPos - vWorldPos );
  float dist = camDist / ( 1.0 + (uCamPos.y/vWorldPos.y ) );
  if(vWorldPos.y < uGroundHeight) discard;
  // gl_FragColor = vec4( 0.0, 0.0, 0.0, vWorldPos.y*uDistScale );
  gl_FragColor = gl_FragColor*0.0001 + vec4( 0.0, 0.0, 0.0, vWorldPos.y*uDistScale*dist );

}
