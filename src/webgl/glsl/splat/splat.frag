vec2 uvS = (texCoordFull - vec2(0.5, 0.5) + vec2(1.0, 0.0) * uTimeSplat * uSpeedSplat) * uScaleSplat;
vec2 uvS2 = (texCoordFull - vec2(0.5, 0.5) + vec2(0.0, 1.3) * uTimeSplat * uSpeedSplat) * uScaleSplat;

float effect = fBm(uvS, uH, uLacunarity, uFreq, uOctaves) * uSplatStrength * fBm(uvS2, uH, uLacunarity, uFreq, uOctaves);

float effectSmooth = smoothstep(0.0, 0.9, effect);
// c += c * effectSmooth;

//compute vignette
float vignette = 1.0 - length( texCoordFull - 0.5 ) * 1.1;

float graySplat = luminance( c );
c = mix( vec3(graySplat), c, 1.0 + (effectSmooth * (1.0 - vignette)));