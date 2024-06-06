import { Texture } from "nanogl/texture-base";
import { Resource, ResourceState } from "./Resource";
import Texture2D from "nanogl/texture-2d";
import TextureCube from "nanogl/texture-cube";
import { ITextureRequest, ITextureOptions, resolveTextureOptions, TextureSrcSet, ITextureRequestLod } from "./TextureRequest";
import { BytesResource } from "./Net";
import { TextureCodecs } from "./TextureCodec";
import { GLContext } from "nanogl/types";
import TexturesLoader from "./TextureLoader";
import ResourceGroup, { ResourceOrGroup } from "./ResourceGroup";
import Capabilities from "@webgl/core/Capabilities";
import Deferred from "@/core/Deferred";
import { AbortController, AbortSignal } from "@azure/abort-controller";
import { isAbortError, throwIfAborted } from "@/core/AbortSignalUtils";
import { cubeFaceForSurface, FaceIndex } from "./TextureData";




export abstract class BaseTextureResource<T extends Texture = Texture> extends Resource<T> {

  protected _texture: T = null

  get texture(): T{
    return this._texture;
  }

  readonly gl: GLContext;

  protected _request: ITextureRequest;
  protected _options: ITextureOptions;
  private _sourceGroup : ResourceGroup<ArrayBuffer> 

  protected _loadLevelDeferred: Deferred<T>
  private _loadLevelAbortCtrl : AbortController

  private _lodLevel = 0;
  public get lodLevel() {
    return this._lodLevel;
  }
  public set lodLevel(value) {
    if( this._lodLevel !== value ){
      this._lodLevel = value;
      if( this.state !== ResourceState.UNLOADED ){
        this._doLoadLevel( value )
      }
    }
  }
  
  // readonly options : TextureOptions



  static _tlmap : WeakMap<GLContext, TexturesLoader> = new WeakMap()
  static getTextureLoader( gl:GLContext ) : TexturesLoader {
    let res = this._tlmap.get( gl );
    if( !res ){
      res = new TexturesLoader( gl )
      this._tlmap.set( gl, res );
    }
    return res;
  }


  constructor(request: ITextureRequest | string, gl: GLContext, options?: Partial<ITextureOptions> ) {
    super();
    this.gl = gl;
    if( typeof request === 'string' ){
      request = new TextureSrcSet( request )
    }
    this._request = request;
    this._options = resolveTextureOptions( options )
    this._texture = this.createTexture()
  }

  get request() : ITextureRequest {
    return this._request;
  }

  get value(): T {
    return this._texture;
  }


  doLoad(): Promise<T> {
    this._loadLevelDeferred = new Deferred<T>()
    // loadLevelAsync can abort if lodLevel if changed mid air
    this._doLoadLevel( this._lodLevel );
    return this._loadLevelDeferred.promise
  }
  
  doUnload():void  {
    this.resetTexture()
    // this._texture.dispose()
    // this._texture = this.createTexture();
    this._sourceGroup?.unload()
  }



  private _doLoadLevel(level: number): void {
    this._loadLevelAbortCtrl?.abort()
    this._loadLevelAbortCtrl = new AbortController( this.abortSignal )
    this.loadLevelAsync( level, this._loadLevelAbortCtrl.signal )
      .then ( this._loadLevelDeferred.resolve )
      .catch( this._loadLevelDeferred.reject )
  }


  protected async loadLevelAsync(level: number, signal:AbortSignal): Promise<T> {


    const gl = this.gl 
    const loader = BaseTextureResource.getTextureLoader( gl );

    // find which source is available based on codecs and extensions
    //
    const cres = await TextureCodecs.getCodecForRequest(this._request, gl );
    throwIfAborted(signal)

    if( cres === null ){
      throw `can't find codecs for request ${JSON.stringify(this._request) }`
    }
    const [codec, source] = cres

    // load files for a given request source based on lod, set buffers
    const buffers = await this.loadSourceLod(source.lods[level], signal);
    // run codec to create or setup TextureData
    try {

      // take buffers , set datas
      const textureDatas = await codec.decodeLod(source, level, buffers, this._options, gl);
      throwIfAborted(signal)

      // use texture loader to upload data to texture
      loader.upload(this as unknown as BaseTextureResource<Texture>, textureDatas);

    } catch(e){
      if( !isAbortError(e) ){
        console.error( `can't decode `, source );
      }
      throw e
    }

    this._applyFilter()
    this._applyAnisotropy()
    this._applyWrapping()
    
    return this._texture;

  }
  /**
   * mark this texture as transparent. Must be called before loading
   */
  setTransparent(): this {
    if( this.state !== ResourceState.UNLOADED ){
      throw "setTransparent() can't be call on loaded resource"
    }
    this._options.alpha = true
    return this
  }

