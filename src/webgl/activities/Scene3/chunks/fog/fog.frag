{{= if(obj.slot === 'postf' ){ }}

float fogVisibility = smoothstep(uMaxDist(), uMinDist(), abs(vWorldPosition.z));
FragColor.a *= fogVisibility;

{{= } }}