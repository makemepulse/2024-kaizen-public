
precision mediump float;

{{ require( "nanogl-pbr/glsl/includes/glsl-compat.frag" )() }}
{{ require( "./common.frag" )() }}

uniform sampler2D tInput;
uniform vec4 uParams;
IN vec2 vTexCoordVP;

#define ClampMax            uParams.y
#define Threshold           uParams.z
#define ThresholdKnee       uParams.w


void main(void)
{
   
    vec3 color = texture2D(tInput, vTexCoordVP).xyz;

    color = min(vec3(ClampMax), color);

    float brightness = max(color.r, max(color.g, color.b));
    float softness = clamp(brightness - Threshold + ThresholdKnee, 0.0, 2.0 * ThresholdKnee);
    softness = (softness * softness) / (4.0 * ThresholdKnee + 1e-4);
    float multiplier = max(brightness - Threshold, softness) / max(brightness, 1e-4);
    color *= multiplier;

    FragColor = ENCODE_HDR(color);

}