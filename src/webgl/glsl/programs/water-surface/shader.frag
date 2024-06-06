precision {{@highp}} float;

uniform vec3 uTopColor;
uniform vec3 uBottomColor;
uniform vec2 uViewportSize;

varying vec2 vUv;
varying vec4 vPosition;

void main(void){
  vec3 color = mix(uBottomColor, uTopColor, gl_FragCoord.y / uViewportSize.y / (uViewportSize.x / uViewportSize.y));

  float dist = distance(vUv, vec2(.5));
  dist = smoothstep(0.15, 0.3, dist);

  gl_FragColor = vec4(color, dist);
}
