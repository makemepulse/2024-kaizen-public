precision {{@highp}} float;
#define PI 3.141592653589793
#define HALF_PI 1.5707963267948966

varying vec2 vParams;
varying float vAngle;

uniform float uGlobalAlpha;
uniform float uTime;
uniform sampler2D uNoise;

vec2 rotate(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, s, -s, c);
	return m * v;
}

float quadraticOut(float t) {
  return -t * (t - 2.0);
}

float sineIn(float t) {
  return sin((t - 1.0) * HALF_PI) + 1.0;
}

float greyscale(vec3 col) {
  float grey = dot(col, vec3(0.299, 0.587, 0.114));
  return grey;
}


float blendScreen(float base, float blend) {
	return 1.0-((1.0-base)*(1.0-blend));
}

vec3 blendScreen(vec3 base, vec3 blend) {
	return vec3(blendScreen(base.r,blend.r),blendScreen(base.g,blend.g),blendScreen(base.b,blend.b));
}

vec3 blendScreen(vec3 base, vec3 blend, float opacity) {
	return (blendScreen(base, blend) * opacity + base * (1.0 - opacity));
}


float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float sat(float value) {
  return clamp(value, 0., 1.);
}

vec3 SHAPE_START_COLOR = vec3(13. / 255., 20. / 255., 81. / 255.);
vec3 SHAPE_END_COLOR = vec3(190. / 255., 240. / 255., 245. / 255.);

void main() {
  float segLength = vParams.y;
  float progress = clamp(vParams.x, 0., 1. + segLength);

  vec2 noise = texture2D(uNoise, gl_PointCoord * .1 + uTime * 0.0001).rg;

  vec2 uv = vec2(gl_PointCoord.x, 1. - gl_PointCoord.y);
  uv -= 0.5;
  uv = rotate(uv, vAngle);
  uv += 0.5;
  uv *= 1.4;
  vec2 plotUv = uv;

  plotUv.x = pow(plotUv.x, 2.);
  plotUv.y -= 0.05;

  float plotUvRatio = plotUv.y / plotUv.x;


  float end = 0. + progress;
  float start = 0. - segLength + sineIn(progress);
  float progressMask = smoothstep(start, end, uv.x) - step(end, uv.x);
  float colorGradient = smoothstep(start, end + progress, uv.x);
  float invtProgressMask = 1. - progressMask;

  float path = abs(plotUv.y - plotUv.x);
  path = step(sat(.01 - invtProgressMask * 0.01), path);

  float shape = 1. - path;
  shape *= progressMask;



  vec2 tipPos = vec2(0.0, 0.05);
  float tipCircle = distance(uv, vec2(tipPos.x + progress, tipPos.y + pow(progress, 2.)));
  // tipCircle += noise.r * .1;
  tipCircle = 1. - tipCircle;
  
  float coreTip = smoothstep(0.975, 1.0 - 0.05 * (noise.g * 0.1), tipCircle);
  coreTip = map(coreTip, 0., 1., 0., 0.1);
  float secondTip = smoothstep(0.89, 1., tipCircle);
  // secondTip *= 0.8;
  secondTip = min(secondTip, 0.9);
  float tipRing = smoothstep(0.85, 1., tipCircle);
  tipRing -= smoothstep(0.86, 1., tipCircle);
  tipRing *= 3.;
  tipRing *= 1. - 0.1 * (noise.r * 2.);

  float tip = (secondTip + coreTip);
  tip = mix(tipRing * (1. - noise.r * .4), tip, tip);

  vec3 tipColor = mix(vec3(0.), vec3(1.), tip);
  tipColor = mix(tipColor, vec3(128. / 255., 0., 255. / 255.), tipRing);

  vec3 color = mix(SHAPE_START_COLOR, SHAPE_END_COLOR, quadraticOut(colorGradient * (1. - path)));
  color *= vec3(smoothstep(0., 0.1, shape)) * 1.;
  color = blendScreen(color, tipColor, sat(tip * 2.5));
  // color = tipColor;

  float progressFade = smoothstep(0.05, 0.5, progress) - smoothstep(0.8, 1., progress);
  float alpha = greyscale(color);
  alpha *= progressFade;

  color = mix(vec3(1.), color, alpha * 1.2);

  gl_FragColor = vec4(color, alpha);
  gl_FragColor.a *= 0.4;
  gl_FragColor.a *= progressFade;
  gl_FragColor.a = min(gl_FragColor.a, uGlobalAlpha);
  // gl_FragColor.rgb = vec3(noise.r);
  // gl_FragColor.a = 1.;
}