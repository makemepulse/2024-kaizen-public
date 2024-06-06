uniform sampler2D uTexture;
uniform sampler2D uNoise;
uniform float uRepeat;
uniform float uOpacity;
uniform float uAspect;
uniform float uTime2;
uniform float uDisplacement;
uniform float uTimeScale;
uniform float uTextureLuminosity;
uniform float uBackgroundLum;

float blendOverlay(float base, float blend) {
  return base<0.5?(2.0*base*blend):(1.0-2.0*(1.0-base)*(1.0-blend));
}

vec3 blendOverlay(vec3 base, vec3 blend) {
  return vec3(blendOverlay(base.r,blend.r),blendOverlay(base.g,blend.g),blendOverlay(base.b,blend.b));
}

vec3 blendOverlay(vec3 base, vec3 blend, float opacity) {
  return (blendOverlay(base, blend) * opacity + base * (1.0 - opacity));
}

float greyscale(vec3 col){
  float grey = dot(col, vec3(0.299, 0.587, 0.114));
  return grey;
}

float easeInOutCubic(float x) {
  return x < 0.5 ? 4.0 * x * x * x : 1.0 - pow(-2. * x + 2., 3.) / 2.;
}