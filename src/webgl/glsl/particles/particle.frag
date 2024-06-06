#if __VERSION__ == 300
    #define IN in
    #define OUT out
#else
    #define IN attribute
    #define OUT varying
#endif

OUT float vAlpha;
OUT float vColor;

void main(void){
  gl_FragColor.rgb = vec3(1., 1., 1.);
  gl_FragColor.a = .4 + (vAlpha) * 0.5;
//   gl_FragColor.a = 1.;
}
