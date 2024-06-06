attribute vec4 aPosition;
uniform mat4 uVP;
uniform mat4 uM;

uniform float uScroll;

#if __VERSION__ == 300
    #define IN in
    #define OUT out
#else
    #define IN attribute
    #define OUT varying
#endif

OUT float vAlpha;
OUT float vColor;

void main(void) {
float depth = aPosition.z;
vec3 pos = vec3(aPosition.x, 5. - mod(aPosition.y + uScroll * depth, 1.) * 10., aPosition.z * 4.);
gl_Position = uVP * uM * vec4(pos, 1.0);
gl_PointSize = max(4. * depth, 1.);
vAlpha = aPosition.w;
}