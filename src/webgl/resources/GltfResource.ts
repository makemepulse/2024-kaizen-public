import { Resource } from "./Resource";
import { WebImpl } from "nanogl-gltf/lib/io/web";
import { GltfLoaderOptions } from "nanogl-gltf/lib/io/GltfLoaderOptions";
import GltfLoader from "nanogl-gltf/lib/io/GltfLoader";
import Gltf from "nanogl-gltf/lib/Gltf";
import AssetDatabase from "./AssetDatabase";
import IOInterface from "nanogl-gltf/lib/io/IOInterface";
import { GLContext } from "nanogl/types";




class ModuleIO extends WebImpl {

  resolvePath(path: string, baseurl: string): string {
    
    if (this.isDataURI(path)) return path;
    if (baseurl !== undefined ){
      path =  baseurl + '/' + path;
    }
    return AssetDatabase.getAssetPath(decodeURI(path))
  }
  
  
}

export const _stdIO = new WebImpl();
export const _moduleIO = new ModuleIO();


export default class GltfResource extends Resource<Gltf>{

  private readonly _io : IOInterface

  get gltf(): Gltf {
    return this.value
  }

  constructor(protected request: string, protected gl: GLContext, protected opts: GltfLoaderOptions = {}, useModuleIO = true) {
    super()
    this._io = useModuleIO ? _moduleIO : _stdIO;
  }


  async doLoad(): Promise<Gltf> {
    const loader = new GltfLoader( this._io, this.request, {
      ...this.opts,
      abortSignal: this.abortSignal
    });

    const gltf = await loader.load();
    await gltf.allocate(this.gl)
    return gltf
  }

  doUnload(): void {
    0
  }




}
