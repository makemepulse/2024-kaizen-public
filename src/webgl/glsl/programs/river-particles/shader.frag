precision {{@highp}} float;

uniform vec3 uColor;
uniform float uTime;
uniform float uMinDistZ;
uniform float uMaxDistZ;
uniform float uMinDistX;
uniform float uMaxDistX;

varying vec3 vWorldPos;
varying float vOpacity;
varying float vVisibility;

void main(void){
  float alpha = distance(gl_PointCoord, vec2(0.5, 0.5));
  alpha = smoothstep(0.5, 0.3, alpha);
  alpha *= vOpacity;
  alpha *= smoothstep(uMaxDistZ, uMinDistZ, abs(vWorldPos.z));
  alpha *= smoothstep(uMaxDistX, uMinDistX, abs(vWorldPos.x));
  alpha *= vVisibility;

  if (alpha < 0.0) discard;

  gl_FragColor = vec4(uColor, alpha);
}
