{{= if(obj.slot === 'pv' ){ }}
#if __VERSION__ == 300
    #define texture2D(a, b) texture( a, b )
#endif

OUT float vWaterDepth;

{{= } }}

{{= if(obj.slot === 'vertex_warp_world' ){ }}

vWaterDepth = uWaterHeight() - vertex.worldPos.y;

{{= } }}

{{= if(obj.slot === 'postv' ){ }}

vec2 UV = vertex.position.xz;
float t = uTime() * 2.;
float noise = texture2D(tNoise, vec2(UV.x * .1 + t, UV.y * .1 + t) * 0.1).r * 2. - 1.;
float distToCamera = length(vertex.worldPos.xyz - uCameraPos());

gl_Position.xy += noise * 0.01 * max(0., vWaterDepth) * distToCamera;

{{= } }}