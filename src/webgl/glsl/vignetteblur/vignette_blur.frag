vec2 ratioUV = (texCoordFull - vec2(0.5, 0.5)) * vec2(uRatio, 1) + vec2(0.5, 0.5);
c = mix(
  c,
  texture2D(tBlur, texCoordFull).xyz,
  smoothstep(
    uStart,
    uStart + uStrength,
    distance(vec2(0.5, 0.5), ratioUV) * uEffect
  )
);
