{{= if(obj.slot === 'pf' ){ }}

#define noiseOffsetBaseSize 0.2

IN vec2 vNoiseCoords;

{{= } }}

{{= if(obj.slot === 'f' ){ }}

vec2 noiseCoords = vec2(vNoiseCoords.x, vNoiseCoords.y - uRiverScroll()) * vec2(0.4, 0.05);
vec4 noise = texture2D(noiseTex, noiseCoords + uWaterTime() * vec2(0.05, -0.1));

float noiseOffsetSize = noiseOffsetBaseSize * uOffsetScale();
vec2 noiseOffset = vec2(noise.r, noise.b) * noiseOffsetSize - noiseOffsetSize * 0.5;
vec2 offsetCoords = {{obj.originalVarying}} + noiseOffset;
vec2 customCoords = offsetCoords;

{{= } }}