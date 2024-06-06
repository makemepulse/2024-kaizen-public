import Deferred from "@/core/Deferred";
import PublicPath from "@/core/PublicPath";
import Texture2D from "nanogl/texture-2d";
import { GLContext } from "nanogl/types";
import { DecodingError, DecodingResponse, IBasisDecoder, SupportedFormats, WorkerResponse } from "./types";


/**
 * type guard check if WorkerResponse is DecodingError
 */
function responseIsError(res: WorkerResponse): res is DecodingError {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (res as any).error !== undefined;
}

class PendingDecodingRequest {

  url: string;
  deferred: Deferred<DecodingResponse>;

  get promise(): Promise<DecodingResponse>{
    return this.deferred.promise;
  }

  constructor() {
    this.deferred = new Deferred()
  }

}

export default class BasisDecoder implements IBasisDecoder {
  

  private static _instance : BasisDecoder;
  static getInstance( ) : BasisDecoder {
    if( this._instance === undefined ){
      this._instance = new BasisDecoder()
    }
    return this._instance
  }


  private pendingTextures: Record<number, PendingDecodingRequest> = {};
  
  private nextPendingTextureId = 1;
  private allowSeparateAlpha = false;
  private worker: Worker;

  
  constructor( workerUrl?: string ) {

    if( workerUrl === undefined ){
      workerUrl = PublicPath("js/basis.worker.js");
    }
    this.worker = new Worker( workerUrl );

    this.worker.onmessage = (msg : MessageEvent<WorkerResponse>) => {

      // Find the pending texture associated with the data we just received
      // from the worker.
      
      const response = msg.data;
      const pendingTexture = this.pendingTextures[msg.data.id];
      if (!pendingTexture) {
        if (responseIsError(response)) {
          console.error(`Basis transcode failed: ${response.error}`);
        }
        console.error(`Invalid pending texture ID: ${response.id}`);
        return;
      }

      // Remove the pending texture from the waiting list.
      delete this.pendingTextures[response.id];

      // If the worker indicated an error has occured handle it now.
      if (responseIsError(response)) {
        console.error(`Basis transcode failed: ${response.error}`);
        pendingTexture.deferred.reject(`${response.error}`);
        return;
      } else {
        pendingTexture.deferred.resolve( response );
      }

    };
  }


  decode(gl : GLContext, buffer: ArrayBuffer) : Promise<DecodingResponse> {
    const pendingTexture = new PendingDecodingRequest();
    this.pendingTextures[this.nextPendingTextureId] = pendingTexture;
    
    this.worker.postMessage({
      id: this.nextPendingTextureId,
      buffer: buffer,
      allowSeparateAlpha: this.allowSeparateAlpha,
      supportedFormats: getSupportedFormats(gl)
    }, [buffer]);

    this.nextPendingTextureId++;
    return pendingTexture.promise;
  }


  static setupTexture(data: DecodingResponse, texture: Texture2D): void {

    const gl = texture.gl;
    const {
      buffer, 
      webglFormat,
      mipLevels
     } = data


    gl.bindTexture(gl.TEXTURE_2D, texture.id);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mipLevels.length > 1 || webglFormat.uncompressed ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);

    let levelData = null;

    texture.width = data.mipLevels[0].width;
    texture.height = data.mipLevels[0].height;

    for (const mipLevel of mipLevels) {

      if (!webglFormat.uncompressed) {

        levelData = new Uint8Array(buffer, mipLevel.offset, mipLevel.size);
        gl.compressedTexImage2D(
          gl.TEXTURE_2D,
          mipLevel.level,
          webglFormat.format,
          mipLevel.width,
          mipLevel.height,
          0,
          levelData);

      } else {

        switch (webglFormat.type) {
          case WebGLRenderingContext.UNSIGNED_SHORT_4_4_4_4:
          case WebGLRenderingContext.UNSIGNED_SHORT_5_5_5_1:
          case WebGLRenderingContext.UNSIGNED_SHORT_5_6_5:
            levelData = new Uint16Array(buffer, mipLevel.offset, mipLevel.size / 2);
            break;
          default:
            levelData = new Uint8Array(buffer, mipLevel.offset, mipLevel.size);
            break;
        }
        gl.texImage2D(
          gl.TEXTURE_2D,
          mipLevel.level,
          webglFormat.format,
          mipLevel.width,
          mipLevel.height,
          0,
          webglFormat.format,
          webglFormat.type,
          levelData);
      }
    }

    // if (webglFormat.uncompressed && mipLevels.length == 1) {
    //   gl.generateMipmap(gl.TEXTURE_2D);
    // }

  }



}


function getSupportedFormats(gl: GLContext): SupportedFormats {
  return {
    s3tc:  !!gl.getExtension('WEBGL_compressed_texture_s3tc'),
    etc1:  !!gl.getExtension('WEBGL_compressed_texture_etc1'),
    etc2:  !!gl.getExtension('WEBGL_compressed_texture_etc'),
    pvrtc: !!gl.getExtension('WEBGL_compressed_texture_pvrtc'),
    astc:  !!gl.getExtension('WEBGL_compressed_texture_astc'),
    bptc:  !!gl.getExtension('EXT_texture_compression_bptc')
  };
}

