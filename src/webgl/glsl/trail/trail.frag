{{= if(obj.slot === 'pf' ){ }}
    IN mediump vec2 vTexCoord0;
    IN vec3 vPos;
    IN float distD;
    IN float distN;
{{= } }}

{{= if(obj.slot === 'postf' ){ }}
    float fn = mod(-uTime() * 0.3 + vTexCoord0.y+ uColor().r * uColor().b * 2., 1.);
    vec4 col = texture2D(noisecolor, vec2(fract(vTexCoord0.x + sin((uTime() * 0.3 + vTexCoord0.y) * 0.4)), fract(fn * 0.2)));
    FragColor.rgb = uColor();

    float alpha = mix(1.0, smoothstep(0.0, 0.1, vTexCoord0.y) * smoothstep(1., 0.95, vTexCoord0.y) * distD, uMixBorder()) * distN;
    float n = mix(clamp(floor((col.r * col.b * 4.)), 0., 1.), 1.0, (step(0.25, vTexCoord0.x)) * (1. - step(0.75, vTexCoord0.x)) * (uMixBorder()));
    alpha *= n;
    FragColor.a =  alpha * uAlpha();
{{= } }}

