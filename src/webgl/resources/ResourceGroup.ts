/* eslint-disable @typescript-eslint/ban-ts-comment */
import { InternalResourceHelper as IRH, Resource } from "./Resource";


export type ResourceOrGroup<T> = Resource<T> | Resource<T[]> 


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default class ResourceGroup<T=any> extends Resource<T[]> {

  static readonly default : ResourceGroup = new ResourceGroup();

  readonly name : string;
  
  private _resources : ResourceOrGroup<T>[];
  private _resourcesMap  : Map<string, ResourceOrGroup<T>>;


  constructor(){
    super()
    this.name = '';

    this._resourcesMap  = new Map();
    this._resources = [];

  }


  async doLoad(): Promise<T[]> {
    const _all: Promise<T[]|T>[] = this._resources.map( r=>IRH.loadResource(r, this.abortSignal) );
    try{
      const b = await Promise.all(_all);
      if( !this.isPending && this._resources.some(r=>!r.isComplete) ){
        return this.doLoad();
      } else {
        return b.flat() as T[];
      }
    } catch(e){
      // if a resource has been removed during loading
      if( !this.isPending && e === "cancelled" ){
        return this.doLoad()
      }
      throw e
    }
  }
  
  doUnload(): void {
    this._resources.forEach( IRH.unloadResource );
  }


                                                
  //   _ __ ___  ___  ___  _   _ _ __ ___ ___  ___ 
  //  | '__/ _ \/ __|/ _ \| | | | '__/ __/ _ \/ __|
  //  | | |  __/\__ \ (_) | |_| | | | (_|  __/\__ \
  //  |_|  \___||___/\___/ \__,_|_|  \___\___||___/
                                                
  add( resource : ResourceOrGroup<T>, name?:string ) : void {
    
    if( name && this._resourcesMap.has( name ) ){
      throw new Error( `ResourceGroup::addResource() resource '${name}' already exist` );
    }

    if( resource.isControlled ){
      throw new Error( `ResourceGroup::addResource() resource is already in a group` );
    }

    IRH.markControlled( resource, true )

    
    this._resources.push( resource );
    if( name ) this._resourcesMap.set( name, resource );

    if( this.isPending ) {

      IRH.unloadResource( resource )
    } else {
      IRH.loadResource( resource, this.abortSignal )
    }

    if( this.isLoaded ){
      IRH.resetResource(this)
      this.load()
    }
    
  }

  remove( resource : Resource<T> ) : void {
    // @ts-ignore
    const i = this._resources.indexOf( resource );
    if( i>-1 ){
      this._resources.splice(i,1);
      
      for (const k of this._resourcesMap.keys() ) {
        if( this._resourcesMap.get(k) === resource )
          this._resourcesMap.delete(k)
      }

      IRH.unloadResource( resource );
      IRH.markControlled( resource, false )

      if( this.isLoaded ){
        IRH.resetResource(this)
        this.load()
      }
    }
  }

  removeByName( name : string ) : void {
    this.remove(this.getResource(name));
  }


  getResource<U extends T = T>( name : string ) : Resource<U> {
    const res = this._resourcesMap.get(name);
    if( res === undefined ){
      throw new Error( `ResourceGroup::getResource() resource with name ${name} doesn't exist` );
    }

    // @ts-ignore
    return res as Resource<U>;
  }

  get( name:string ) : T {
    return this.getResource(name).value;
  }


  hasResource(name:string) : boolean{
    return this._resourcesMap.get(name) !== undefined;
  }

}


