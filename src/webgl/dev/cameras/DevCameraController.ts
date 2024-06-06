import { ICameraController } from "@webgl/cameras/ICameraController";
import { quat, vec3, mat4 } from "gl-matrix";
import Camera from "nanogl-camera";
import PerspectiveLens from "nanogl-camera/perspective-lens";
import ControlScheme, { CameraMode } from "./ControlScheme";


const NULL_QUAT = quat.create()
const Q1        = quat.create()
const Q2        = quat.create()
const V1        = vec3.create();
const V2        = vec3.create();
const IMVP      = mat4.create();


const PAN_SENSITIVITY = 10;

function setMousePos( e:MouseEvent, el:Element, v3: vec3 ){
  v3[0] =   2 * e.clientX / window.innerWidth - 1
  v3[1] = -(2 * e.clientY / window.innerHeight - 1)
}


interface IBehaviour {
  start( camera:Camera, unprojPos:vec3, mouse:vec3 ):void
  update( mouse:vec3 ):void
}



class IdleAction implements IBehaviour {
  
  start(): void {
    0
  }
  update(): void {
    0
  }
}


class OrbitAction implements IBehaviour {
  
  cam: Camera;

  initialX  : vec3;
  initialR  : quat;
  initialP  : vec3;
  startMouse: vec3;
  focus     : vec3;

  constructor(private ctrl:DevCameraController){

    this.initialX   = vec3.create()
    this.initialR   = quat.create()
    this.initialP   = vec3.create()
    this.startMouse = vec3.create()
    this.focus      = vec3.create()

  }



  start(camera: Camera<PerspectiveLens>, unprojPos: vec3, mouse: vec3): void {
    this.cam = camera;
    vec3.copy( this.initialX, this.cam._matrix as Float32Array as vec3 );
    vec3.copy( this.startMouse, mouse );

    quat.copy( this.initialR, camera.rotation );
    vec3.subtract( this.initialP, camera.position, unprojPos );

    vec3.copy( this.focus,  unprojPos );

  }

  update( mouse : vec3 ) : void {

    vec3.subtract( V1, mouse, this.startMouse );

    quat.setAxisAngle( Q2, this.initialX, V1[1] * 5)
    quat.rotateY(      Q1, NULL_QUAT,     -V1[0] * 5);
    quat.multiply(     Q1, Q1, Q2 )

    quat.multiply( this.cam.rotation, Q1, this.initialR );
    vec3.transformQuat( V1, this.initialP, Q1 );
    vec3.add( this.cam.position, this.focus, V1 );
    
    this.cam.invalidate()

  }

}


class PanAction implements IBehaviour 
{

  cam: Camera;

  initialX: vec3;
  initialY: vec3;
  initialP: vec3;
  startMouse: vec3;
  focus: vec3;


  constructor(private ctrl:DevCameraController){

    this.initialX   = vec3.create()
    this.initialY   = vec3.create()
    this.initialP   = vec3.create()
    this.startMouse = vec3.create()
    this.focus      = vec3.create()

  }



  start( camera: Camera, unprojPos: vec3, mouse: vec3): void {
    this.cam = camera;
    vec3.copy( this.initialX,  this.cam._matrix as Float32Array as vec3 );
    vec3.copy( this.initialP,  this.cam.position );
    this.initialY[0] = this.cam._matrix[4];
    this.initialY[1] = this.cam._matrix[5];
    this.initialY[2] = this.cam._matrix[6];
    vec3.copy( this.startMouse, mouse );
    vec3.copy( this.focus,      unprojPos );

  }

  update( mouse : vec3 ){

    vec3.subtract( V1, mouse, this.startMouse );

    vec3.scale( V2, this.initialX, -V1[0] * PAN_SENSITIVITY )
    vec3.scaleAndAdd( V2, V2, this.initialY, -V1[1] * PAN_SENSITIVITY )


    vec3.add( this.cam.position, this.initialP, V2 );

    this.cam.invalidate()

  }

}


class DollyAction implements IBehaviour {
  
  cam : Camera;

  initialZ  : vec3;
  initialP  : vec3;
  startMouse: vec3;
  focus     : vec3;
  

  constructor( private ctrl:DevCameraController){

    this.initialZ   = vec3.create()
    this.initialP   = vec3.create()
    this.startMouse = vec3.create()
    this.focus      = vec3.create()

  }



  start( camera: Camera, unprojPos: vec3, mouse: vec3): void {
    this.cam = camera;
    vec3.copy( this.initialP,  this.cam.position );
    vec3.subtract( this.initialZ, this.cam.position, unprojPos );
    vec3.copy( this.startMouse, mouse );
    vec3.copy( this.focus,      unprojPos );

  }

  update( mouse : vec3 ){

    vec3.subtract( V1, mouse, this.startMouse );
    const flip = this.ctrl.controlScheme.inverseDolly ? -1 : 1;
    vec3.scale( V1, this.initialZ, V1[1] * 5 * flip)
    vec3.add( this.cam.position, this.initialP, V1 );

    this.cam.invalidate()

  }

}


export default class DevCameraController implements ICameraController {

  el         : HTMLElement;
  mouse      : vec3   ;
  cam        : Camera<PerspectiveLens> ;
  mode       : CameraMode   ;
  action     : IBehaviour;

  controlScheme:ControlScheme
  
  orbitRadius: number ;

  constructor( el : HTMLElement ){
    this.el = el;
    this.mouse       = vec3.fromValues(0, 0, 1);
    this.cam         = null;
    this.orbitRadius = -30;
    this.mode        = CameraMode.NONE;
  }


  start( cam : Camera ): void {
    this.cam = cam as Camera<PerspectiveLens>;
    this.cam.updateWorldMatrix()
    this.orbitRadius = -vec3.length(this.cam._wposition as vec3)
    this.el.addEventListener( 'mousemove', this.onMouseMove );
    this.mode        = -1;
    this.setMode( CameraMode.IDLE )
  }


  stop():void{
    this.cam = null;
    this.el.removeEventListener( 'mousemove', this.onMouseMove );
  }


  update( dt:number ):void{
    // noop
    dt
  }


  setMode( mode:CameraMode ):void {
    if( this.mode === mode ) return;
    this.mode = mode;
    switch( mode ){
      case CameraMode.IDLE :
        this.action = new IdleAction()
        break;
      case CameraMode.ORBIT :
        this.action = new OrbitAction(this)
        break;
      case CameraMode.PAN :
        this.action = new PanAction(this)
        break;
      case CameraMode.DOLLY :
        this.action = new DollyAction(this)
        break;
    }

    this.unproject( V1 );
    this.action.start( this.cam, V1, this.mouse )

  }

  unproject( out:vec3 ):void {
    this.cam.updateMatrix()
    mat4.invert( IMVP, this.cam.lens._proj );
    vec3.transformMat4( V1, this.mouse, IMVP );
    const orbitRadius = -vec3.length(this.cam._wposition as vec3)
    vec3.scale( V1, V1, orbitRadius / V1[2] );
    vec3.transformMat4( out, V1, this.cam._matrix );
  }



  onMouseMove = ( e:MouseEvent ):void =>{
    const mode = this.controlScheme?.getModeForEvt(e) ?? CameraMode.IDLE;
    this.setMode( mode );
    setMousePos( e, this.el, this.mouse );
    this.action.update( this.mouse );
  }


}




