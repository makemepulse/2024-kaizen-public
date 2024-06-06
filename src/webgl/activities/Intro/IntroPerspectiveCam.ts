import { ISheet } from "@theatre/core";
import Renderer from "@webgl/Renderer";
import PerspectiveLens from "nanogl-camera/perspective-lens";
import gui from "@webgl/dev/gui";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import { quat, vec3 } from "gl-matrix";
import { lerpToFromIntroOutro } from "@webgl/cameras/IntroOutroCam";
import Node from "nanogl-node";
import lerp from "@/utils/Lerp";
import { OUTRO_FOV } from "./constants";
import { INTRO_POSITION as OUTRO_POSITION, INTRO_LOOK_AT as OUTRO_LOOK_AT, INTRO_ROTATION as OUTRO_ROTATION } from "../Scene1/constants";

const V3 = vec3.create();

export default class IntroPerspectiveCam {
  introSheet: ISheet;
  introTransitionSheet: ISheet;
  camPos: { x: number; y: number; z: number;}
  fovTheatre: TheatreFloat;
  fov: { value: number; };
  camPosXTheatre: TheatreFloat;
  camPosX = { value: 0 };
  camPosYTheatre: TheatreFloat;
  camPosY = { value: 0 };
  camPosZTheatre: TheatreFloat;
  camPosZ = { value: 0 };
  ratioOutroTheatre: TheatreFloat;
  ratioOutro = { value: 0 };

  targetVec3 = vec3.fromValues(0, 0, 1);

  private outroLookAt = new Node();

  constructor(private renderer: Renderer) {

  }

  start() {
    this.renderer.cameras.use("main");

    const cam = this.renderer.cameras.camera;
    if (!cam._parent) {
      const n = new Node();
      n.add(cam);
    }

    cam.position.set([0, 0, 0]);
    quat.identity(cam.rotation);
    vec3.set(cam._parent.position, 0, 0.5, 0);
    [this.camPosX.value, this.camPosY.value, this.camPosZ.value] = cam._parent.position;
    cam.invalidate();
    cam._parent.invalidate();
    cam._parent.updateWorldMatrix();

    (this.renderer.camera.lens as PerspectiveLens)._fov = 0.6934108803;
    this.fov = { value: 0.6934108803 };

    /// #if DEBUG
    const fd = gui.folder("Intro");
    fd.add(this.camPosX, "value", { label: "camPosx" }).onChange(() => {
      this.renderer.camera._parent.position.set([this.camPosX.value, this.camPosY.value, this.camPosZ.value]);
    });
    fd.add(this.camPosY, "value", { label: "camPosy" }).onChange(() => {
      this.renderer.camera._parent.position.set([this.camPosX.value, this.camPosY.value, this.camPosZ.value]);
    });
    fd.add(this.camPosZ, "value", { label: "camPosz" }).onChange(() => {
      this.renderer.camera._parent.position.set([this.camPosX.value, this.camPosY.value, this.camPosZ.value]);
    });
    fd.add(this.fov, "value").onChange(() => {
      (this.renderer.camera.lens as PerspectiveLens)._fov = this.fov.value;
      this.renderer.camera.invalidate();
      this.renderer.camera.updateWorldMatrix();
    });
    /// #endif
    this.camPosXTheatre = new TheatreFloat(this.camPosX, this.introSheet, "camPosX");
    this.camPosYTheatre = new TheatreFloat(this.camPosY, this.introSheet, "camPosY");
    this.camPosZTheatre = new TheatreFloat(this.camPosZ, this.introSheet, "camPosZ");
    this.fovTheatre = new TheatreFloat(this.fov, this.introSheet, "fov");
    this.ratioOutroTheatre = new TheatreFloat(this.ratioOutro, this.introTransitionSheet, "ratioOutro");
  }

  stop() {
    this.camPosXTheatre?.dispose();
    this.camPosYTheatre?.dispose();
    this.camPosZTheatre?.dispose();
    this.fovTheatre?.dispose();
    this.ratioOutroTheatre?.dispose();
  }

  preRender() {
    this.renderer.camera._parent.position.set([this.camPosX.value, this.camPosY.value, this.camPosZ.value]);
    vec3.add(V3, this.renderer.camera._parent.position, this.targetVec3);
    this.renderer.camera._parent.lookAt(V3);
    this.renderer.camera.invalidate();
    this.renderer.camera._parent.invalidate();
    this.renderer.camera._parent.updateWorldMatrix();

    const vOutro = this.ratioOutro.value;
    const fov = lerp(this.fov.value, OUTRO_FOV, vOutro);
    (this.renderer.camera.lens as PerspectiveLens).setHorizontalFov(fov);

    if (vOutro > 0) {
      lerpToFromIntroOutro(
        vOutro,
        this.renderer.camera,
        this.outroLookAt,
        OUTRO_POSITION,
        OUTRO_LOOK_AT,
        true
      );
      quat.lerp(this.renderer.camera.rotation, this.renderer.camera.rotation, OUTRO_ROTATION, vOutro);
    }
  }
}