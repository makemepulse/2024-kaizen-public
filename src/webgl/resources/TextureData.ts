

type TextureSourceData = TexImageSource|ArrayBufferView;


export const enum CubeFace {
  TEXTURE_CUBE_MAP_POSITIVE_X    = 0x8515,
  TEXTURE_CUBE_MAP_NEGATIVE_X    = 0x8516,
  TEXTURE_CUBE_MAP_POSITIVE_Y    = 0x8517,
  TEXTURE_CUBE_MAP_NEGATIVE_Y    = 0x8518,
  TEXTURE_CUBE_MAP_POSITIVE_Z    = 0x8519,
  TEXTURE_CUBE_MAP_NEGATIVE_Z    = 0x851A,
}


export type FaceIndex = 0|1|2|3|4|5;


export function cubeFaceForSurface( i:FaceIndex ): CubeFace{
  switch( i ){
    case 0: return CubeFace.TEXTURE_CUBE_MAP_POSITIVE_X;
    case 1: return CubeFace.TEXTURE_CUBE_MAP_NEGATIVE_X;
    case 2: return CubeFace.TEXTURE_CUBE_MAP_POSITIVE_Y;
    case 3: return CubeFace.TEXTURE_CUBE_MAP_NEGATIVE_Y;
    case 4: return CubeFace.TEXTURE_CUBE_MAP_POSITIVE_Z;
    case 5: return CubeFace.TEXTURE_CUBE_MAP_NEGATIVE_Z;
  }
}

export function surfaceForCubeFace( face:CubeFace ): FaceIndex {
  switch( face ){
    case CubeFace.TEXTURE_CUBE_MAP_POSITIVE_X : return 0;
    case CubeFace.TEXTURE_CUBE_MAP_NEGATIVE_X : return 1;
    case CubeFace.TEXTURE_CUBE_MAP_POSITIVE_Y : return 2;
    case CubeFace.TEXTURE_CUBE_MAP_NEGATIVE_Y : return 3;
    case CubeFace.TEXTURE_CUBE_MAP_POSITIVE_Z : return 4;
    case CubeFace.TEXTURE_CUBE_MAP_NEGATIVE_Z : return 5;
  }
}


export interface TextureMip<T extends TextureSourceData=TextureSourceData> {
  width   : number
  height  : number
  data: T
}

export interface TextureSource<T extends TextureSourceData=TextureSourceData> {

  /*
   * for 2D   : [0][mips]
   * for Cube : [face][mips]
   * for 3D   : [depth][mips]
  */
  surfaces: TextureMip<T>[][]

}


export enum TextureDataType {
  RAW,
  RAW_COMPRESSED,
  IMAGE,
}

interface BaseTextureData {
  
  datatype : TextureDataType

  textureType : GLenum

  // dimension of the maximum lod level
  width   : number
  height  : number
  
  // gl texture formats
  format        : GLenum
  internalformat: GLint
  type          : GLenum

  requireMipmapGen : boolean
  
  /**
   * quality levels or lods
   */
  sources : TextureSource<ArrayBufferView|TexImageSource>[]
}


export interface CompressedTextureData extends BaseTextureData {
  datatype : TextureDataType.RAW_COMPRESSED
  sources : TextureSource<ArrayBufferView>[]
  requireMipmapGen : false
}


export interface UncompressedTextureData extends BaseTextureData {
  datatype : TextureDataType.IMAGE
  sources : TextureSource<TexImageSource>[]
}

export interface RawTextureData extends BaseTextureData {
  datatype : TextureDataType.RAW
  sources : TextureSource<ArrayBufferView>[]
}



type TextureData = CompressedTextureData | UncompressedTextureData | RawTextureData;


export default TextureData;

