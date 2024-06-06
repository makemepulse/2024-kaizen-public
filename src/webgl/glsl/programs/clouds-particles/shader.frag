precision {{@highp}} float;

uniform vec3 uColor;
uniform float uTime;
uniform float uMinX;
uniform float uMaxX;

varying vec3 vWorldPos;
varying vec3 vLocalPos;
varying float vOpacity;

void main(void){
  float alpha = distance(gl_PointCoord, vec2(0.5, 0.5));
  float limits = smoothstep(uMinX + 5., uMinX + 15., vLocalPos.x) * smoothstep(uMaxX - 5., uMaxX - 15., vLocalPos.x);
  gl_FragColor = vec4(uColor, step(alpha, 0.5) * limits * vOpacity);
}
