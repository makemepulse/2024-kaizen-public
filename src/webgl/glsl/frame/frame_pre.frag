#define PI 3.1415926535897932384626433832795

uniform sampler2D uFrameNoise;
uniform float uFrameTime;
uniform vec3 uFrameColor;
uniform vec2 uFrameAspect;
uniform float uFrameStrength;
uniform vec2 uFrameNoiseOffset;
uniform float uFrameNoiseRepeat;
uniform vec4 uFrameBorderWidth1;
uniform vec4 uFrameBorderWidth2;
uniform vec4 uFrameBorderWidth3;

// from https://github.com/jamieowen/glsl-blend

float blendSoftLight(float base, float blend) {
	return (blend<0.5)?(2.0*base*blend+base*base*(1.0-2.0*blend)):(sqrt(base)*(2.0*blend-1.0)+2.0*base*(1.0-blend));
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
	return vec3(blendSoftLight(base.r,blend.r),blendSoftLight(base.g,blend.g),blendSoftLight(base.b,blend.b));
}

vec3 blendSoftLight(vec3 base, vec3 blend, float opacity) {
	return (blendSoftLight(base, blend) * opacity + base * (1.0 - opacity));
}

// frame

float frameBorder(float aspect, float width, float coords, float noise) {
  float frameStep = aspect - width;
  return smoothstep(
    frameStep,
    frameStep + 0.002,
    coords - smoothstep(0.3, 1., noise) * width * 2.
  );
}

vec4 frame(vec2 coords, vec4 width, float noise, vec2 screenCoords) {
  return vec4(
    frameBorder(uFrameAspect.y, width.x, coords.y, noise),
    frameBorder(uFrameAspect.y, width.y, uFrameAspect.y - coords.y, noise),
    frameBorder(uFrameAspect.x, width.z, uFrameAspect.x - coords.x, noise),
    frameBorder(uFrameAspect.x, width.w, coords.x, noise)
  );
}

vec3 blendFrame(vec3 baseColor, vec3 frameColor, vec4 frameShape) {
  vec3 blend1 = blendSoftLight(baseColor, frameColor, frameShape.x * uFrameStrength);
  vec3 blend2 = blendSoftLight(blend1, frameColor, frameShape.y * uFrameStrength);
  vec3 blend3 = blendSoftLight(blend2, frameColor, frameShape.z * uFrameStrength);
  return blendSoftLight(blend3, frameColor, frameShape.w * uFrameStrength);
}