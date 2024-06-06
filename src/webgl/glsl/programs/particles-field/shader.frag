precision {{@highp}} float;

uniform vec3 uColor;
uniform float uFlicker;
uniform float uTime;
uniform float uAlpha;

varying float vOpacity;
varying float vRandom;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main(void){
  float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
  dist = map(dist, 0., 0.5, 1., 0.);
  dist = smoothstep(0., .8, dist);
  dist *= vOpacity;
  if (uFlicker > 0.) dist *= mix(1., sin(3.1415 * (uTime + vRandom) * 30.) + 1.5, uFlicker);
  if (dist < 0.0) discard;
  gl_FragColor = vec4(uColor, dist * uAlpha);
}
