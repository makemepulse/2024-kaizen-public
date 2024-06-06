{{= if(obj.slot === 'pv' ){ }}

IN vec2 aTexCoord1;
OUT vec2 vMossCoords;

{{= } }}

{{= if(obj.slot === 'postv' ){ }}

vMossCoords = aTexCoord1;

{{= } }}