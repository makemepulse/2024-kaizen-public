{{= if(obj.slot === 'postf' ){ }}

float fogVisibilityZ = smoothstep(uMaxDistZ(), uMinDistZ(), abs(vWorldPosition.z));
float fogVisibilityY = smoothstep(uMaxLimitY(), uMinLimitY(), uCameraY() - vWorldPosition.y);
FragColor.a *= fogVisibilityZ * fogVisibilityY;

{{= } }}