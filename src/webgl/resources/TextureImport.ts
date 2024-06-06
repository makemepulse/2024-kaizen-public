import { TextureResource } from "./TextureResource";
import { ITextureRequest } from "./TextureRequest";
import { GLContext } from "nanogl/types";




// base class form webpack texture 
export default class TextureImport {

  _request : ITextureRequest;
  _resources: TextureResource[];

  constructor( request : ITextureRequest ){
    this._request   = request;
    this._resources = [];
  }


  createResource( gl : GLContext ) : TextureResource {
    const resource = new TextureResource(this._request, gl);
    this._resources.push( resource );
    return resource;
  }




  /// #if DEBUG


  hotReload():void{

    // this is a brand new instance with resources copied from old one

    console.log( 'hot ', this._request, this._resources );
    
    for (const resource of this._resources) {
      
      // def.lodPromises = new Array( def.baseUrl.length );
      // def.states      = []
      // for (var i = 0; i < def.baseUrl.length; i++) {
      //   def.states[i] = 1;
      // }
      // def.pendingUpload = null;
      
      // def.flipY();
      // def.nobbc();
      
      resource.unload();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (resource as any)._request = this._request;
      resource.doLoad();
    }
  }
  /// #endif
  
}