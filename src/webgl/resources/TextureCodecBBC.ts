import { ITextureCodec } from "./TextureCodec";
import { ITextureRequestSource } from "./TextureRequest";
import KTXParser from "./KTXParser";
import TextureData, { CompressedTextureData, TextureDataType, TextureMip } from "./TextureData";
import { TextureType } from "nanogl/texture-base";
import { GLContext } from "nanogl/types";
import Capabilities from "@webgl/core/Capabilities";



export abstract class TextureCodecBBC implements ITextureCodec {

  name: string;
  parser: KTXParser;

  constructor() {
    this.parser = new KTXParser();
  }

  abstract isSupported(gl:GLContext): Promise<boolean>;

  decodeLod(source: ITextureRequestSource, lod: number, buffers: ArrayBuffer[] ): Promise<TextureData> {

    const image = this.parser.parse(buffers[0]);
    const mips: TextureMip<ArrayBufferView>[] = image.surfaces[0].map(l => {
      return {
        width: image.width,
        height: image.height,
        data: l
      }
    });

    const datas: CompressedTextureData = {
      datatype: TextureDataType.RAW_COMPRESSED,
      textureType: TextureType.TEXTURE_2D,
      width: image.width,
      height: image.height,
      internalformat: image.internalFormat,
      format: image.format,
      type: image.type,
      requireMipmapGen :false,

      sources: [{
        surfaces: [mips]
      }]
    }

    return Promise.resolve(datas);

  }

  decodeCube(source : ITextureRequestSource, buffers: ArrayBuffer[]):Promise<TextureData> {
    const image = this.parser.parse(buffers[0]);

    const surfaces = image.surfaces.map(s => {
      return s.map(l => {
        return {
          width: image.width,
          height: image.height,
          data: l
        }
      })
    })

    const datas: CompressedTextureData = {
      datatype: TextureDataType.RAW_COMPRESSED,
      textureType: TextureType.TEXTURE_CUBE,
      width: image.width,
      height: image.height,
      internalformat: image.internalFormat,
      format: image.format,
      type: image.type,
      requireMipmapGen :false,

      sources: [{
        surfaces
      }]
    }

    return Promise.resolve(datas)
  }

}


export class TextureCodecDxt extends TextureCodecBBC {
  name: 'dxt' = 'dxt';
  isSupported(gl:GLContext): Promise<boolean> {
    return Promise.resolve(Capabilities(gl).textureExtensions.dxt != null);
  }
}


export class TextureCodecEtc extends TextureCodecBBC {
  name: 'etc' = 'etc';
  isSupported(gl:GLContext): Promise<boolean> {
    return Promise.resolve(Capabilities(gl).textureExtensions.etc != null);
  }
}


export class TextureCodecPvr extends TextureCodecBBC {
  name: 'pvr' = 'pvr';
  isSupported(gl:GLContext): Promise<boolean> {
    return Promise.resolve(Capabilities(gl).textureExtensions.pvr != null);
  }
}


export class TextureCodecAstc extends TextureCodecBBC {
  name: 'astc' = 'astc';
  isSupported(gl:GLContext): Promise<boolean> {
    return Promise.resolve(Capabilities(gl).textureExtensions.astc != null);
  }
}