precision highp float;


varying vec2 vTexCoord;

uniform sampler2D tInput;
uniform float uSpread;
uniform vec3 uKernel[NUM_SAMPLES];



void main(void){

  vec3 color = vec3( 0.0 );

  float alpha = .02 + .98*texture2D( tInput, vTexCoord ).a;

  for(int i=0; i<NUM_SAMPLES; ++i)
  {
    vec3 kernel = uKernel[i].xyz;
    color += texture2D( tInput, vTexCoord + kernel.xy * uSpread * alpha ).xyz * kernel.z;
  }


  gl_FragColor = vec4( color, alpha );
  

}
