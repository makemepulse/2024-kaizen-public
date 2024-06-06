{{= if(obj.slot === 'f' ){ }}

vec2 stretchCoords = {{obj.originalVarying}};
stretchCoords.x = stretchCoords.x * uScrollStretch() - uScrollStretchOffset();
stretchCoords.x += uScrollOffset();
stretchCoords.x *= uScrollScale();
stretchCoords.x += uScrollTime();

{{= } }}
