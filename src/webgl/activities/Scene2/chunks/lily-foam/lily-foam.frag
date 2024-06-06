{{= if(obj.slot === 'pf' ){ }}

IN vec2 vUv;

{{= } }}

{{= if(obj.slot === 'f' ){ }}

vec2 uvNoise = vec2(0.5) + abs(vUv - vec2(0.5));
vec4 noise = texture2D(tNoise, vec2(uvNoise.x * 0.75, uvNoise.y * 0.75 + uTime() * .1));
noise *= 1.;

{{= } }}

{{= if(obj.slot === 'postf' ){ }}

FragColor.rgb *= uColor();

float waterSurfaceOpacity = step(uAlphaThreshold(), FragColor.r);
float d = uViewFoam() + ((noise.g + noise.b) * 0.5 * 2. - 1.) * 0.2;
float distToCenter = smoothstep(d + 0.01, d, distance(vUv, vec2(0.)));

FragColor.a *= distToCenter * uFoamOpacity() * tex.a * waterSurfaceOpacity;

{{= } }}