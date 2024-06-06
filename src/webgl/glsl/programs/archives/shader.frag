precision {{@highp}} float;

uniform vec2 uCoord;
varying vec2 vUv;
uniform float uTime;
uniform float uLoopAlpha;

uniform sampler2D uNoiseTex;
uniform sampler2D uTex1;
uniform bool uShaking1;
uniform sampler2D uTex2;
uniform bool uShaking2;
uniform sampler2D uTex3;
uniform bool uShaking3;
uniform sampler2D uTex4;
uniform bool uShaking4;

float greyscale(vec3 col) {
  float grey = dot(col, vec3(0.299, 0.587, 0.114));
  return grey;
}

vec3 blendMultiply(vec3 base, vec3 blend) {
	return base*blend;
}

vec3 blendMultiply(vec3 base, vec3 blend, float opacity) {
	return (blendMultiply(base, blend) * opacity + base * (1.0 - opacity));
}

void main(void) {
  vec2 uv = vec2(vUv.x, vUv.y);
  // uv += vec2(0.5);
  // uv *= .5;

  // parallax effect
  float parallaxZone = distance(0.5, uv.y) + distance(0.5, uv.x);
  parallaxZone = smoothstep(0.2, 0.7, parallaxZone);
  parallaxZone *= 1.5;
  vec2 uvParallax = (uCoord * -1.) * (0.03 + (0.01 * parallaxZone));

  // jitter animation
  vec4 noise = texture2D(uNoiseTex, uv * 1. + vec2(floor(uTime * 5.) * .1));
  vec2 shakeUV = uv + (noise.r - 0.5) * 0.0025;

  vec2 uv1 = mix(uv, shakeUV, step(0.5, float(uShaking1))) + uvParallax * 0.23;
  vec2 uv2 = mix(uv, shakeUV, step(0.5, float(uShaking2))) + uvParallax * 0.;
  vec2 uv3 = mix(uv, shakeUV, step(0.5, float(uShaking3))) + uvParallax * 0.5;
  vec2 uv4 = mix(uv, shakeUV, step(0.5, float(uShaking4))) + uvParallax * 1.;

  vec4 tex1 = texture2D(uTex1, uv1);
  vec4 tex2 = texture2D(uTex2, uv2);
  vec4 tex3 = texture2D(uTex3, uv3);
  vec4 tex4 = texture2D(uTex4, uv4);

  // vec4 bg = vec4(234. / 255., 228. / 255., 203. / 255., 1.);
  vec4 bg = vec4(239. / 255., 234. / 255., 218. / 255., 1.);

  vec4 col = tex1;
  
  // With animal visible behind texture blended  
  // vec4 loopTex = tex2;
  // loopTex = mix(col, loopTex, smoothstep(0., 0.7, tex2.a * uLoopAlpha));
  // col = loopTex;
  // vec4 blendBase = vec4(mix(col.rgb, bg.rgb, 1. - col.a), 1.);
  // vec3 tex3c = blendMultiply(blendBase.rgb, tex3.rgb, tex3.a);
  // col = vec4(tex3c, col.a + tex3.a);
  // -----
  // With animal almost not visible behind texture blended  
  vec4 blendBase = vec4(mix(col.rgb, bg.rgb, 1. - col.a), 1.);
  vec3 tex3c = blendMultiply(blendBase.rgb, tex3.rgb, tex3.a);
  col = vec4(tex3c, col.a + tex3.a);
  vec4 loopTex = tex2;
  loopTex = mix(loopTex, col, tex3.a * 0.96);
  loopTex = mix(col, loopTex, smoothstep(0., 0.7, tex2.a * uLoopAlpha));
  col = loopTex;
  // -----

  vec3 tex4c = mix(col.rgb, tex4.rgb, tex4.a);
  col.rgb = tex4c;
  col.a = max(col.a, tex4.a);


  // col.r += parallaxZone * 0.3;
  //col = vec4(tex4.a,tex4.a,tex4.a,1.); 
  gl_FragColor = col;
}
