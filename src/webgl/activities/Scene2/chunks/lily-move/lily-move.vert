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

float noiseAngle = texture2D(tNoise, vec2(uTime() * 0.05)).r * 4. - 2.;

vec4 pos = vec4(vertex.position, 1.0);
pos *= rotationY(noiseAngle);

vertex.position.xyz = pos.xyz;

{{= } }}

{{= if(obj.slot === 'vertex_warp_world' ){ }}

float noiseX = texture2D(tNoise, vec2(uTime() * 0.08)).r * 1.6 - .9;
float noiseY = texture2D(tNoise, vec2(uTime() * 0.05 + 0.5)).r * 1.6 - .9;

vertex.worldPos.xz += vec2(noiseX, noiseY) * uMoveFactor();

{{= } }}