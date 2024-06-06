import { ISheet } from "@theatre/core";
import Renderer from "@webgl/Renderer";
import PerspectiveLens from "nanogl-camera/perspective-lens";
import gui from "@webgl/dev/gui";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import { quat, vec3 } from "gl-matrix";
import lerp from "@/utils/Lerp";
import { INTRO_LOOK_AT, INTRO_POSITION } from "@webgl/activities/Scene4/constants";

const V3_A = vec3.create();
const V3_B = vec3.create();

export default class ConclusionPerspectiveCam {
  introSheet: ISheet;

  camLerp = { value: 0 };
  camLerpTheatre: TheatreFloat;
  fov: { value: number; };


  initialFov = 0;

  fovTarget = 0.95;
  lookAtAdd = vec3.fromValues(0, 0, 1);
  lookAtTarget = vec3.fromValues(0, 0, 1);
  positionTarget = vec3.fromValues(0, 0, 0.5);

  constructor(private renderer: Renderer) {

  }

  start() {
    this.renderer.cameras.use("main");
    const cam = this.renderer.camera;
    if (cam._parent) cam._parent.remove(cam);
    this.initialFov = (this.renderer.camera.lens as PerspectiveLens)._fov;

    this.camLerpTheatre = new TheatreFloat(this.camLerp, this.introSheet, "camLerp");
  }

  stop() {
    this.camLerpTheatre.dispose();
  }

  preRender() {
    const fov = lerp(this.initialFov, this.fovTarget, this.camLerp.value);

    vec3.add(this.lookAtTarget, this.positionTarget, this.lookAtAdd);

    vec3.lerp(V3_B, INTRO_POSITION, this.positionTarget, this.camLerp.value);
    vec3.lerp(V3_A, INTRO_LOOK_AT, this.lookAtTarget, this.camLerp.value);

    // (this.renderer.camera.lens as PerspectiveLens).fov = fov;
    this.renderer.camera.position.set(V3_B);
    this.renderer.camera.lookAt(V3_A);

    this.renderer.camera.invalidate();
    this.renderer.camera.updateWorldMatrix();
  }
}