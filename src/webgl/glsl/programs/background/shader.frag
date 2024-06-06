precision {{@highp}} float;

uniform vec4 uTopColor;
uniform vec4 uMiddleColor;
uniform vec4 uBottomColor;

uniform int uType;
uniform float uRadialStrength;

varying vec2 vUv;

const float NOISE_GRANULARITY = 0.5/255.0;

float random(vec2 coords) {
  return fract(sin(dot(coords.xy, vec2(12.9898,78.233))) * 43758.5453);
}

void main(void){
  vec3 color;

  if (uType == 0) {
    
    float distToCenter = distance(vUv, vec2(0.5));
    distToCenter *= uRadialStrength * 2.;
    distToCenter = max(0., min(1., distToCenter));
    color = mix(uBottomColor.rgb, uTopColor.rgb, distToCenter);

  } else if (uType == 1) {

    color = mix(uBottomColor.rgb, uTopColor.rgb, vUv.y);

  } else {

    color = mix(uBottomColor.rgb, uMiddleColor.rgb, (vUv.y - uBottomColor.a) / (uMiddleColor.a - uBottomColor.a));
    color = mix(color, vec3(0.), step(uMiddleColor.a, vUv.y));

    vec3 colorB = mix(uMiddleColor.rgb, uTopColor.rgb, (vUv.y - uMiddleColor.a) / (uTopColor.a - uMiddleColor.a));
    colorB = mix(colorB, vec3(0.), step(vUv.y, uMiddleColor.a));

    color += colorB;

  }

  vec3 ditheredColor = color + mix(-NOISE_GRANULARITY, NOISE_GRANULARITY, random(vUv));

  gl_FragColor = vec4(ditheredColor, 1.);
}
