precision {{@highp}} float;
varying float vOpacity;
varying float vOffset;
varying float vSize;

uniform sampler2D uNoise;
uniform float uTime;
uniform float uGlobalAlpha;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main() {
  float noise = texture2D(uNoise, gl_PointCoord * .5 + vOffset).r;
  float sizeFact = map(noise, 40., 90., 0., 1.);

  float alphaTime = mod(uTime * 0.0001, 1.);
  float alphaNoise = texture2D(uNoise,  vec2(vOffset * 10. + alphaTime, vOffset + 0.5 + alphaTime)).g;

  float dist = distance(gl_PointCoord, vec2(0.5));
  dist = 1. - dist;
  // dist += noise * 0.0000001;
  float shape = min(0.8, smoothstep(0.45, 1. + noise * 0.1, dist));
  shape += min(0.2, smoothstep(clamp(0.3 + noise * 0.5, 0.2, .7), 1., dist));

  float alpha = 0.5 * vOpacity * alphaNoise;
  alpha *= shape;
  alpha = min(alpha, uGlobalAlpha);
  // alpha = 1.;

  gl_FragColor = vec4(vec3(shape), alpha);
  // gl_FragColor = vec4(atan(gl_PointCoord.x - 0.5, gl_PointCoord.y - 0.5) / 3.1456, 0., 0., 1.);
  // gl_FragColor = vec4(vec3(alphaNoise), 1.);
}