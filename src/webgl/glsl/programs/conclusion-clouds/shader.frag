precision {{@highp}} float;
varying vec2 vUv;
uniform sampler2D uDiffuse;
uniform float uAlpha;
uniform float uTime;
uniform float uNoiseToRight;
uniform sampler2D uNoise;


void main() {
  vec3 noise = texture2D(uNoise, vUv * 1. + uTime * 0.00002).rgb;

  vec4 color = texture2D(uDiffuse, vUv + (noise.rg * 0.15 * uNoiseToRight));
  float fadeZone = smoothstep(0., 0.1, vUv.x) * smoothstep(1., 0.9, vUv.x) * smoothstep(0., 0.2, vUv.y) * smoothstep(1., 0.8, vUv.y);

  color.a *= uAlpha * 1.;
  color.a *= fadeZone;
  color.a *= 1.2;

  gl_FragColor = color;
  // gl_FragColor.rgb = vec3(fadeZone);
  // gl_FragColor.a = 1.;
}