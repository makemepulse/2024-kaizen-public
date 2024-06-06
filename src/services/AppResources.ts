import { ImageResource } from "@webgl/resources/Net";
import { Resource } from "@webgl/resources/Resource";

export default class AppResources {

  private _resources: Map<string, Resource> = new Map<string, Resource>();

  addImage(name: string, url: string) {

    const res = new ImageResource(url);
    this._resources.set(name, res);
    
  }

  remove(name: string){
    if(this._resources.has(name)){
      this._resources.delete(name);
    }
  }

  load(name: string): Promise<void> {
    return this._resources.get(name).load();
  }

  get<T extends Resource>(name: string): T {
    return this._resources.get(name) as T;
  }

  has(name: string): boolean {
    return this._resources.has(name);
  }

}