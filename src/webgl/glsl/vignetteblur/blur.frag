precision mediump float;

uniform sampler2D tInput;

uniform vec4 uKernel[BLUR_SAMPLES];
varying vec2 vTexCoordVP;

void main(void) {
  vec3 color = vec3(0.0);

  for(int i = 0; i < BLUR_SAMPLES; ++i) {
    vec3 kernel = uKernel[i].xyz;
    color += texture2D(tInput, vTexCoordVP + kernel.xy).xyz * kernel.z;
  }

  gl_FragColor = vec4(color, 0.0);
}
