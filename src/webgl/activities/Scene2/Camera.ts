import Renderer from "@webgl/Renderer";
import { quat, vec3 } from "gl-matrix";
import Pond from "./Pond";
import Time from "@webgl/Time";
import gsap from "gsap";
import { ISheet, ISheetObject } from "@theatre/core";
import PerspectiveLens from "nanogl-camera/perspective-lens";
import Fish from "./elements/Fish";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import NanoCamera from "nanogl-camera";
import Node from "nanogl-node";
import TheatreVec3 from "@webgl/theatre/TheatreVec3";
import { mix, smoothstep } from "@webgl/math";
import { lerpToFromIntroOutro } from "@webgl/cameras/IntroOutroCam";
import { INTRO_LOOK_AT, INTRO_POSITION } from "./constants";
import { INTRO_LOOK_AT as OUTRO_LOOK_AT, INTRO_POSITION as OUTRO_POSITION } from "../Scene3/constants";
import lerp from "@/utils/Lerp";
import Viewport from "@/store/modules/Viewport";

/// #if DEBUG
import Scene2 from "./Scene2";
/// #endif

export const TEXTUREPASS_OPACITY = 0.5;

const V3A = vec3.create();
const V3B = vec3.create();
const V3C = vec3.create();
const Q = quat.create();


export default class Camera {

  static CAM_DISTANCE = 10

  finallookAt: vec3 = vec3.fromValues(0, 0, 0);
  lookAt: vec3 = vec3.create();
  targetLookAt: vec3 = vec3.create();

  pondCenter: vec3 = vec3.create();

  introFov: number
  outroFov = 0.9519629308995201
  fovVal: number

  distanceFromCenter = Camera.CAM_DISTANCE;
  focusFish = 0.2;
  focusHeight = 0;
  rotationSpeed = 0.02;
  rotationZ = 0;

  shakeTime = Math.random()

  rotationTimeline: TheatreFloat;
  camShakeTimeline: TheatreFloat;
  heightTimeline: TheatreFloat;
  fovTimeline: TheatreFloat;
  localPositionTimeline: TheatreVec3;
  localLookAtTimeline: TheatreVec3;
  localLookAtMobileTimeline: TheatreVec3;

  saveCamParentPos = vec3.create()
  cameraInitialPosition = vec3.create()
  camShakeV = vec3.create()
  quatcamy = quat.create();
  quatcamx = quat.create();

  cameraTargetX = 0
  cameraTargetY = 0

  rotation = { value: 1, startV: 0 };
  height = { value: 0.5, startV: 0 };
  fov = { value: 0.7, startV: 0 };
  camShake = { value: 0, startV: 0 };
  localPosition = { value: vec3.fromValues(0, 0, 0), startV: vec3.create() };
  localLookAt = { value: vec3.fromValues(0, 0, 0), startV: vec3.create() };
  localLookAtMobile = { value: vec3.fromValues(0, 0, 0), startV: vec3.create() };

  totalTime = 0;

  static node: Node;
  lookAtNode: Node;

  introLookAt = new Node()

  sheetIntro: ISheet;
  sheetIntroObj: ISheetObject<{ ratio: number }>;

  sheetOutro: ISheet;
  sheetOutroObj: ISheetObject<{ ratio: number }>;

  sheetSuccess: ISheet;

  sheetPerfect: ISheet;
  sheetPerfectObj: ISheetObject<{ focusFish: number }>;

  // sheetLow: ISheet;
  // sheetLowObj: ISheetObject<{ distanceFromCenter: number, focusFish: number, focusHeight: number, rotationSpeed: number, rotationZ: number }>;

  // sheetMid: ISheet;
  // sheetMidObj: ISheetObject<{ distanceFromCenter: number, focusFish: number, focusHeight: number, rotationSpeed: number, rotationZ: number }>;

  // sheetHigh: ISheet;
  // sheetHighObj: ISheetObject<{ distanceFromCenter: number, focusFish: number, focusHeight: number, rotationSpeed: number, rotationZ: number }>;

  currentSheetObj: ISheetObject<{ distanceFromCenter: number, focusFish: number, focusHeight: number, rotationSpeed: number, rotationZ: number }>;

