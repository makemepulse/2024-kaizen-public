vec4 noiseJitter = texture2D(uNoise, texCoordFull + vec2(floor(uTime2 * uTimeScale) * .1));
vec2 shakeUV = texCoordFull;

shakeUV = shakeUV - vec2(0.5, 0.5);
shakeUV = shakeUV * vec2(uRepeat * uAspect, uRepeat);
shakeUV = shakeUV + vec2(0.5, 0.5);

shakeUV += (noiseJitter.rg - 0.5) * uDisplacement;

vec3 tex = texture2D(uTexture, shakeUV).rgb;
tex *= uTextureLuminosity;

float greyBackground = greyscale(c);
float greyBackgroundContrasted = easeInOutCubic(greyBackground);
greyBackground = greyBackgroundContrasted;

float blendingOpacity = uOpacity;
blendingOpacity = clamp(uOpacity - greyBackground * uBackgroundLum, 0., 1.);
c = blendOverlay(c, tex, blendingOpacity);
// c = vec3(greyBackground);