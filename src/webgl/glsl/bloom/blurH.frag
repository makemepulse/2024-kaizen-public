
precision mediump float;

{{ require( "nanogl-pbr/glsl/includes/glsl-compat.frag" )() }}
{{ require( "./common.frag" )() }}

uniform sampler2D tInput;
uniform vec2 uTexelSize;
IN vec2 vTexCoordVP;


void main(void)
{
    float texelSize = uTexelSize.x * 2.0;
    vec2 uv = vTexCoordVP;

    // 9-tap gaussian blur on the downsampled source
    vec3 c0 = DECODE_HDR(texture2D(tInput, uv - vec2(texelSize * 4.0, 0.0)));
    vec3 c1 = DECODE_HDR(texture2D(tInput, uv - vec2(texelSize * 3.0, 0.0)));
    vec3 c2 = DECODE_HDR(texture2D(tInput, uv - vec2(texelSize * 2.0, 0.0)));
    vec3 c3 = DECODE_HDR(texture2D(tInput, uv - vec2(texelSize * 1.0, 0.0)));
    vec3 c4 = DECODE_HDR(texture2D(tInput, uv                             ));
    vec3 c5 = DECODE_HDR(texture2D(tInput, uv + vec2(texelSize * 1.0, 0.0)));
    vec3 c6 = DECODE_HDR(texture2D(tInput, uv + vec2(texelSize * 2.0, 0.0)));
    vec3 c7 = DECODE_HDR(texture2D(tInput, uv + vec2(texelSize * 3.0, 0.0)));
    vec3 c8 = DECODE_HDR(texture2D(tInput, uv + vec2(texelSize * 4.0, 0.0)));

    vec3 color = c0 * 0.01621622 + c1 * 0.05405405 + c2 * 0.12162162 + c3 * 0.19459459
                + c4 * 0.22702703
                + c5 * 0.19459459 + c6 * 0.12162162 + c7 * 0.05405405 + c8 * 0.01621622;

    FragColor = ENCODE_HDR(color);

}