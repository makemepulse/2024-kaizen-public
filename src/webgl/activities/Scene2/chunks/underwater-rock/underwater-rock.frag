{{= if(obj.slot === 'pf' ){ }}

IN float vWaterDepth;

{{= } }}

{{= if(obj.slot === 'postf' ){ }}

FragColor.rgb = uWaterColor();
FragColor.a = 1. - min(1., max(0., vWaterDepth) * uOpacityThreshold());

{{= } }}
