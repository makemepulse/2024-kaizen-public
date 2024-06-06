{{= if(obj.slot === 'pf' ){ }}

IN vec2 vUv;

{{= } }}

{{= if(obj.slot === 'f' ){ }}
vec2 uvNoise = vec2(0.5) + abs(vUv - vec2(0.5));
vec4 noise = texture2D(tNoise, vec2(uvNoise.x * 1., uvNoise.y * 1. + uTime() * .1));
// noise *= texture2D(tNoise, vec2(vUv.x * .1 - uTime(), vUv.y * .1));
// noise *= texture2D(tNoise, vec2(vUv * .3 + uTime() * .2));
noise *= 1.;

{{= } }}

{{= if(obj.slot === 'postf' ){ }}

FragColor.rgb *= 0.001;
FragColor.rgb += tex.rgb;

float waterSurfaceOpacity = step(uAlphaThreshold(), FragColor.r);
// float distToCenter = 1.3 - distance(vUv, vec2(0.5, 0.5));
float d = uViewFoam() + ((noise.g + noise.b)) * 0.2;
float distToCenter = smoothstep(d + 0.01, d, distance(vUv, vec2(0.)));

FragColor.rgb *= uFoamColor();

FragColor.a *= waterSurfaceOpacity * uOpacity() * distToCenter * tex.a;
// FragColor.rgb = vec3(1., 0., 0.);
// FragColor.a = 1.;

{{= } }}