  constructor(private renderer: Renderer, private pond: Pond) {
    // this.sheetLow = AppService.state.machine.context.theatreProject.project.sheet("scene2-camera-low");
    // this.sheetMid = AppService.state.machine.context.theatreProject.project.sheet("scene2-camera-mid");
    // this.sheetHigh = AppService.state.machine.context.theatreProject.project.sheet("scene2-camera-high");

    Camera.node = new Node();
    this.lookAtNode = new Node();
    Camera.node.add(this.lookAtNode);

    /// #if DEBUG
    const f = Scene2.guiFolder.folder("Camera");
    f.range(this, "distanceFromCenter", 0, 20);
    f.range(this, "focusFish", 0, 1);
    f.range(this, "focusHeight", 0, 5);
    f.range(this, "rotationSpeed", 0, 1);
    f.range(this.fov, "value", 0, 1, { label: "FOV" });
    /// #endif
  }

  get camera(): NanoCamera<PerspectiveLens> {
    return this.renderer.camera as NanoCamera<PerspectiveLens>;
  }

  cameraShake(camera: NanoCamera, duration = 0.5, intensity = 0.05) {
    const cam = camera;

    const tl = gsap.timeline();

    const params = { transformProgress: 0 };

    const randomOffset = Math.random();

    tl.to(params, {
      transformProgress: 1,
      duration: duration,
      ease: "power2.inOut",
      onUpdate: () => {
        this.camShakeV[0] = Math.sin(params.transformProgress * Math.PI * 4) * intensity;
        this.camShakeV[1] = Math.sin(params.transformProgress * Math.PI * 4 + randomOffset) * intensity * 0.5;
      },
      onComplete: () => {
        vec3.set(this.camShakeV, 0, 0, 0);
      }
    }, "0");
  }

  start() {
    // this.renderer.cameras.use("main");
    this.introFov = (this.renderer.camera.lens as PerspectiveLens).fov;

    Camera.node.add(this.renderer.camera);


    // vec3.set(Camera.node.position, 4, 0.5, 4);

    this.pondCenter = vec3.fromValues(this.pond.water.center[0], this.pond.water.center[1], this.pond.water.center[2]);

    this.rotationTimeline = new TheatreFloat(this.rotation, this.sheetSuccess, "Camera Rotation Factor");
    this.heightTimeline = new TheatreFloat(this.height, this.sheetSuccess, "Camera Y");
    this.fovTimeline = new TheatreFloat(this.fov, this.sheetSuccess, "Camera FOV");
    this.localPositionTimeline = new TheatreVec3(this.localPosition.value, this.sheetSuccess, "Camera Local Position");
    this.localLookAtTimeline = new TheatreVec3(this.localLookAt.value, this.sheetSuccess, "Camera Local LookAt");
    this.localLookAtMobileTimeline = new TheatreVec3(this.localLookAtMobile.value, this.sheetSuccess, "Camera Local LookAt Mobile");
    this.camShakeTimeline = new TheatreFloat(this.camShake, this.sheetSuccess, "Camera Shake");

    // this.camera.lens.setAutoFov(this.fov.value);
    this.fov.startV = this.fov.value;
    this.rotation.startV = this.rotation.value;
    this.height.startV = this.height.value;
    this.localPosition.startV = vec3.clone(this.localPosition.value);
    this.localLookAt.startV = vec3.clone(this.localLookAt.value);
    this.localLookAtMobile.startV = vec3.clone(this.localLookAtMobile.value);

    // this.renderer.camera.position.set(this.localPosition.value);
    // this.renderer.camera.rotation.set(this.localLookAt.value);

    this.invalidate();

    this.sheetIntroObj = this.sheetIntro.object("Camera", {
      ratio: 0
    });

    this.sheetOutroObj = this.sheetOutro.object("Camera", {
      ratio: 1
    });

    // this.sheetLowObj = this.sheetLow.object("Camera", { distanceFromCenter: this.distanceFromCenter, focusFish: this.focusFish, focusHeight: this.focusHeight, rotationSpeed: this.rotationSpeed, rotationZ: this.rotationZ });
    // this.sheetMidObj = this.sheetMid.object("Camera", { distanceFromCenter: this.distanceFromCenter, focusFish: this.focusFish, focusHeight: this.focusHeight, rotationSpeed: this.rotationSpeed, rotationZ: this.rotationZ });
    // this.sheetHighObj = this.sheetHigh.object("Camera", { distanceFromCenter: this.distanceFromCenter, focusFish: this.focusFish, focusHeight: this.focusHeight, rotationSpeed: this.rotationSpeed, rotationZ: this.rotationZ });
    this.sheetPerfectObj = this.sheetPerfect.object("Camera", { distanceFromCenter: this.distanceFromCenter, focusFish: this.focusFish, focusHeight: this.focusHeight, rotationSpeed: this.rotationSpeed, rotationZ: this.rotationZ });

    this.preRender();

  }

