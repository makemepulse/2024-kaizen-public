{{= if(obj.slot === 'pv' ){ }}

OUT float vDepth;

{{= } }}

{{= if(obj.slot === 'postv' ){ }}

vDepth = vWorldPosition.y + 0.06;
vDepth *= 20.;
vDepth = max(0.0, vDepth);
vDepth = min(1.0, vDepth);
vDepth = 1.0 - vDepth;

{{= } }}