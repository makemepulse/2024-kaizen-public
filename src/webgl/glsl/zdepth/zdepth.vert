{{= if(obj.slot === 'pv' ){ }}
    OUT float vDist;
{{= } }}

{{= if(obj.slot === 'postv' ){ }}

vec3 wPos = vWorldPosition;
vec3 camPos = CameraPos();

float dist = distance(camPos, wPos);
// dist = normalize(dist);

vDist = dist;

{{= } }}

