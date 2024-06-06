uniform vec4 uGrainCoord;
uniform vec2 uGrainScaleBias;
uniform float uVignetteStrength;
uniform float uVignetteStart;
uniform float uEffectStrength;
uniform float uTime;
uniform float uGrainRatio;

float rand(vec2 co){
    return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}