{{= if(obj.slot === 'pf' ){ }}
    // IN float vDistance;
    IN vec3 vVertexColor;
    IN float vRenderable;
{{= } }}

{{= if(obj.slot === 'postf' ){ }}
    // Used for debugging
    // FragColor = vec4(vec3(1.0-vDistance, 0.0, 0.0), 1.0);
    // FragColor = vec4(vVertexColor.r, vVertexColor.g, vVertexColor.b, 1.0);
    // FragColor = vec4({{obj.originalVarying}}.r, {{obj.originalVarying}}.g, 1.0, 1.0);

    // Compute the 2 bit number defined by vVertexColor green and blue channel
    // float flowerRenderable = vVertexColor.g * 2.0 + vVertexColor.b;

    // Discard if the flower is not renderable
    // if(flowerRenderable != vRenderable) discard;
{{= } }}