import Material, { IMaterial } from "nanogl-gltf/lib/elements/Material";
import UnlitMaterial from "nanogl-gltf/lib/extensions/KHR_materials_unlit/UnlitMaterial";
import { MetalnessSurface, SpecularSurface } from "nanogl-pbr/PbrSurface";


export function materialIsStandard( m:IMaterial ): m is Material {
  return ( m instanceof Material )
}

export function materialIsStandardMetalness( m:IMaterial ): m is Material {
  if( materialIsStandard( m )){
    return m.materialPass.surface instanceof MetalnessSurface
  }
  return false
}


export function materialIsStandardSpecular( m:IMaterial ): m is Material {
  if( materialIsStandard( m )){
    return m.materialPass.surface instanceof SpecularSurface
  }
  return false
}

export function materialIsUnlit( m:IMaterial ): m is UnlitMaterial {
  return ( m instanceof UnlitMaterial )
}
