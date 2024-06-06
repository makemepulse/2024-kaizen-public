{{= if(obj.slot === 'pv' ){ }}
#if __VERSION__ == 300
    #define texture2D(a, b) texture( a, b )
#endif

mat4 rotationY(in float angle) {
	return mat4(cos(angle),	0, sin(angle), 0,
			 	0, 1.0, 0, 0,
				-sin(angle), 0, cos(angle),	0,
				0, 0, 0, 1);
}

{{= } }}

{{= if(obj.slot === 'vertex_warp' ){ }}

float noiseAngle = texture2D(noiseTex, vec2(uRotateTime() * 0.008 + uRotateSeed())).r * 0.5 - 0.25;

vec4 pos = vec4(vertex.position, 1.0);
pos *= rotationY(noiseAngle);

vertex.position.xyz = pos.xyz;

{{= } }}