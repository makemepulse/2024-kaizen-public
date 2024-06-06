

// type Listener<T> = (e?:T)=>void

type Callback<T> = (e:T)=>void
  

type Listener<T> = {
  cbk:Callback<T>
  once:boolean
}



export default class Signal<T = unknown> {

  private  _listeners: Listener<T>[];
  
  constructor(){
    this._listeners = [];
  }


  on( cbk : Callback<T>, once=false ): void{
    if( this._findListener(cbk) === -1 ){
      this._listeners.push( {cbk, once} );
    }
  }

  off( cbk : Callback<T> ): void{
    const i = this._findListener(cbk);
    if( i > -1 ){
      this._listeners.splice( i, 1 );
    }
  }

  release(): void{
    this._listeners = [];
  }

  emit( e:T ): void{
    
    for (const l of this._listeners) {
      l.cbk( e );
    }

    if( this._listeners.some( l=>l.once ) ){
      this._listeners = this._listeners.filter( l=>!l.once )
    }    

  }

  private _findListener( cbk : Callback<T> ) : number {
    return this._listeners.findIndex( l=>l.cbk === cbk )
  }

}
