precision highp float;
varying vec2 vUv;
uniform sampler2D uTex;
uniform sampler2D uWNoise;
uniform float uGrainVisibility;
uniform float uAspect;
uniform vec3 uColor;
uniform float uBackgroundAlpha;
uniform float uBrushAlpha;

uniform vec3 uColorIntro1;
uniform vec3 uColorIntro2;
uniform bool uIsIntro;

float blendSoftLight(float base, float blend) {
  return (blend<0.5)?(2.0*base*blend+base*base*(1.0-2.0*blend)):(sqrt(base)*(2.0*blend-1.0)+2.0*base*(1.0-blend));
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
  return vec3(blendSoftLight(base.r,blend.r),blendSoftLight(base.g,blend.g),blendSoftLight(base.b,blend.b));
}

vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
  return (blendSoftLight(base, blend) * opacity + base * (1.0 - opacity));
}

float greyscale(vec3 col){
  float grey = dot(col, vec3(0.299, 0.587, 0.114));
  return grey;
}

void main() {
  vec3 c = uColor;

  vec4 tex = texture2D(uTex, vUv);
  vec4 color = vec4(1., 1., 1., 0.);  
  if(uIsIntro) {
    color = mix(color, vec4(uColorIntro1, tex.a), tex.r);  
    color = mix(color, vec4(uColorIntro2, tex.a), tex.g);
  } else {
    color = mix(vec4(1., 1., 1., 0.), vec4(c, tex.a), tex.r);
  }

  float grain = texture2D(uWNoise, vec2(vUv.x * uAspect, vUv.y) * 3.).r;
  vec3 noiseCol = blendSoftLight(color.rgb, vec3(grain));
  color.rgb = mix(color.rgb, noiseCol, uGrainVisibility);

  color.a *= uBrushAlpha;

  vec4 bgColor = vec4(234. / 255., 228. / 255., 203. / 255., uBackgroundAlpha);
  vec4 mixColor = mix(vec4(c.rgb, 0.), bgColor, float(uIsIntro));
  vec4 finalColor = mix(mixColor, color, color.a);

  if(!uIsIntro) {
    finalColor.a -= smoothstep(0.4, 0.7, grain) * .15;
  }
  gl_FragColor = finalColor;
  // gl_FragColor = vec4(smoothstep(0.2, 0.8, finalColor.a));
  // gl_FragColor = vec4(vec3(finalColor.a), 1.0);
  // gl_FragColor = tex;
}