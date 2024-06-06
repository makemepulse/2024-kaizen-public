{{= if(obj.slot === 'pf' ){ }}
    IN float vDist;
{{= } }}

{{= if(obj.slot === 'f' ){ }}
    // Change the cloud texture coordinates to create movement and effect
    float progression = CloudsProgress();
    // float stretchedU = mix(0.2, 0.0, progression);
    vec2 uvStretching = vec2(1.0 - smoothstep(0.3, 1.0, progression) * 0.8, 1.0);
    vec2 offsetCoords = ({{obj.originalVarying}} * uvStretching) + vec2(-uTime(), 0.0);
    vec2 customCoords = offsetCoords;
{{= } }}

{{= if(obj.slot === 'postf' ){ }}
    // Fade out the clouds up and down
    float upDownFade = smoothstep(0.0, CloudUpDownFade(), vWorldPosition.y);
    // Fade out the clouds in the distance
    float finalDist = smoothstep(MinDist(), MaxDist(), vDist) * IsFogEnabled();
    vec3 finalColor = mix(CloudColorSlow(), CloudColorFast(), progression);
    FragColor.rgb = finalColor.rgb;
    FragColor.a *= (1.0 - finalDist) * upDownFade * uOpacityUniform();

    EXPOSURE(FragColor.rgb);
    GAMMA_CORRECTION(FragColor.rgb);
    
    if(surface.alpha < 0.01){
        discard;
    }
{{= } }}