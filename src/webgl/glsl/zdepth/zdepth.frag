{{= if(obj.slot === 'pf' ){ }}
    IN float vDist;
    IN vec3 vPosition;
{{= } }}

{{= if(obj.slot === 'postf' ){ }}

float finalDist = smoothstep(MinDist(), MaxDist(), vDist) * IsFogEnabled() * IsAlphaEnabled();

float rampHeight = smoothstep(BottomFade(), TopFade(), vPosition.x);
FragColor.a *= (IsAlphaEnabled()) * (1.0 - finalDist) * rampHeight;

if(surface.alpha < 0.01){
    discard;
}
{{= } }}

