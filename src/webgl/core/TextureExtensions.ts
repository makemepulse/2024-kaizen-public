import { GLContext } from "nanogl/types"


type WEBGL_compressed_texture_pvrtc = {
  readonly COMPRESSED_RGB_PVRTC_4BPPV1_IMG      : 0x8C00
  readonly COMPRESSED_RGB_PVRTC_2BPPV1_IMG      : 0x8C01
  readonly COMPRESSED_RGBA_PVRTC_4BPPV1_IMG     : 0x8C02
  readonly COMPRESSED_RGBA_PVRTC_2BPPV1_IMG     : 0x8C03
}


type WEBGL_compressed_texture_etc1 = {
  readonly COMPRESSED_RGB_ETC1_WEBGL : 0x8D64 
}



const DXT_EXTS = [
  'WEBGL_compressed_texture_s3tc',
  'MOZ_WEBGL_compressed_texture_s3tc',
  'WEBKIT_WEBGL_compressed_texture_s3tc',
] as const

const PVR_EXTS = [
  'WEBGL_compressed_texture_pvrtc',
  'WEBKIT_WEBGL_compressed_texture_pvrtc',
] as const

const ETC1_EXTS = [
  'WEBGL_compressed_texture_etc1',
  'WEBKIT_WEBGL_compressed_texture_etc1',
] as const

const ASTC_EXTS = [
  'WEBGL_compressed_texture_astc'
] as const

  

export default class TextureExtensions {

  readonly pvr      : WEBGL_compressed_texture_pvrtc
  readonly etc      : WEBGL_compressed_texture_etc1
  readonly astc     : WEBGL_compressed_texture_astc
  readonly dxt      : WEBGL_compressed_texture_s3tc



  constructor( readonly gl : GLContext ){

    this.pvr      = this.pickExtension( PVR_EXTS      );
    this.etc      = this.pickExtension( ETC1_EXTS     );
    this.astc     = this.pickExtension( ASTC_EXTS     );
    this.dxt      = this.pickExtension( DXT_EXTS      );
  }


  pickExtension( extnames : typeof PVR_EXTS      ) : WEBGL_compressed_texture_pvrtc     | null;
  pickExtension( extnames : typeof ETC1_EXTS     ) : WEBGL_compressed_texture_etc1      | null;
  pickExtension( extnames : typeof ASTC_EXTS     ) : WEBGL_compressed_texture_astc      | null;
  pickExtension( extnames : typeof DXT_EXTS      ) : WEBGL_compressed_texture_s3tc      | null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pickExtension( extnames : readonly string[] ) : any {
    let ext = null;
    for (const extStr of extnames) {
      ext = this.gl.getExtension( extStr );
      if( ext ) break;
    }
    return ext;
  }

  
}

