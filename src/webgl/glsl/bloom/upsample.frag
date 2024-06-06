
precision mediump float;

{{ require( "nanogl-pbr/glsl/includes/glsl-compat.frag" )() }}
{{ require( "./common.frag" )() }}

uniform sampler2D tInput;
uniform sampler2D tInputLowMip;
uniform vec4 uParams;
IN vec2 vTexCoordVP;

#define Scatter uParams.x

void main(void)
{
    vec3 highMip = DECODE_HDR(texture2D(tInput, vTexCoordVP));
    vec3 lowMip  = DECODE_HDR(texture2D(tInputLowMip, vTexCoordVP));
    vec3 color = mix(highMip, lowMip, Scatter);
    FragColor = ENCODE_HDR(color);
}