{{= if(obj.slot === 'pv' ){ }}

OUT vec2 vUv;

{{= } }}

{{= if(obj.slot === 'postv' ){ }}

vUv = vertex.position.xz;

{{= } }}