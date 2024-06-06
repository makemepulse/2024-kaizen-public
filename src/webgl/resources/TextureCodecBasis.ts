import { ITextureCodec } from "./TextureCodec";
import { ITextureRequestSource } from "./TextureRequest";
import { TextureType } from "nanogl/texture-base";
import TextureData, { TextureDataType, TextureMip } from "./TextureData";
import { GLContext } from "nanogl/types";
import BasisDecoder from "./basis/BasisDecoder";
import Capabilities from "@webgl/core/Capabilities";




export default class TextureCodecBasis implements ITextureCodec {
  
  name = 'basis';
  gl: GLContext;




  async decodeLod(source: ITextureRequestSource, lod: number, buffers: ArrayBuffer[]): Promise<TextureData> {


    const res = await BasisDecoder.getInstance().decode(this.gl, buffers[0])
    const mips: TextureMip<ArrayBufferView>[] = res.mipLevels.map(l => {
      return {
        width: l.width,
        height: l.height,
        data: new Uint8Array(res.buffer, l.offset, l.size)
      }
    });

    const datas: TextureData = {
      datatype: (res.webglFormat.uncompressed===true) ? TextureDataType.RAW: TextureDataType.RAW_COMPRESSED,
      textureType   : TextureType.TEXTURE_2D           ,
      width         : res.mipLevels[0].width ,
      height        : res.mipLevels[0].height,
      internalformat: res.webglFormat.format   ,
      format        : res.webglFormat.format   ,
      type          : res.webglFormat.type     ,

      requireMipmapGen :false,

      sources: [{
        surfaces: [mips]
      }]
    }

    return Promise.resolve(datas);

  }

  decodeCube():Promise<TextureData> {
    throw new Error("Method not implemented.");
  }

  isSupported( gl:GLContext): Promise<boolean> {
    this.gl = gl
    const textureExtensions = Capabilities(gl).textureExtensions
    const supported = 
      textureExtensions.dxt != null || 
      textureExtensions.etc != null || 
      textureExtensions.pvr != null
    return Promise.resolve(supported);
  }
  
}
