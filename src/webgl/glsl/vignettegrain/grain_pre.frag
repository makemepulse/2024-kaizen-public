uniform vec4 uGrainCoord;
uniform vec2 uGrainScaleBias;
uniform float uTime;
uniform vec4 uVignette;
uniform vec4 uVignetteAspect;

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}