  stop() {
    if (this.sheetIntroObj) this.sheetIntro?.detachObject("Camera");
    if (this.sheetOutroObj) this.sheetOutro?.detachObject("Camera");
    if (this.sheetPerfectObj) this.sheetPerfect?.detachObject("Camera");
    this.rotationTimeline.dispose();
    this.heightTimeline.dispose();
    this.fovTimeline.dispose();
    this.localPositionTimeline.dispose();
    this.localLookAtTimeline.dispose();
    this.localLookAtMobileTimeline.dispose();
    this.camShakeTimeline.dispose();
    Camera.node.remove(this.renderer.camera);
  }

  invalidate() {
    this.renderer.camera.invalidate();
    this.renderer.camera.updateWorldMatrix();
    Camera.node.invalidate();
    Camera.node.updateWorldMatrix();
    this.lookAtNode.invalidate();
    this.lookAtNode.updateWorldMatrix();
  }

  // async zoom() {
  //   const hold = this.renderer.scene.holdRef.value;
  //   if (hold < 0.5) {
  //     this.sheetLow.sequence.position = 0;
  //     this.sheetLow.sequence.play();
  //     this.currentSheetObj = this.sheetLowObj;
  //   }
  //   else if (hold < 0.99) {
  //     this.sheetMid.sequence.position = 0;
  //     this.sheetMid.sequence.play();
  //     this.currentSheetObj = this.sheetMidObj;
  //   }
  //   else {
  //     this.sheetHigh.sequence.position = 0;
  //     // this.sheetHigh.sequence.play();
  //     this.currentSheetObj = this.sheetHighObj;

  //     await this.sheetHigh.sequence.play({ range: [0, 2.25] });
  //     await this.sheetHigh.sequence.play({ range: [2.25, 2.75], rate: 0.25 });
  //     await this.sheetHigh.sequence.play({ range: [2.75, 5] });
  //   }
  // }

  updateValuesFromSheet() {
    if (!this.currentSheetObj) return;

    this.distanceFromCenter = this.currentSheetObj.value.distanceFromCenter;
    this.focusFish = this.currentSheetObj.value.focusFish;
    this.focusHeight = this.currentSheetObj.value.focusHeight;
    this.rotationSpeed = this.currentSheetObj.value.rotationSpeed;
    this.rotationZ = this.currentSheetObj.value.rotationZ;
  }

  updateCameraWrapper() {
    this.shakeTime += Time.scaledDt * (0.01 + this.camShake.value * 0.05);
    // const time = Time.time * (0.01 + this.camShake.value * 0.01);
    const scale = 3;
    this.camera.x +=
      Math.sin(this.shakeTime) * 0.03 * this.camShake.value * scale;
    this.camera.y +=
      Math.cos(this.shakeTime + 0.2) * 0.01 * this.camShake.value * scale;
    // Camera.node.z +=
    //   Math.sin(this.shakeTime + 0.5) * 0.02 * this.camShake.value * scale;
  }

