{{= if(obj.slot === 'pv' ){ }}

OUT vec2 vNoiseCoords;

{{= } }}

{{= if(obj.slot === 'vertex_warp_world' ){ }}

vNoiseCoords = vertex.worldPos.xz;

{{= } }}