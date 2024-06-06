{{= if(obj.slot === 'pv' ){ }}

OUT float vWaterDepth;

{{= } }}

{{= if(obj.slot === 'vertex_warp_world' ){ }}

vWaterDepth = uWaterHeight() - vertex.worldPos.y;
vertex.worldPos.y -= max(0., vWaterDepth) * uDistortionFactor();

{{= } }}