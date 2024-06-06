
vec3 ref = vec3(0.);
#if enableFReflect
{
  vec2 screenUV = gl_FragCoord.xy / ScreenSize();
  screenUV += vec2(sin(100. * (screenUV.y + uTime())) * 0.001, 0.);
  ref = vec3(1.0) - texture2D( tFloorReflect, screenUV).rgb;
  ref = ReflectionStrength() * ref; //pow( ref, vec3(2.2) );
  lightingData.lightingColor += ref;
}
#endif