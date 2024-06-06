vec2 ratioUVGrain = (texCoordFull - vec2(0.5, 0.5)) * vec2(uGrainRatio, 1) + vec2(0.5, 0.5);

c += c * (uGrainScaleBias.x * rand(texCoordVP*(uGrainCoord.xy + vec2(uTime, -uTime))+uGrainCoord.zw )+uGrainScaleBias.y) * smoothstep(uVignetteStart, uVignetteStart + uVignetteStrength, distance(vec2(0.5, 0.5), ratioUVGrain) * uEffectStrength);