  /**
   * mark this texture as opaque. Must be called before loading
   */
  setOpaque(): this {
    if( this.state !== ResourceState.UNLOADED ){
      throw "setOpaque() can't be call on loaded resource"
    }
    this._options.alpha = false
    return this
  }


  setFilter( smooth = false, mipmap = false, miplinear = false ): this {
    const opts = this._options
    opts.smooth = smooth;
    opts.mipmap = mipmap;
    opts.miplinear = miplinear;
    this._applyFilter()
    return this
  }

  setAnisotropy(aniso: 0|2|4|8|16): this {
    this._options.aniso = aniso;
    this._applyAnisotropy()
    return this
  }

  clamp(): this {
    this._options.wrap = 'clamp'
    this._applyWrapping()
    return this
  }
  
  repeat(): this {
    this._options.wrap = 'repeat'
    this._applyWrapping()
    return this
  }
  
  mirror(): this {
    this._options.wrap = 'mirror'
    this._applyWrapping()
    return this
  }


  private _applyFilter():void {
    const options = this._options
    this._texture.setFilter( options.smooth, options.mipmap, options.miplinear )

    if( options.mipmap === true ){
      this.gl.generateMipmap(this._texture._target)
    }
  }

  private _applyAnisotropy():void {
    const options = this._options
    const gl = this.gl
    const aniso = Math.min( Capabilities(gl).maxAnisotropy , options.aniso )
    if( aniso > 0 ){
      gl.texParameterf( gl.TEXTURE_2D, Capabilities(gl).extAniso.TEXTURE_MAX_ANISOTROPY_EXT, aniso );
    }
  }

  private _applyWrapping():void {
    switch( this._options.wrap ){
      case 'clamp' : this._texture. clamp(); break;
      case 'repeat': this._texture.repeat(); break;
      case 'mirror': this._texture.mirror(); break;
    }
  }


  protected async loadSourceLod(lod: ITextureRequestLod, signal:AbortSignal ): Promise<ArrayBuffer[]> {

    this._sourceGroup?.unload()

    this._sourceGroup = new ResourceGroup()

    for (let i = 0; i < lod.files.length; i++) {
      const res = new BytesResource(lod.files[i]);
      this._sourceGroup.add( res as ResourceOrGroup<ArrayBuffer>)
    }

    const buffers = await this._sourceGroup.load( signal );
    return buffers;
  }

  abstract createTexture():T;
  abstract resetTexture():void;

}


export class TextureResource extends BaseTextureResource<Texture2D> {
  
  createTexture(): Texture2D {
    return new Texture2D(this.gl);
  }

  resetTexture(): void {
    const gl = this.gl
    gl.bindTexture(gl.TEXTURE_2D, this.texture.id);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
  }

}



export class TextureCubeResource extends BaseTextureResource<TextureCube> {

  createTexture(): TextureCube {
    return new TextureCube(this.gl);
  }

  resetTexture(): void {
    const gl = this.gl
    for (let face = 0; face < 6; face++) {
      const faceTarget = cubeFaceForSurface(face as FaceIndex);
      gl.texImage2D(faceTarget, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, null);
    }
  }

  async loadLevelAsync(level: number, signal:AbortSignal): Promise<TextureCube> {

    const gl = this.gl 
    const options = resolveTextureOptions( this._options )
    const loader = BaseTextureResource.getTextureLoader( gl );
    // find which source is available based on codecs and extensions
    // TODO: test if null
    const [codec, source] = await TextureCodecs.getCodecForRequest(this._request, gl);


    const buffers = await this.loadSourceLod(source.lods[level], signal)
    // run codec to create or setup TextureData
    const datas = await codec.decodeCube(source, buffers, options, gl);
    throwIfAborted(signal)
    // use texture loader to upload data to texture
    loader.upload(this as unknown as BaseTextureResource<Texture>, datas);


    //
    return this._texture;

  }

}