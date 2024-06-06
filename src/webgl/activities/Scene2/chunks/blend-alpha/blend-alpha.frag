{{= if(obj.slot === 'postf' ){ }}

float opacity = step(uThreshold(), FragColor.a);

FragColor.a *= opacity * uOpacity() * step(uShadowThreshold(), FragColor.g);

{{= } }}