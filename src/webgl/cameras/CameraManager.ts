import Time from "@webgl/Time";
import Camera from "nanogl-camera";
import { ICameraLens } from "nanogl-camera/ICameraLens";
import { ICameraController } from "./ICameraController";


export default class CameraManager<T extends ICameraLens = ICameraLens> {
  private _active = false

  private _controler: ICameraController

  constructor( readonly camera: Camera<T> ){}

  setControler( ctrl:ICameraController ):void {
    this._controler?.stop()
    this._controler = ctrl;
    if( this._active )  ctrl?.start( this.camera );
  }

  start():void{
    if( !this._active ){
      this._active = true;
      this._controler?.start( this.camera );
    }
  }

  stop():void{
    if( this._active ){
      this._active = false;
      this._controler?.stop();
    }
  }

  preRender():void {
    this._controler?.update( Time.dt );
  }

}