  preRender(mousePosition: { x: number, y: number } = { x: 0, y: 0 }, holdingPercent = 1, isIntroPlaying = false, isOutroPlaying = false) {
    this.updateValuesFromSheet();
    const vIntro = this.sheetIntroObj.value;
    const vOutro = this.sheetOutroObj.value;

    this.totalTime += Time.stableDt * 0.01 * this.rotationSpeed * this.rotation.value * (Fish.isSlowMo ? Fish.slowMoFactor : 1);

    // if (!isOutroPlaying) {
    vec3.copy(Camera.node.position, this.saveCamParentPos);


    const camPos = Camera.node.position;
    camPos[0] = this.pondCenter[0] + this.distanceFromCenter * Math.cos(this.totalTime);
    camPos[2] = this.pondCenter[2] + this.distanceFromCenter * Math.sin(this.totalTime);
    camPos[1] = this.height.value;
    // this.updateCameraWrapper();


    Camera.node.lookAt(vec3.fromValues(this.pondCenter[0], Camera.node.position[1], this.pondCenter[2]));

    // vec3.lerp(this.renderer.camera.position, this.localPosition.value, VZERO, this.sheetPerfectObj.value.focusFish);
    vec3.copy(this.renderer.camera.position, this.localPosition.value);
    // this.updateCameraWrapper();

    vec3.sub(V3A, this.pond.fish.worldPosition, Camera.node.position);
    vec3.copy(V3B, V3A);
    quat.invert(Q, Camera.node.rotation);
    vec3.transformQuat(V3B, V3B, Q);

    vec3.copy(this.lookAtNode.position, vec3.lerp(V3C, Viewport.isMobile ? this.localLookAtMobile.value : this.localLookAt.value, V3B, this.sheetPerfectObj.value.focusFish * smoothstep(0.95, 1, holdingPercent)));

    // vec3.copy(Camera.node.position, this.cameraInitialPosition);
    const xNorm = (mousePosition.x / window.innerWidth - 0.5) * 2;
    const yNorm = -(mousePosition.y / window.innerHeight - 0.5) * 2;

    const amplitudeX = (Math.PI * 0.025 + 1 * Math.PI * 0.005) * (Viewport.isMobile ? 0 : 0.5);
    const amplitudeY = (Math.PI * 0.025 + 1 * Math.PI * 0.005) * (Viewport.isMobile ? 0 : 0.5);

    const smooth = 0.001;
    this.cameraTargetX = lerp(this.cameraTargetX, xNorm * amplitudeX * (1 - vOutro.ratio), smooth * Time.scaledDt);
    this.cameraTargetY = lerp(this.cameraTargetY, yNorm * amplitudeY * (1 - vOutro.ratio), smooth * Time.scaledDt);
    this.renderer.camera.lookAt(this.lookAtNode.position);
    quat.identity(this.quatcamy);
    quat.rotateX(this.quatcamy, this.quatcamy, this.cameraTargetY + (smoothstep(0, 0.5, vOutro.ratio) * smoothstep(1, 0.85, vOutro.ratio) * Math.PI * 0.5))
    quat.identity(this.quatcamx);
    quat.rotateY(this.quatcamx, this.quatcamx, -this.cameraTargetX)
    quat.multiply(this.renderer.camera.rotation, this.renderer.camera.rotation, this.quatcamx);
    quat.multiply(this.renderer.camera.rotation, this.renderer.camera.rotation, this.quatcamy);

    this.fovVal = mix(this.fov.value * (Viewport.isMobile ? 0.4 : 1), isIntroPlaying ? this.introFov : this.fov.value * (Viewport.isMobile ? 0.4 : 1), vIntro.ratio)
    this.camera.lens.setHorizontalFov(this.fovVal);
    vec3.add(this.renderer.camera.position, this.renderer.camera.position, this.camShakeV);


    // }

    if (isIntroPlaying || isOutroPlaying) {


      lerpToFromIntroOutro(
        isOutroPlaying ? vOutro.ratio : vIntro.ratio,
        this.camera,
        this.introLookAt,
        isIntroPlaying ? INTRO_POSITION : OUTRO_POSITION,
        isIntroPlaying ? INTRO_LOOK_AT : OUTRO_LOOK_AT,
        true, true
      );

      // const tPass = this.renderer.postprocess.texturepass;
      // tPass.textureOpacity = mix(TEXTUREPASS_OPACITY, 0, (isOutroPlaying ? vOutro.ratio : vIntro.ratio));
    }
    /// #if DEBUG
    // DebugDraw.drawGuizmo(this.lookAtNode._wmatrix);
    /// #endif
  }

}