{{= if(obj.slot === 'pf' ){ }}
    IN float vDist;
{{= } }}

{{= if(obj.slot === 'postf' ){ }}

float finalDist = smoothstep(MinDist(), MaxDist(), vDist) * IsFogEnabled();

FragColor.rgb = mix(FragColor.rgb, ClearColor(), finalDist);
{{= } }}

