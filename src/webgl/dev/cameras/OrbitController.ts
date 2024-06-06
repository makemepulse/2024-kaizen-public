import { vec3 } from "gl-matrix";
import Camera from "nanogl-camera";
import { ICameraController } from "@webgl/cameras/ICameraController";

const V3 = vec3.create();

function setMousePos(e: any, el: any, v3: any) {
  let cX, cY;
  if (e.touches && e.touches[0]) {
    cX = e.touches[0].clientX;
    cY = e.touches[0].clientY;
  } else {
    cX = e.clientX;
    cY = e.clientY;
  }
  v3[0] = (2 * cX) / el.width - 1;
  v3[1] = -((2 * cY) / el.height - 1);
}

export interface IOrbitOpts {
  rotateSpeed?: number;
  wheelSpeed?: number;
  dragSpeed?: number;
  dist?: number;
  minDist?: number;
  maxDist?: number;
  center?: vec3;
  _theta?: number;
  _phi?: number;
}

export default class OrbitController implements ICameraController {
  el: HTMLElement | Element;
  rotateSpeed: number;
  wheelSpeed: number;
  dragSpeed: number;
  dist: number;
  minDist: number;
  maxDist: number;
  center: any;
  _theta: number;
  _phi: number;
  mouseButton1: boolean;
  mouseButton2: boolean;
  mouse: vec3;
  mStartDrag: vec3;
  mDrag: vec3;
  pan: vec3;
  panInitialX: vec3;
  panInitialY: vec3;
  panInitialP: vec3;
  _drag: vec3;
  cam: Camera;
  hasMoved: boolean;

  constructor(el: HTMLElement | Element, opts: IOrbitOpts = {}) {
    this.el = el;
    this.rotateSpeed = opts.rotateSpeed ? opts.rotateSpeed : 3;
    this.wheelSpeed = opts.wheelSpeed ? opts.wheelSpeed : 0.02;
    this.dragSpeed = opts.dragSpeed ? opts.dragSpeed : 3;
    this.dist = opts.dist ? opts.dist : 2;
    this.minDist = opts.minDist ? opts.minDist : 1.0;
    this.maxDist = opts.maxDist ? opts.maxDist : 100.0;
    this.center = opts.center ? opts.center : vec3.fromValues(0, 0, 0);
    this._theta = opts._theta ? opts._theta : 0.0;
    this._phi = opts._phi ? opts._phi : Math.PI * 0.5;

    this.mouseButton1 = false;
    this.mouseButton2 = false;
    this.mouse = vec3.fromValues(0, 0, 1);
    this.mStartDrag = vec3.fromValues(0, 0, 1);
    this.mDrag = vec3.fromValues(0, 0, 1);
    this.pan = vec3.fromValues(0, 0, 0);
    this.panInitialX = vec3.create();
    this.panInitialY = vec3.create();
    this.panInitialP = vec3.create();
    this._drag = vec3.fromValues(this._theta, this._phi, 1);

    this.cam = null;
  }

  start(cam: Camera): void {
    this.cam = cam;
    this.el.addEventListener("mousemove", this.onMouseMove);
    this.el.addEventListener("touchmove", this.onMouseMove);
    this.el.addEventListener("touchstart", this.onMouseDown);
    this.el.addEventListener("mousedown", this.onMouseDown);
    this.el.addEventListener("mouseup", this.onMouseUp);
    this.el.addEventListener("touchend", this.onMouseUp);
    this.el.addEventListener("wheel", this.onMouseWheel);
    this.el.addEventListener("contextmenu", this.onRightClick);

    this.onMouseDown({ clientX: 0, clientY: 0 });
    this.onMouseMove({ clientX: 0, clientY: 0 });
    this.onMouseUp({ clientX: 0, clientY: 0 });
  }

