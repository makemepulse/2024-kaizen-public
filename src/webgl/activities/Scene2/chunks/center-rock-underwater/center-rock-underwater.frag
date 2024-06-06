{{= if(obj.slot === 'pf' ){ }}

IN float vDepth;

{{= } }}

{{= if(obj.slot === 'postf' ){ }}

FragColor.rgb = mix(FragColor.rgb, vec3(111. / 255., 168. / 255., 137. / 255.), vDepth);

{{= } }}