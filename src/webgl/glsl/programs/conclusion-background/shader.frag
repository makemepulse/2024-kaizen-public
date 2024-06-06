precision {{@highp}} float;
uniform sampler2D uColorTex;
uniform sampler2D uNoise;
uniform sampler2D uSprite;
uniform float uAspect;
uniform float uSphereBgProgress;
uniform float uTopGradient;
uniform float uBottomGradient;
varying vec2 vUv;

vec3 blendSoftLight(vec3 base, vec3 blend) {
  return mix(
    sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend),
    2.0 * base * blend + base * base * (1.0 - 2.0 * blend),
    step(base, vec3(0.5))
  );
}

float sat(float value) {
  return clamp(value, 0.0, 1.0);
}

void main(void){
  float toSphereBgProgress = uSphereBgProgress;

  vec3 beigeColor = vec3(0.9176470588, 0.8941176471, 0.7960784314);
  vec3 blueColor = vec3(0. / 255., 40. / 255., 77. / 255.);
  // vec3 blueColor = vec3(255. / 255., 0. / 255., 0. / 255.);
  vec3 baseColor = blueColor;
  vec3 colorTex = texture2D(uColorTex, vUv).rgb;

  float topGradient = mix(1., sat((1. - vUv.y) * (2.5 - uTopGradient * .5)), uTopGradient);
  float botGradient = mix(1., sat(vUv.y * (2.5 - uBottomGradient * .5)), uBottomGradient);

  // float vignetteMin = 0.05;
  // float vignetteMin = 0.3;
  // float vignetteMax = 0.3;
  // float vignetteMax = 0.5;
  // float vignette =  smoothstep(vignetteMin, vignetteMax, vUv.y) * smoothstep(vignetteMin, vignetteMax, 1. - vUv.y);

  vec3 finalColor = mix(baseColor, colorTex, toSphereBgProgress);
  finalColor = mix(finalColor * 0.5, finalColor, botGradient);
  finalColor = mix(finalColor * 0.5, finalColor, topGradient);
  gl_FragColor = vec4(finalColor, 1.0);
}