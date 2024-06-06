precision {{@highp}} float;

#define PI 3.1415926535897932384626433832795

uniform sampler2D uTex;
uniform sampler2D uNoise;
uniform sampler2D uBrush1;
uniform float uNoiseStep;
uniform float uAccumulation;
uniform float uAlpha;
uniform float uAngle;
uniform float uScale;
uniform float uRandAngle;
uniform float uRandAngleInfluence;
uniform bool uRandAngleEnabled;
// uniform vec3 uRand;

uniform float uAspect;
uniform vec2 uCoord;
uniform vec2 uVelocity;
uniform vec3 uChanToUse;

varying vec2 vUv;

float sat( float t ) {
  return clamp( t, 0.0, 1.0 );
}

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

vec2 rotate(vec2 v, float angle) {
    return rotate2d(angle) * vec2(v.x * uAspect, v.y);
    // return rotate2d(angle) * vec2(v.x, v.y);
}

float greyscale(vec3 col){
  float grey = dot(col, vec3(0.299, 0.587, 0.114));
  return grey;
}


vec4 blur5(sampler2D image, vec2 uv, vec2 resolution, vec2 direction) {
  vec4 color = vec4(0.0);
  vec2 off1 = vec2(1.3333333333333333) * direction;
  color += texture2D(image, uv) * 0.29411764705882354;
  color += texture2D(image, uv + (off1 / resolution)) * 0.35294117647058826;
  color += texture2D(image, uv - (off1 / resolution)) * 0.35294117647058826;
  return color; 
}

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float FALLOF_MIN_S = 0.125;

  vec4 color = texture2D(uTex, vUv);

  float vecMagn = length(uVelocity);
  vecMagn /= 4.;
  vecMagn = sat(vecMagn);
  // vecMagn = max(0.5, abs(uVelocity.x + uVelocity.y) / 10.);

  vec2 coord = ((vec2(uCoord) + vec2(1.)) / 2.);

  vec2 noiseUv = vUv;
  noiseUv += 0.5;
  noiseUv *= rotate2d(uAngle + PI / 2.);
  noiseUv -= 0.5;

  float noise = blur5(uNoise, noiseUv / vec2(1., 10.) * 1., vec2(1.), vec2(1., -1.)).r;

  vec2 brushUv = vUv;
  float scaleFactor = uScale;
  brushUv *= scaleFactor;
  brushUv -= (coord * scaleFactor);
  brushUv /= scaleFactor;
  brushUv = rotate(brushUv, (uRandAngleEnabled ? uRandAngle * uRandAngleInfluence : uAngle + PI / 2.));
  brushUv *= scaleFactor;
  
  float brushT = texture2D(uBrush1, brushUv + vec2(0.5)).a;

  vec2 curshShapeDeformation = vec2(.5, .8);
  float cursor = smoothstep(0.3, 0.0, length(brushUv * curshShapeDeformation));

  float noiseEdges = brushT * cursor;
  noiseEdges = smoothstep(0., 1. - 0.2 * vecMagn, 1. - noiseEdges);
  noiseEdges *= noise;
  // noiseEdges = mix(noiseEdges + cursor, noiseEdges, vecMagn);

  float finalC = mix(brushT, sat(brushT - 1.), step(uNoiseStep, noiseEdges));
  // color.rgb = mix(color.rgb, color.rgb + vec3(1.) * (finalC - (0.3 * noise * finalC)), color.a);
  float oldColorZone = greyscale(color.rgb);
  color.rgb = mix(color.rgb + (finalC * uAccumulation) * uAlpha * uChanToUse, color.rgb * uChanToUse, oldColorZone * uChanToUse);
  // color.rgb = vec3(pow(sat(vecMagn), 1.));
  color.a = 1.;
  gl_FragColor = color;
}