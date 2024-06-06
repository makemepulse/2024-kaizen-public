{{= if(obj.slot === 'postf' ){ }}

float underwaterFactor = step(-0.02, vWorldPosition.y);
vec3 underwater = mix(uUnderwaterColor(), FragColor.rgb, 0.4);
FragColor.rgb = mix(underwater, FragColor.rgb, underwaterFactor);

{{= } }}