precision {{@highp}} float;

uniform vec3 uColor;
uniform float uTime;

varying float vOpacity;
varying float vRandom;

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

void main(void){
  float dist = distance(gl_PointCoord, vec2(0.5, 0.5));
  if (dist < 0.0) discard;
  gl_FragColor = vec4(uColor, step(dist, 0.5) * vOpacity);
}
