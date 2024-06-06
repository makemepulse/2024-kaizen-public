precision {{@highp}} float;
#define PI 3.1415926535897932384626433832795
#define PI2 6.2831853072
varying vec2 vUv;
uniform float uTime;
// uniform vec2 uRes;
// uniform float uAspect;
// uniform sampler2D tBackground;
uniform sampler2D uDotTex;
// uniform sampler2D uNoiseTex;
// uniform sampler2D uSpriteTex;
uniform vec2 uSpriteMaxColRow;
uniform vec2 uSpriteCurrColRow;
uniform vec2 uSpriteCellSize;
// uniform float uDotSize;
uniform float uAlpha;
uniform sampler2D uWNoiseTex;

vec3 czm_saturation(vec3 rgb, float adjustment) {
  const vec3 W = vec3(0.2125, 0.7154, 0.0721);
  vec3 intensity = vec3(dot(rgb, W));
  return mix(intensity, rgb, adjustment);
}

vec3 blendSoftLight(vec3 base, vec3 blend) {
  return mix(
    sqrt(base) * (2.0 * blend - 1.0) + 2.0 * base * (1.0 - blend),
    2.0 * base * blend + base * base * (1.0 - 2.0 * blend),
    step(base, vec3(0.5))
  );
}

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}


void main() {
  // Mask sprite texture
  vec2 cellSize = uSpriteCellSize;
  vec2 spriteUv = vUv;
  spriteUv.y = spriteUv.y / uSpriteMaxColRow.y;
  spriteUv.x = spriteUv.x / uSpriteMaxColRow.x;
  spriteUv.y -= cellSize.y;

  float col = uSpriteCurrColRow.x;
  float row = uSpriteCurrColRow.y;
  spriteUv.x += col * cellSize.x;
  spriteUv.y -= row * cellSize.y;

  // float mask = texture2D(uSpriteTex, spriteUv).a;

  // Jitter effect using noise texture
  // vec4 noiseJitter = texture2D(uNoiseTex, vUv + vec2(floor(uTime * 0.07) * .1));
  // vec2 shakeUV = vUv + (noiseJitter.rg - 0.5) * 0.03;

  vec4 bgColor = vec4(234. / 255., 228. / 255., 203. / 255., 0.);

  // Sample the background texture with jitter effect
  vec4 textureColorBase = texture2D(uDotTex, spriteUv);
  vec4 textureColor = textureColorBase;


  // Mix the background and texture color based on texture alpha
  // vec4 finalColor = mix(bgColor, textureColor, textureColor.a * mask);
  vec4 finalColor = mix(bgColor, textureColor, textureColor.a);

  // float grain = texture2D(uWNoiseTex, shakeUV * 3.0).r;
  float grain = texture2D(uWNoiseTex, vUv * 3.0).r;
  vec3 noiseCol = blendSoftLight(finalColor.rgb, vec3(grain));
  finalColor.rgb = mix(finalColor.rgb, noiseCol, 0.65);
  finalColor.a *= uAlpha;
  gl_FragColor = vec4(finalColor);
}