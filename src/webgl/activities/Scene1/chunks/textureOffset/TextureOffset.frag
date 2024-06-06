{{= if(obj.slot === 'pf' ){ }}
{{= } }}

{{= if(obj.slot === 'f' ){ }}
    vec2 uvStretching = vec2(0.5, 1.0);
    vec2 offsetCoords = ({{obj.originalVarying}} * uvStretching) + vec2(0.5 * vRenderable, 0.0);
    vec2 customCoords = offsetCoords;
{{= } }}

{{= if(obj.slot === 'postf' ){ }}

{{= } }}