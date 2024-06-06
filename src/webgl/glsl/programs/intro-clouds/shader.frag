precision {{@highp}} float;
varying vec2 vUv;
uniform sampler2D uDiffuse;
uniform float uAlpha;
uniform float uAlphaDist;
uniform float uTime;
uniform float uIsTlClouds;
uniform float uFirstRow;
uniform sampler2D uNoise;

varying float vDepth;

void main() {
  vec3 noise2 = texture2D(uNoise, vUv * vec2(.1, .1) + vec2(uTime * 0.00005, 0.)).rgb;
  vec3 noise = texture2D(uNoise, vUv * 1. + uTime * 0.00003).rgb * 0.2 * noise2;

  vec2 diffuseUv = mix(vec2(1. - vUv.x, vUv.y), vec2(1. - vUv.x, vUv.y) + noise.rg, uIsTlClouds);
  vec4 color = texture2D(uDiffuse, diffuseUv);

  // color.rgb += noise * 0.000001;
  color.a *= mix(uAlpha, min(uAlpha, uAlphaDist), uIsTlClouds);
  // color.a *= smoothstep(0.1, 0.4, (noise2.r + noise2.g * 0.01 + noise2.b * 0.01));
  color.a *= .2;
  // color.a = max(color.a, 0.15);

  // color.rgb = mix(color.rgb, vec3(1., 0., 0.), uFirstRow);

  float yFade = smoothstep(0.0, 0.2, vUv.y) * (1. - smoothstep(0.8, 1., vUv.y));
  float xFade = smoothstep(0.0, 0.05, vUv.x) * 1. - smoothstep(0.95, 1., vUv.x);
  float fade = xFade * yFade;
  fade = smoothstep(0., .5, fade);
  color.a *= fade;


  gl_FragColor = color;
  // gl_FragColor.rgb = vec3(smoothstep(0.1, 0.4, (noise2.r + noise2.g * 0.01 + noise2.b * 0.01) / 2.));
  // gl_FragColor.rgb = vec3(noise2.gb * 1.2 * vUv.x,);
  // gl_FragColor.rgb = vec3(vUv, 0.);
  // gl_FragColor.a = max(gl_FragColor.a, 0.15);
//   gl_FragColor.rgb = mix(vec3(uAlphaDist), vec3(1., 0., 0.), uFirstRow);
  // gl_FragColor.r = uAlphaDist;
  // gl_FragColor.a = 1.;
}