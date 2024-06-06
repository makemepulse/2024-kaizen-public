{{= if(obj.slot === 'pv' ){ }}

IN vec3 aInstanceStartPosition;
IN vec3 aParams;

vec2 rotate(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, s, -s, c);
	return m * v;
}

{{= } }}

{{= if(obj.slot === 'vertex_warp' ){ }}

vec3 normalizedPos = normalize(aInstanceStartPosition);

float cornerX = vertex.position.x > 0. ? 1. : -1.;
float cornerZ = vertex.position.z > 0. ? 1. : -1.;

vec2 corners = vec2(cornerX, cornerZ);
corners = rotate(corners, sin(aParams.x * 3.1415 * aParams.z));
float scale = (1. - aParams.x) * aParams.y * .1;

vertex.position *= scale * 0.8;
{{= } }}

{{= if(obj.slot === 'vertex_warp_world' ){ }}


vec3 xyz = vertex.worldPos.xyz;

vertex.worldPos.xyz += (uCameraRight() * corners.x + uCameraUp() * corners.y) * scale;


vertex.worldPos.xyz = xyz;

vertex.worldPos.x += normalizedPos.x * aParams.x * aParams.y * 0.6;
vertex.worldPos.z += normalizedPos.z * aParams.x * aParams.y * 0.6;

vertex.worldPos.y += sin(aParams.x * 3.1415) * aParams.y * .2;

{{= } }}