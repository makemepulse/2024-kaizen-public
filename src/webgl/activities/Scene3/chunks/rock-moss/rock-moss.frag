{{= if(obj.slot === 'pf' ){ }}

IN vec2 vMossCoords;

{{= } }}

{{= if(obj.slot === 'f' ){ }}

float noise = texture2D(noiseTex, vMossCoords.xy * 0.5).r * 0.2;
float mossLimit = uMossProgress() * uMossEndProgress();
float mossAmount = smoothstep(
  mossLimit, mossLimit - 0.1,
  vMossCoords.y + noise
);
baseColor().rgb = mix(baseColor().rgb, mossTex().rgb, mossAmount * mossTex().a);

{{= } }}