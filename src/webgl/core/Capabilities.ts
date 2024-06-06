import { GLContext, isWebgl2 } from "nanogl/types";
import getInstancingImplementation, { InstancingImpl } from "./Instancing";
import TextureExtensions from "./TextureExtensions";


function _hasPrecision( gl:GLContext, p : GLenum ): boolean {
  const hv = gl.getShaderPrecisionFormat( gl.VERTEX_SHADER,   p );
  const hf = gl.getShaderPrecisionFormat( gl.FRAGMENT_SHADER, p );
  return  hf.precision > 0 && hv.precision > 0;
}



export class CapabilitiesImpl {
  
  readonly isWebgl2:boolean
  readonly hasHighpPrecision:boolean
  readonly hasMediumpPrecision:boolean
  
  readonly textureExtensions: TextureExtensions
  readonly extAniso: EXT_texture_filter_anisotropic
  readonly extIndexUint: OES_element_index_uint
  
  readonly maxAnisotropy : number
  
  readonly instancing: InstancingImpl
  readonly standardDerivatives: OES_standard_derivatives;
  
  readonly hasStandardDerivatives:boolean
  
  readonly support32BitIndices:boolean


  
  constructor( gl:GLContext ){
    this.isWebgl2 = isWebgl2(gl)
    
    this.hasHighpPrecision   = _hasPrecision( gl, gl.HIGH_FLOAT   )
    this.hasMediumpPrecision = _hasPrecision( gl, gl.MEDIUM_FLOAT )
    
    this.textureExtensions = new TextureExtensions( gl )

    this.extAniso =
      gl.getExtension("EXT_texture_filter_anisotropic") ||
      gl.getExtension("MOZ_EXT_texture_filter_anisotropic") ||
      gl.getExtension("WEBKIT_EXT_texture_filter_anisotropic")

    this.extIndexUint = gl.getExtension('OES_element_index_uint');

    this.maxAnisotropy = (this.extAniso) ? gl.getParameter(this.extAniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT) : 0;

    this.instancing = getInstancingImplementation( gl )

    if( !this.isWebgl2 ){
      this.standardDerivatives = gl.getExtension('OES_standard_derivatives');
      this.hasStandardDerivatives = this.standardDerivatives !== null
      this.support32BitIndices = this.extIndexUint !== null
    } else {
      this.hasStandardDerivatives = true
      this.support32BitIndices = true;
    }
    
  }

  /// #if DEBUG
  report():void{

    console.log(`WebGL capabilities`)
    console.table({
      ['isWebgl2'              ]: this.isWebgl2                ,
      ['hasHighpPrecision'     ]: this.hasHighpPrecision       ,
      ['hasMediumpPrecision'   ]: this.hasMediumpPrecision     ,
      ['32bit indices'         ]: this.support32BitIndices     ,
      ['anisotropic filtering' ]: this.extAniso!==null         ,
      ['maxAnisotropy'         ]: this.maxAnisotropy           ,
      ['instancing'            ]: this.instancing.isSupported  ,
      ['hasStandardDerivatives']: this.hasStandardDerivatives  ,
      ['support32BitIndices'   ]: this.support32BitIndices     ,
      ['support DXT'           ]: this.textureExtensions.dxt  !== null ,
      ['support PVR'           ]: this.textureExtensions.pvr  !== null ,
      ['support ETC'           ]: this.textureExtensions.etc  !== null ,
      ['support ASTC'          ]: this.textureExtensions.astc !== null ,
    })
  }
  /// #else
  /// #code report():void{0;}
  /// #endif
}

const _instances = new WeakMap<GLContext, CapabilitiesImpl>()

export default function Capabilities(gl:GLContext ):CapabilitiesImpl {
  let res = _instances.get( gl )
  if( !res ){
    res = new CapabilitiesImpl(gl)
    _instances.set( gl, res )
  }
  return res
}