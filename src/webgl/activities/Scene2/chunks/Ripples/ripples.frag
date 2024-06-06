

{{= if(obj.slot === 'pf' ){ }}
#define PI 3.141592653
#define PI_2 (PI * 2.)

float ripples(vec2 coords, vec2 position, float seed, float size, float hide) {
  vec2 center = vec2(position.x, position.y);
  float dist = distance(coords, center);

  float angleOffset = seed * PI_2 + uRippleTime() * 0.5;
  float angle = mod(atan(coords.y - center.y, coords.x - center.x) + angleOffset, PI_2);
  vec2 texCoords = vec2(
    angle * 0.05,
    dist * 10. - uRippleTime()
  );
  vec4 tex = texture2D(noiseTex, texCoords);
  float pattern = mix(0., tex.r, smoothstep(0., 0.2, angle) - smoothstep(PI_2 - 0.2, PI_2, angle));

  float limit = min(
    // ripple outer limit
    smoothstep(0.05, 1., dist)
    // ripple grow
    + step(1. * size, dist)
    // ripple disappear
    + hide
    , 1.);

  float stepVal = 0.55 + 0.45 * limit;
  return smoothstep(stepVal - 0.02, stepVal + 0.02, pattern);
}
{{= } }}

{{= if(obj.slot === 'postf' ){ }}
  float ripple = ripples(noise_texCoord(), vec2(0.5, 0.5), 0.3, smoothstep(1.0, 0.2, uOpacity()), 0.0);

  FragColor.rgb = max(vec3(1., 1., 1.), baseColorFactor());
  FragColor.a = ripple * uOpacity();

{{= } }}