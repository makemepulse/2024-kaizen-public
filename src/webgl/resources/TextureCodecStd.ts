import { ITextureCodec } from "./TextureCodec";
import { ITextureOptions, ITextureRequestSource } from "./TextureRequest";
import { TextureType } from "nanogl/texture-base";
import Deferred from "@/core/Deferred";
import TextureData, { TextureDataType, TextureMip } from "./TextureData";


const _HAS_CIB : boolean = (navigator.userAgent.indexOf("Chrome") !== -1) && ( window.createImageBitmap !== undefined );

function getImageType( bytes:ArrayBuffer ){
  const H = new Uint32Array( bytes, 0, 2 );
  if( H[0] === 0x474e5089 ){
    return 'image/png';
  }
  return 'image/jpeg'
}





export default class TextureCodecStd implements ITextureCodec {
  
  name = 'std';

  decodeImage( bytes:ArrayBuffer ) : Promise<HTMLImageElement|ImageBitmap> {
    const imageType : string = getImageType(bytes);
    return TextureCodecStd.decodeImage(bytes, imageType)
  }
  
  static decodeImage( bytes:ArrayBuffer, mime?: string  ) : Promise<HTMLImageElement|ImageBitmap> {

    if( mime == undefined ){
      mime = getImageType(bytes);
    }

    const blob = new Blob( [bytes] , { type: mime });
    
    if( _HAS_CIB )
    {
      return createImageBitmap( blob, {premultiplyAlpha:'none'} );
    } else 
    {
      
      const def = new Deferred();
      const src = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload  = def.resolve;
      img.onerror = def.reject;
      img.src = src;
      
      def.promise.finally( ()=>URL.revokeObjectURL(src) )

      return def.promise.then( ()=>img );

    }

  }





  async decodeLod(source: ITextureRequestSource, lod: number, buffers: ArrayBuffer[], options: ITextureOptions): Promise<TextureData> {


    const image = await this.decodeImage( buffers[0] );

    const mip : TextureMip<TexImageSource> = {
      width  : image.width,
      height : image.height,
      data : image
    }
    
    const fmt = options.alpha ? 0x1908 : 0x1907;

    return {
      datatype       : TextureDataType.IMAGE ,
      format         : fmt                   , // RGB || RGBA
      internalformat : fmt                   , // RGB || RGBA
      type           : 0x1401                , // unsigned byte
      textureType    : TextureType.TEXTURE_2D,
      width          : image.width           ,
      height         : image.height          ,
      requireMipmapGen : options.mipmap,
      
      sources : [{
        surfaces : [[mip]]
      }]
    } 


  }

  /**
   * 
   * @param source the request source
   * @param buffers the files for faces/miplevels, must be a multiple of 6 in format face+X/l0, face-X/l0, face+Y/l0, face-Y/l0, face+Z/l0, face-Z/l0, face+X/l1, face-X/l1, face+Y/l1, face-Y/l1, face+Z/l1, face-Z/l1, ...
   * @param options 
   * @returns 
   */
  async decodeCube(source: ITextureRequestSource, buffers: ArrayBuffer[], options: ITextureOptions) : Promise<TextureData>{

    const fmt = options.alpha ? 0x1908 : 0x1907;

    const datas:TextureData = {
      
      requireMipmapGen : options.mipmap,
      datatype         : TextureDataType.IMAGE ,
      format           : fmt                , // RGB
      internalformat   : fmt                , // RGB
      type             : 0x1401                , // unsigned byte
      textureType      : TextureType.TEXTURE_CUBE,
      width            : 1024                  ,
      height           : 1024                  ,

      sources : [{
        surfaces : []
      }]
    } 

    const mips = buffers.length / 6;
    if( mips !== Math.floor(mips) ){
      throw new Error(`${buffers.length} is invalid number of buffers for cube texture, must be a multiple of 6`);
    }

    datas.sources[0].surfaces = [[], [], [], [], [], []];

    for (let mip = 0; mip < mips; mip++) {
      
      for(let face = 0; face < 6; face++){
        
        const image = await this.decodeImage( buffers[face+mip*6] );
        
        const img : TextureMip<TexImageSource> = {
          width  : image.width,
          height : image.height,
          data : image
        }
        
        datas.sources[0].surfaces[face].push(img);
        
      }
    }

    return Promise.resolve(datas)

  }


  isSupported(): Promise<boolean> {
    return Promise.resolve(true);
  }
  
}




import { webpSupport } from "nanogl-gltf/lib/extensions/EXT_texture_webp/webpSupport";

export class TextureCodecWebp extends TextureCodecStd implements ITextureCodec {
  

  name: 'webp' = 'webp';

  isSupported(): Promise<boolean> {
    return webpSupport()
  }
}
