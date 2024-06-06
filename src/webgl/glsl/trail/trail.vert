{{= if(obj.slot === 'pv' ){ }}
    OUT mediump vec2 vTexCoord0;
    OUT vec3 vPos;
    OUT float distD;
    OUT float distN;
    uniform vec3 trailPosition[200]; 
    uniform mat4 uViewMatrix;
    // uniform sampler2D tex_basecolor;
{{= } }}

{{= if(obj.slot === 'postv' ){ }}
    vTexCoord0 = aTexCoord0;
    vPos = vertex.position + vec3(0., 0., 0.5); 
    // vec4 col = texture2D(tex_basecolor, vec2(vertex.position.x, vertex.position.z));
    int id = int(vTexCoord0.y * 200.);
    float perc = float(id) / 200.;
    float nperc = float(id + 1) / 200.;
    float pperc = float(id - 1) / 200.;
    vec3 offset = uOffset();
    // vec3 npos = trailPosition[min(id + 1, 100 - 1)];
    vec3 npos = trailPosition[id + 1];
    vec3 ppos = trailPosition[id - 1];
    vec3 pos = trailPosition[id];

    pos.y += perc * offset.y;
    ppos.y += pperc * offset.y;
    npos.y += nperc * offset.y;

    pos.z += perc * offset.z;
    ppos.z += pperc * offset.z;
    npos.z += nperc * offset.z;
    
    vec4 currentProjected = vertex.worldMatrix * uVP * vec4( pos, 1.0 );
    vec4 nextProjected = vertex.worldMatrix * uVP * vec4( npos, 1.0 );
    vec2 currentScreen = currentProjected.xy / currentProjected.w;
    vec2 nextScreen = nextProjected.xy / nextProjected.w;
    vec2 sub = normalize(nextScreen - currentScreen);

    if(id > 95) {
        vec4 prevProjected = vertex.worldMatrix * uVP * vec4( ppos, 1.0 );
        vec2 prevScreen = prevProjected.xy / prevProjected.w;
        sub = normalize(currentScreen - prevScreen);
    }

    distN = smoothstep(uSpeedThreshold() - 0.01, uSpeedThreshold(), distance(pos, npos)) * smoothstep(uSpeedThreshold() - 0.01, uSpeedThreshold(), distance(pos, ppos));

    vec2 normal = vec2(-sub.y, sub.x);
    distD = smoothstep(0.0, 0.1, uSpeed());
    normal *= (thickness() * distD)/2.0;

    vec4 proj = vertex.worldMatrix * vec4( pos, 1.0 );
    vertex.worldPos.xyz = proj.xyz / proj.w;
    float border = mix(1.0, smoothstep(0., 0.1, vTexCoord0.y) * smoothstep(1., 0.9, vTexCoord0.y), uMixBorder());
    gl_Position = uVP * vec4(vertex.worldPos.xyz, 1.0) + uViewMatrix * vec4(vertex.position.x * normal * border, 0., 1.0);
{{= } }}

