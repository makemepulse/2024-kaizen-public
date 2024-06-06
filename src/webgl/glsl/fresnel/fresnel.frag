{{= if(obj.slot === 'prelightsf' ){ }}

vec3 nrm = normalize(vWorldNormal);
float d = min(1.0, max( dot(geometryData.viewDir, nrm), 0.0 ));
float f = FresnelParams().z + pow(1.0 - d, FresnelParams().x) * FresnelParams().y;

surface.emission = FresnelColor() * f * FresnelIntensity();
surface.alpha = f * (FresnelIntensity());
//surface.albedo = vec3(0.0);
// surface.specular = vec3(0.0, 0.0, 0.0);
#if FresnelFadeUV
float progress = saturate(FresnelIntensity() * 55.0 - vTexCoord().x * 50.0);
surface.emission *= 1.0 - clamp(1.0 - progress, 0.0, 1.0);
#endif

{{= } }}

