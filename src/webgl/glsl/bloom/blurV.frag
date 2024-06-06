
precision mediump float;

{{ require( "nanogl-pbr/glsl/includes/glsl-compat.frag" )() }}
{{ require( "./common.frag" )() }}

uniform sampler2D tInput;
uniform vec2 uTexelSize;
IN vec2 vTexCoordVP;

void main(void)
{

    float texelSize = uTexelSize.y;
    vec2 uv = vTexCoordVP;

    // Optimized bilinear 5-tap gaussian on the same-sized source (9-tap equivalent)
    vec3 c0 = DECODE_HDR(texture2D(tInput, uv - vec2(0.0, texelSize * 3.23076923)));
    vec3 c1 = DECODE_HDR(texture2D(tInput, uv - vec2(0.0, texelSize * 1.38461538)));
    vec3 c2 = DECODE_HDR(texture2D(tInput, uv                                      ));
    vec3 c3 = DECODE_HDR(texture2D(tInput, uv + vec2(0.0, texelSize * 1.38461538)));
    vec3 c4 = DECODE_HDR(texture2D(tInput, uv + vec2(0.0, texelSize * 3.23076923)));

    vec3 color = c0 * 0.07027027 + c1 * 0.31621622
                + c2 * 0.22702703
                + c3 * 0.31621622 + c4 * 0.07027027;

    FragColor = ENCODE_HDR(color);

}