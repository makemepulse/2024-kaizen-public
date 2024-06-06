

{

  #define CS_SAMPLES 8
  #define CS_P .068
  vec2 tc = texCoordVP - vec2(.5);
  vec3 add = vec3(0.);
  for( int i = 0; i < CS_SAMPLES; i++ ){
    float shift = float(i)/float(CS_SAMPLES-1);

    vec2 ftc = tc * (1.0 + uAmount*(shift - .5));
    add += texture2D( tInput, ftc + .5 ).xyz * texture2D( tChromaShiftTex, vec2( shift * (1.0-2.0*CS_P) + CS_P , .5 ) ).rgb;
  }

  c = mix(c, (c + add) / (float( CS_SAMPLES ) * .55), uAmount);
}