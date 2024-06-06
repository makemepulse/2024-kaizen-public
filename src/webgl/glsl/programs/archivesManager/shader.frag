precision highp float;
varying vec2 vUv;
uniform sampler2D uCurrentTex;
uniform sampler2D uNextTex;
uniform sampler2D uWNoiseTex;
uniform float uSaturation;
uniform vec2 uRez;

float greyscale(vec3 col){
  float grey = dot(col, vec3(0.299, 0.587, 0.114));
  return grey;
}

vec3 czm_saturation(vec3 rgb, float adjustment)
{
    // Algorithm from Chapter 16 of OpenGL Shading Language
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

void main() {
    vec2 uv = vec2(vUv.x, vUv.y);
    vec4 t1 = texture2D(uCurrentTex, uv);
    vec4 t2 = texture2D(uNextTex, uv);

    vec4 mixedTextures = mix(t1, t2, smoothstep(0., 0.7, t2.a));
    vec4 c = mixedTextures;

    // --- GRAIN ---
    float aspect = uRez.x / uRez.y;
    float grain = texture2D(uWNoiseTex, vec2(vUv.x * aspect, vUv.y) * 3.).r;
    vec3 noiseCol = blendSoftLight(c.rgb, vec3(grain));
    c.rgb = mix(c.rgb, noiseCol, 0.65);
    // ---

    c.rgb = czm_saturation(c.rgb, uSaturation);
    gl_FragColor = c;
    gl_FragColor = vec4(c.rgb, 1.0);
}