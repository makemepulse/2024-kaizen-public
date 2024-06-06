{{= if(obj.slot === 'pf' ){ }}

IN vec2 vUv;

{{= } }}

{{= if(obj.slot === 'f' ){ }}



{{= } }}

{{= if(obj.slot === 'postf' ){ }}

FragColor.rgb *= uWaterColor();
// FragColor.rgb += ref;

// FragColor.a *= waterSurfaceOpacity;
// FragColor.a *= 1. / waterSurfaceOpacity;

{{= } }}