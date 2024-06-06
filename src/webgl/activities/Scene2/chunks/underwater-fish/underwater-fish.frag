{{= if(obj.slot === 'pf' ){ }}

IN float vWaterDepth;

{{= } }}

{{= if(obj.slot === 'postf' ){ }}

float uvY = 1. - gl_FragCoord.y / uViewportSize().y / (uViewportSize().x / uViewportSize().y);
uvY = min(1., max(0., uvY));

vec3 waterColor = mix(uWaterColor(), uDeepWaterColor(), uvY);
FragColor.rgb = mix(FragColor.rgb, waterColor, min(1., max(0., vWaterDepth) * uDeepWaterColorFactor()));

{{= } }}
