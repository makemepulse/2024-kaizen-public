{{= if(obj.slot === 'pv' ){ }}

OUT vec2 vUv;

vec2 rotate(vec2 v, float a) {
	float s = sin(a);
	float c = cos(a);
	mat2 m = mat2(c, s, -s, c);
	return m * v;
}

{{= } }}

{{= if(obj.slot === 'vertex_warp_world' ){ }}

vertex.worldPos.xz = rotate(vertex.worldPos.xz, uSurfaceTime());

{{= } }}

{{= if(obj.slot === 'postv' ){ }}

vUv = vertex.position.xz;

{{= } }}