  stop(): void {
    this.cam = null;
    this.el.removeEventListener("mousemove", this.onMouseMove);
    this.el.removeEventListener("touchmove", this.onMouseMove);
    this.el.removeEventListener("touchstart", this.onMouseDown);
    this.el.removeEventListener("mousedown", this.onMouseDown);
    this.el.removeEventListener("mouseup", this.onMouseUp);
    this.el.removeEventListener("touchend", this.onMouseUp);
    this.el.removeEventListener("wheel", this.onMouseWheel);
    this.el.removeEventListener("contextmenu", this.onRightClick);
  }

  onMouseWheel = (e: any) => {
    let dir = e.deltaY > 0 ? 1 : -1;
    dir *= this.wheelSpeed;
    this.dist += dir; //* 0.7
    this.dist = Math.max(this.minDist, Math.min(this.dist, this.maxDist));
  };

  onMouseDown = (e: any) => {
    this.mouseButton1 = true;
    setMousePos(e, this.el, this.mouse);
    vec3.copy(this.mStartDrag, this.mouse);
  };

  onRightClick = (e: any) => {
    // e.preventDefault()
    this.mouseButton2 = true;
    setMousePos(e, this.el, this.mouse);

    vec3.copy(this.panInitialX, [
      this.cam._matrix[0],
      this.cam._matrix[1],
      this.cam._matrix[2],
    ]);
    vec3.copy(this.panInitialP, this.cam.position);

    this.panInitialY[0] = this.cam._matrix[4];
    this.panInitialY[1] = this.cam._matrix[5];
    this.panInitialY[2] = this.cam._matrix[6];

    vec3.copy(this.mStartDrag, this.mouse);
    return false;
  };

  onMouseMove = (e: any) => {
    if (!this.mouseButton1) {
      return;
    }
    if (this.mouseButton2) {
      this._pan(e);
      return;
    }

    this.hasMoved = true;

    setMousePos(e, this.el, this.mouse);
    this.mDrag[0] = this.mouse[0] - this.mStartDrag[0];
    this.mDrag[1] = this.mouse[1] - this.mStartDrag[1];
    vec3.copy(this.mStartDrag, this.mouse);
    this._drag[0] -= (this.mDrag[0] * this.dragSpeed) / 4;
    this._drag[1] += (this.mDrag[1] * this.dragSpeed) / 4;
    if (this._drag[1] <= 0.001) this._drag[1] = 0.001;
    if (this._drag[1] >= Math.PI - 0.001) this._drag[1] = Math.PI - 0.001;
  };

  onMouseUp = (e: any) => {
    this.hasMoved = false;
    this.mouseButton1 = false;
    this.mouseButton2 = false;
  };

  _pan = (e: any) => {
    setMousePos(e, this.el, this.mouse);
    this.mDrag[0] = this.mouse[0] - this.mStartDrag[0];
    this.mDrag[1] = this.mouse[1] - this.mStartDrag[1];
    vec3.copy(this.mStartDrag, this.mouse);

    const pan = vec3.create();
    vec3.scale(pan, this.panInitialX, -this.mDrag[0] * this.dragSpeed);
    vec3.scaleAndAdd(
      pan,
      pan,
      this.panInitialY,
      -this.mDrag[1] * this.dragSpeed
    );

    this.pan = pan;
  };

  update(dt: number): void {
    if (!this.cam) return;

    const r = this.dist;

    const s = dt * this.rotateSpeed;
    this._theta += (this._drag[0] - this._theta) * s;
    this._phi += (this._drag[1] - this._phi) * s;

    V3[0] = this.center[0] + r * Math.sin(this._phi) * Math.sin(this._theta);
    V3[1] = this.center[1] + r * Math.cos(this._phi);
    V3[2] = this.center[2] + r * Math.sin(this._phi) * Math.cos(this._theta);

    vec3.copy(this.cam.position, V3);
    vec3.add(this.cam.position, this.cam.position, this.pan);
    vec3.add(this.center, this.center, this.pan);
    this.pan = vec3.create();

    this.cam.lookAt(this.center);
    this.cam.invalidate();
  }
}
