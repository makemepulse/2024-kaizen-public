import Camera from "nanogl-camera";

export interface ICameraController {

    start( camera : Camera ):void
    stop():void
    update( dt : number ):void

}