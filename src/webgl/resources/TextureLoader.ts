
/// #if DEBUG
import TextureProfiler from '@webgl/dev/TexturesProfiler';
/// #endif


import { GLContext } from "nanogl/types";
import { TextureType, Texture } from "nanogl/texture-base";
import TextureData, { CompressedTextureData, cubeFaceForSurface, FaceIndex, UncompressedTextureData, TextureDataType, RawTextureData } from "./TextureData";
import { BaseTextureResource } from "./TextureResource";
import Texture2D from "nanogl/texture-2d";
import TextureCube from "nanogl/texture-cube";



export default class TexturesLoader {


  constructor(readonly gl: GLContext) {

  }


  upload(resource: BaseTextureResource, data: TextureData): void {

    const texture = resource.texture;

    if (texture.textureType !== data.textureType) {
      throw new Error("TexturesLoader::upload() texture type mismatch");
    }

    const lod = 0;
    texture.bind();

    /// #if DEBUG
    TextureProfiler.markPerfIn();
    /// #endif

    switch (texture.textureType) {
      case TextureType.TEXTURE_2D:
        this.uploadTexture2D(texture, data, lod);
        break;
      case TextureType.TEXTURE_CUBE:
        this.uploadTextureCube(texture, data, lod);
        break;
    }

    /// #if DEBUG
    TextureProfiler.markPerfOut();
    TextureProfiler.add(resource, data, lod );
    /// #endif
  }


  private uploadTexture2D(texture: Texture2D, data: TextureData, lod = 0) {
    this.uploadAllSurfaceLevels(texture, data, lod, 0, texture.textureType)
  }


  private uploadTextureCube(texture: TextureCube, data: TextureData, lod = 0) {
    for (let face = 0; face < 6; face++) {
      const faceTarget = cubeFaceForSurface(face as FaceIndex);
      this.uploadAllSurfaceLevels(texture, data, lod, face, faceTarget)
    }
  }


  private uploadAllSurfaceLevels(texture: Texture, data: TextureData, lod: number, surface: number, target: GLenum): void {
    switch (data.datatype) {
      case TextureDataType.RAW_COMPRESSED:
        this.uploadLevelsCompressed(texture, data, lod, surface, target);
        break;
      case TextureDataType.IMAGE:
        this.uploadLevels(texture, data, lod, surface, target);
        break
      case TextureDataType.RAW:
        this.uploadLevelsRaw(texture, data, lod, surface, target);
        break
      default:
        break;
    }
  }




  private uploadLevels(texture: Texture, data: UncompressedTextureData, lod: number, surface: number, target: GLenum): void {

    const source = data.sources[lod];
    const levels = source.surfaces[surface];

    texture.width  = levels[0].data.width
    texture.height = levels[0].data.height
    
    for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
      this.gl.texImage2D(target, levelIndex, data.internalformat, data.format, data.type, levels[levelIndex].data)
    }
  }

  private uploadLevelsRaw(texture: Texture, data: RawTextureData, lod: number, surface: number, target: GLenum): void {

    const source = data.sources[lod];
    const levels = source.surfaces[surface];

    texture.width  = levels[0].width
    texture.height = levels[0].height
    
    for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
      const level = levels[levelIndex];
      this.gl.texImage2D(target, levelIndex, data.internalformat, level.width, level.height, 0, data.format, data.type, level.data);
    }
  }

  private uploadLevelsCompressed(texture: Texture, data: CompressedTextureData, lod: number, surface: number, target: GLenum): void {

    const source = data.sources[lod];
    const levels = source.surfaces[surface];
    let w = levels[0].width
    let h = levels[0].height

    texture.width  = w
    texture.height = h

    for (let levelIndex = 0; levelIndex < levels.length; levelIndex++) {
      const level = levels[levelIndex];
      this.gl.compressedTexImage2D(target, levelIndex, data.internalformat, w, h, 0, level.data);
      w = Math.max(1, w >> 1);
      h = Math.max(1, h >> 1);
    }
  }


}