precision {{@highp}} float;

#define PI 3.141592653
#define PI_2 (PI * 2.)

uniform float uTime;
uniform float uAlpha;
uniform float uScroll;
uniform float uMinDist;
uniform float uMaxDist;
uniform float uQuadRatio;
uniform float uSpeedProgress;
uniform vec2 uRippleSeed;
uniform vec2 uRippleSize;
uniform vec4 uRipplePosition;
uniform float uRippleTime;
uniform sampler2D tNoise;
uniform sampler2D tHeatmap;

varying float vWorldZ;
varying vec2 vTexCoord;
varying vec2 vHeatmapCoord;

float ripples(vec2 coords, vec2 position, float seed, float size) {
  vec2 center = vec2(position.x, (position.y - uScroll) * uQuadRatio);
  float dist = distance(coords, center);

  float angleOffset = seed * PI_2 + uRippleTime * 0.5;
  float angle = mod(atan(coords.y - center.y, coords.x - center.x) + angleOffset, PI_2);
  vec2 texCoords = vec2(
    angle * 0.05,
    dist * 10. - uRippleTime
  );
  vec4 tex = texture2D(tNoise, texCoords);
  float pattern = mix(0., tex.r, smoothstep(0., 0.2, angle) - smoothstep(PI_2 - 0.2, PI_2, angle));

  float limit = min(
    // ripple outer limit
    smoothstep(0.05, 0.14, dist)
    // ripple grow
    + step(0.14 * size, dist)
    // ripple disappear
    + (1. - size)
    , 1.);

  float stepVal = 0.55 + 0.45 * limit;
  return smoothstep(stepVal - 0.02, stepVal + 0.02, pattern);
}

void main(void){
  // --NOISE--
  vec4 noiseTemp = texture2D(tNoise, vec2(vTexCoord.x * 15. + uTime * 0.01, (vTexCoord.y + uScroll) * uQuadRatio) + uTime * 0.1);
  vec4 noise = texture2D(tNoise, vec2(vTexCoord.x + noiseTemp.r * 0.08, (vTexCoord.y + uScroll) * uQuadRatio + uTime * 0.04));
  float xNoise = vTexCoord.x + (noise.r * 0.03 - 0.015) * (1. - uSpeedProgress * 0.8);

  // --STREAMS--
  vec4 heatmap = texture2D(tHeatmap, vHeatmapCoord);
  float offset = heatmap.g * heatmap.b;
  float direction = (texture2D(
    tHeatmap,
    vec2(vHeatmapCoord.x + offset, vHeatmapCoord.y)
  ).g - heatmap.g * 0.5) * 2.;

  float streamX = xNoise + offset * direction;
  float streamOffset = texture2D(tNoise, vec2(streamX, 0.)).r;
  float streamCoords = fract(streamX * (7. + streamOffset * 7.));
  float streamSize = mix(0.05, 0., uSpeedProgress * 0.5);
  float streams = smoothstep(0.45 - streamSize, 0.55 - streamSize, streamCoords) - smoothstep(0.55 + streamSize, 0.65 + streamSize, streamCoords);

  vec2 alphaCoords = vec2(vTexCoord.x * 1.2 + noise.g * 0.02 - 0.01, (vTexCoord.y + uScroll) * 0.1 * uQuadRatio + noise.b * 0.02);
  float alphaNoise = texture2D(tNoise, alphaCoords).g;
  float alphaRock = heatmap.g * 0.5;
  float stepVal = 0.55 + noise.r * 0.1 - 0.05;
  float streamAlpha = smoothstep(stepVal - 0.15, stepVal + 0.15, alphaNoise + alphaRock) * 0.9;

  // --ROCKS--
  vec2 heatmapNoiseCoords = vec2(vHeatmapCoord.x + noise.g * 0.02 - 0.01, vHeatmapCoord.y + noise.b * 0.02 - 0.01);
  float rock = smoothstep(0.5, 0.6, texture2D(tHeatmap, heatmapNoiseCoords).g);

  // --RIPPLES--
  vec2 rippleCoords = vec2(vTexCoord.x + (noise.r * 0.02 - 0.01), vTexCoord.y * uQuadRatio);
  float startRockRipples = ripples(rippleCoords, uRipplePosition.xy, uRippleSeed.x, uRippleSize.x);
  float endRockRipples = ripples(rippleCoords, uRipplePosition.zw, uRippleSeed.y, uRippleSize.y);
  float rockRipples = max(startRockRipples, endRockRipples);

  // --FOG--
  float fogVal = smoothstep(uMaxDist, uMinDist, abs(vWorldZ));
  float fogAlpha = max(fogVal - smoothstep(1., 0.5, fogVal) * heatmap.r, 0.);

  // --RESULT--
  float riverPattern = abs(max(streams, rock) * streamAlpha - rockRipples);
  float riverAlpha = (smoothstep(0.2, 0.3, xNoise) - smoothstep(0.7, 0.8, xNoise));
  float alpha = uAlpha * fogAlpha;

  gl_FragColor = vec4(vec3(0.85, 1., 1.), riverPattern * riverAlpha * alpha);
}
