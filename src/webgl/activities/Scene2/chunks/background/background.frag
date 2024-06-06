{{= if(obj.slot === 'pf' ){ }}

IN mediump vec2 vTexCoord0;
#define baseColor_texCoord(k) vTexCoord0

const float NOISE_GRANULARITY = 0.5/255.0;

float random(vec2 coords) {
  return fract(sin(dot(coords.xy, vec2(12.9898,78.233))) * 43758.5453);
}

float sat(float val) {
  return clamp(val, 0., 1.);
}


{{= } }}

{{= if(obj.slot === 'postf' ){ }}

vec3 color = vec3(uUseClampedMix());
vec2 UVs = vec2(1.) - vTexCoord0;

if (uType() == 0.) {
    float distToCenter = distance(UVs, vec2(0.5));
    distToCenter *= uRadialStrength() * 2.;
    distToCenter = max(0., min(1., distToCenter));
    color = mix(uBottomColor().rgb, uTopColor().rgb, distToCenter);
} else if (uType() == 1.) {
    color = mix(uBottomColor().rgb, uTopColor().rgb, (UVs.y - uBottomColor().a) / (uTopColor().a - uBottomColor().a));
    color += uMiddleColor().rgb * .000001;
} else {
    float topMixVal = (UVs.y - uBottomColor().a) / (uMiddleColor().a - uBottomColor().a);
    topMixVal = mix(topMixVal, sat(topMixVal), uUseClampedMix());
    color = mix(uBottomColor().rgb, uMiddleColor().rgb, topMixVal);

    float botMixVal = (UVs.y - uMiddleColor().a) / (uTopColor().a - uMiddleColor().a);
    botMixVal = mix(botMixVal, sat(botMixVal), uUseClampedMix());
    vec3 colorB = mix(uMiddleColor().rgb, uTopColor().rgb, botMixVal);
    color = mix(colorB, color, step(UVs.y, uMiddleColor().a));
}

vec3 ditheredColor = color + mix(-NOISE_GRANULARITY, NOISE_GRANULARITY, random(UVs));

FragColor = vec4(ditheredColor, 1.);

{{= } }}