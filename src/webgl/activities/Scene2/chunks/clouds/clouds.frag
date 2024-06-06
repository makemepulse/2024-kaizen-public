{{= if(obj.slot === 'postf' ){ }}

FragColor.rgb *= uColor();
FragColor.a *= min(0.8, uOpacity());

{{= } }}