/* eslint-disable @typescript-eslint/no-explicit-any */
import { catchAbortError } from "@/core/AbortSignalUtils";
import Deferred from "@/core/Deferred";
import { AbortController, AbortError, AbortSignal } from "@azure/abort-controller";


export enum ResourceState {
  UNLOADED,
  LOADING,
  LOADED,
  ERRORED,
}




export abstract class Resource<T = any>{

  private _value: T | null = null;

  private _deferred: Deferred<T>;
  
  protected _abortCtrl: AbortController;

  private _state : ResourceState = ResourceState.UNLOADED;

  private _isControlled = false;
  
  /**
   * true if this resources is added to a group
   * manual call to load() / unload() have no effect when resource is controlled
   */
  get isControlled():boolean{
    return this._isControlled;
  }


  constructor() {
    this._reset();
  }
  
  private _reset() : void {
    this._state = ResourceState.UNLOADED;
    this._value = null;
    this._deferred = new Deferred<T>();
    catchAbortError( this._deferred.promise );
  }
  
  
  get value(): T|null {
    return this._value;
  }

  get state():ResourceState { return this._state }
  
  get isLoaded ():boolean { return this._state === ResourceState.LOADED  }
  get isErrored():boolean { return this._state === ResourceState.ERRORED }
  get isPending():boolean { return this._state === ResourceState.UNLOADED }
  get isLoading():boolean { return this._state === ResourceState.LOADING }
  
  get isComplete() : boolean {
    return this.isErrored || this.isLoaded;
  }


  protected get abortSignal(): AbortSignal {
    return this._abortCtrl.signal
  }


  response(): Promise<T> {
    return this._deferred.promise;
  }


  
  public load( abortSignal: AbortSignal = AbortSignal.none ): Promise<T>{
    
    if( this.isControlled ){
      throw new Error(`Can't call load() on a controlled Resource`)
    }
    return this._load(abortSignal);
  }

  
  public unload(): void {
    if( this.isControlled ){
      throw new Error(`Can't call unload() on a controlled Resource`)
    }
    this._unload();
  }

  
  private _load( abortSignal: AbortSignal ): Promise<T> {
    
    if( this.isPending ){
      this._state = ResourceState.LOADING;

      this._abortCtrl?.signal.removeEventListener('abort', this._onAborted )
      this._abortCtrl = new AbortController(abortSignal);
      this._abortCtrl.signal.addEventListener('abort', this._onAborted )

      const deferred = this._deferred;
      
      this.doLoad().then( 
        
        // resolve
        // ! prevent resource state to be changed by old loadings
        v=>{ 
          if( deferred === this._deferred ){
            this._value = v; 
            this._state = ResourceState.LOADED;
            deferred.resolve(v) 
          }
        }, 

        // reject
        e=>{
          if( deferred === this._deferred ){
            this._state = ResourceState.ERRORED;
            deferred.reject(e);
          }
        }

      )

    }
    return this.response();
  }
  
  private _onAborted = ()=>{
    this._unload();
  }

  private _unload(): void {
    if( !this.isPending ){
      this.doUnload();
      this._deferred.reject(new AbortError());
      this._reset();
      this._abortCtrl.abort();
    }
  }


  /**
   * 
   */
  abstract doLoad(): Promise<T>;

  /**
   * Called when resource needs to be unloaded
   * state can ba anything but PENDING when this method is called
   */
  abstract doUnload(): void;



  protected setProgress():void {
    0
  }


  static all<T>( resources : Resource<T>[] ) : Promise<T[]> {
    return Promise.all( resources.map(r=>r.response()) )
  }

}



export class LambdaResource<T = any> extends Resource<T>{

  constructor(private _loadFunc: () => Promise<T>) {
    super();
  }

  doLoad(): Promise<T> {
    return this._loadFunc();
  }

  doUnload(): void {
    0
  }
}


/**
 * @internal
 */
export class InternalResourceHelper {

  static loadResource( r:Resource, abortSignal: AbortSignal ) : Promise<any> {
    return (r as any)._load( abortSignal )
  }

  static unloadResource( r:Resource ): void {
    (r as any)._unload()
  }

  static markControlled( r:Resource, value:boolean ): void {
    (r as any)._isControlled = value
  }

  static resetResource( r:Resource ): void {
    (r as any)._reset()
  }

}





