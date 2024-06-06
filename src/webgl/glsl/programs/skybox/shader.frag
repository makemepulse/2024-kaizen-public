precision mediump float;

varying lowp vec3 vRaydir;
uniform samplerCube tCubemap;



void main( void ){

  vec3 wDir = normalize( vRaydir );
  gl_FragColor = textureCube( tCubemap, wDir );


}