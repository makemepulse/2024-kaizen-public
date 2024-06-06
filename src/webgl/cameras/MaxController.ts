import { quat, vec3, mat4 } from "gl-matrix";
import Camera from "nanogl-camera";
import { ICameraController } from "./ICameraController";
import PerspectiveLens from "nanogl-camera/perspective-lens";


const NULL_QUAT = quat.create()
const Q1 = quat.create()
const Q2 = quat.create()
const V1 = vec3.create();
const V2 = vec3.create();
const MAT4 = mat4.create();
const IMVP = mat4.create();

const enum Mode {
  NONE = -1,
  IDLE = 0,
  ORBIT = 1,
  PAN = 2,
  DOLLY = 3,
}


const PAN_SENSITIVITY = 10;

function setMousePos(e: MouseEvent, el: HTMLCanvasElement, v3: vec3) {
  v3[0] = 2 * e.clientX / (el.width / window.devicePixelRatio) - 1
  v3[1] = -(2 * e.clientY / (el.height / window.devicePixelRatio) - 1)
}


interface IBehaviour {
  start(camera: Camera, unprojPos: vec3, mouse: vec3): void;
  update(mouse: vec3): void;
}



export default class CameraControl implements ICameraController {

  el: HTMLCanvasElement;
  mouse: vec3;
  cam: Camera<PerspectiveLens>;
  mode: Mode;
  action: IBehaviour;

  orbitRadius: number;

  constructor(el: HTMLCanvasElement) {
    this.el = el;
    this.mouse = vec3.fromValues(0, 0, 1);
    this.cam = null;
    this.orbitRadius = -1;
    this.mode = Mode.NONE;
  }


  start(cam: Camera) {
    this.cam = cam as Camera<PerspectiveLens>;
    this.cam.invalidate()
    this.cam.updateWorldMatrix()

    this.el.addEventListener('mousemove', this.onMouseMove);
    this.mode = -1;
    this.setMode(Mode.IDLE)
  }


  stop() {
    this.cam = null;
    this.el.removeEventListener('mousemove', this.onMouseMove);
  }


  update(dt: number) {
    // noop
  }


  setMode(mode: Mode) {
    if (this.mode === mode) return;
    this.mode = mode;
    switch (mode) {
      case Mode.IDLE:
        this.action = new IdleAction()
        break;
      case Mode.ORBIT:
        this.action = new OrbitAction()
        break;
      case Mode.PAN:
        this.action = new PanAction()
        break;
      case Mode.DOLLY:
        this.action = new DollyAction()
        break;
    }

    this.unproject(V1);
    this.action.start(this.cam, V1, this.mouse)

  }

  unproject(out: vec3) {
    this.cam.updateMatrix()
    mat4.invert(IMVP, this.cam.lens._proj);
    vec3.transformMat4(V1, this.mouse, IMVP);
    vec3.scale(V1, V1, this.orbitRadius / V1[2]);
    vec3.transformMat4(out, V1, this.cam._matrix);
  }



  onMouseMove = (e: MouseEvent) => {
    const mode = this._getModeForEvt(e)
    this.setMode(mode);
    setMousePos(e, this.el, this.mouse);
    this.action.update(this.mouse);
  }

  _getModeForEvt(e: MouseEvent): Mode {
    if (e.which !== 2) return Mode.IDLE
    if (e.altKey) {
      return e.ctrlKey ? Mode.DOLLY : Mode.ORBIT
    }
    return Mode.PAN;
  }

}




class IdleAction implements IBehaviour {
  start(camera: Camera<PerspectiveLens>, unprojPos: vec3, mouse: vec3): void { }
  update(mouse: vec3): void { }
}




class OrbitAction implements IBehaviour {

  cam: Camera;

  initialX: vec3;
  initialR: quat;
  initialP: vec3;
  startMouse: vec3;
  focus: vec3;




  constructor() {

    this.initialX = vec3.create()
    this.initialR = quat.create()
    this.initialP = vec3.create()
    this.startMouse = vec3.create()
    this.focus = vec3.create()

  }



  start(camera: Camera<PerspectiveLens>, unprojPos: vec3, mouse: vec3): void {
    this.cam = camera;
    vec3.copy(this.initialX, this.cam._matrix as any as vec3);
    vec3.copy(this.startMouse, mouse);

    quat.copy(this.initialR, camera.rotation);
    vec3.subtract(this.initialP, camera.position, unprojPos);

    vec3.copy(this.focus, unprojPos);

  }

  update(mouse: vec3): void {

    vec3.subtract(V1, mouse, this.startMouse);

    quat.setAxisAngle(Q2, this.initialX, V1[1] * 5)
    quat.rotateY(Q1, NULL_QUAT, -V1[0] * 5);
    quat.multiply(Q1, Q1, Q2)

    quat.multiply(this.cam.rotation, Q1, this.initialR);
    vec3.transformQuat(V1, this.initialP, Q1);
    vec3.add(this.cam.position, this.focus, V1);

    this.cam.invalidate()

  }

}




class PanAction implements IBehaviour {

  cam: Camera;

  initialX: vec3;
  initialY: vec3;
  initialP: vec3;
  startMouse: vec3;
  focus: vec3;


  constructor() {

    this.initialX = vec3.create()
    this.initialY = vec3.create()
    this.initialP = vec3.create()
    this.startMouse = vec3.create()
    this.focus = vec3.create()

  }



  start(camera: Camera, unprojPos: vec3, mouse: vec3): void {
    this.cam = camera;
    vec3.copy(this.initialX, this.cam._matrix as any as vec3);
    vec3.copy(this.initialP, this.cam.position);
    this.initialY[0] = this.cam._matrix[4];
    this.initialY[1] = this.cam._matrix[5];
    this.initialY[2] = this.cam._matrix[6];
    vec3.copy(this.startMouse, mouse);
    vec3.copy(this.focus, unprojPos);

  }

  update(mouse: vec3) {

    vec3.subtract(V1, mouse, this.startMouse);

    vec3.scale(V2, this.initialX, -V1[0] * PAN_SENSITIVITY)
    vec3.scaleAndAdd(V2, V2, this.initialY, -V1[1] * PAN_SENSITIVITY)


    vec3.add(this.cam.position, this.initialP, V2);

    this.cam.invalidate()

  }

}


class DollyAction implements IBehaviour {

  cam: Camera;

  initialZ: vec3;
  initialP: vec3;
  startMouse: vec3;
  focus: vec3;


  constructor() {

    this.initialZ = vec3.create()
    this.initialP = vec3.create()
    this.startMouse = vec3.create()
    this.focus = vec3.create()

  }



  start(camera: Camera, unprojPos: vec3, mouse: vec3): void {
    this.cam = camera;
    vec3.copy(this.initialP, this.cam.position);
    vec3.subtract(this.initialZ, this.cam.position, unprojPos);
    vec3.copy(this.startMouse, mouse);
    vec3.copy(this.focus, unprojPos);

  }

  update(mouse: vec3) {

    vec3.subtract(V1, mouse, this.startMouse);

    vec3.scale(V1, this.initialZ, V1[1] * 5)
    vec3.add(this.cam.position, this.initialP, V1);

    this.cam.invalidate()

  }

}

