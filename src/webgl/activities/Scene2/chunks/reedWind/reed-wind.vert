{{= if(obj.slot === 'vertex_warp_world' ){ }}
float windStrength = vertex.worldPos.y;
windStrength -= 0.3;
windStrength = max(windStrength, 0.0);
windStrength = pow(windStrength, 2.0);
windStrength *= 0.2;

float windOffset = sin(uTime() * .9 + vertex.worldPos.x + vertex.worldPos.z) * .5 + .5;
windOffset *= windStrength;

vertex.worldPos.x += windOffset;
{{= } }}