import Scene1 from "./Scene1";
import Time from "@webgl/Time";
import Node from "nanogl-node";
import lerp from "@/utils/Lerp";
import { mix } from "@webgl/math";
import Camera from "nanogl-camera";
import Renderer from "@webgl/Renderer";
import { quat, vec3 } from "gl-matrix";
import { ISheet } from "@theatre/core";
import TheatreVec3 from "@webgl/theatre/TheatreVec3";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import PerspectiveLens from "nanogl-camera/perspective-lens";
import { CAMERA_BEHIND_VALUE, INTRO_LOOK_AT, INTRO_POSITION, INTRO_ROTATION, QUAT, V3A, V3B } from "./constants";
import { INTRO_POSITION as OUTRO_POSITION, INTRO_LOOK_AT as OUTRO_LOOK_AT } from "../Scene2/constants";
import { lerpToFromIntroOutro } from "@webgl/cameras/IntroOutroCam";
import Viewport from "@/store/modules/Viewport";
import { DEFAULT_TEXTURE_LUMINOSITY, DOWN_TEXTURE_LUMINOSITY } from "@webgl/glsl/texutrepass";

// const TEXTUREPASS_OPACITY = 0.57;

export default class Scene1CameraSystem {
  scene: Scene1;
  renderer: Renderer;

  // private roll: number;
  public cameraLookAt: vec3;
  private outroLookAt = new Node();
  private camRotation: quat = quat.create();
  // private originVector: vec3 = vec3.create();
  private camParentSave: vec3 = vec3.create();
  // private directionVector: vec3 = vec3.create();

  // Theatre Animations
  private camFovAnim: TheatreFloat;
  private camTargetAnim: TheatreVec3;
  private progressCoeff: TheatreFloat;
  private ratioTheatreOutro: TheatreFloat;
  private ratioTheatreIntro: TheatreFloat;
  private camFovBoomSTheatre: TheatreFloat;
  private camFovBoomMTheatre: TheatreFloat;
  private camFovBoomLTheatre: TheatreFloat;
  private camAnimInitPosition: TheatreFloat;
  private offsetCameraTheatre: TheatreFloat;
  private offsetCameraTheatreIntro: TheatreFloat;
  private cameraLookAtZPositionIntro: TheatreFloat;
  private offsetCameraDistanceTheatre: TheatreFloat;
  private cameraLookAtZPositionProgress: TheatreFloat;
  private offsetCameraDistanceTheatreIntro: TheatreFloat;

  // Theatre values
  private cameraFov = { value: 0 };
  public ratioOutro = { value: 0 };
  private offsetCamera = { value: 0 };
  private cameraFovBoomS = { value: 0 };
  private cameraFovBoomM = { value: 0 };
  private cameraFovBoomL = { value: 0 };
  private cameraYPosition = { value: 0 };
  private progressCoeffVal = { value: 0 };
  private offsetCameraDistance = { value: 0 };
  private cameraLookAtYPosition = { value: 0 };
  private cameraLookAtZPosition = { value: 0 };

  private cameraTargetX = 0;
  private cameraTargetY = 0;

  constructor(scene: Scene1, private sheetPerfect: ISheet, private sheetSuccess: ISheet, private sheetIntro: ISheet, private sheetOutro: ISheet) {
    this.scene = scene;
    this.scene.cameraInitialPosition = vec3.create();
  }

  async load(renderer: Renderer): Promise<any> {
    this.renderer = renderer;
  }

  start(butterfly: any) {
    this.renderer.cameras.use("main");


    this.outroLookAt = new Node();
    this.camRotation = quat.create();
    // this.originVector = vec3.create();
    // this.directionVector = vec3.create();

    this.cameraTargetX = this.cameraTargetY = 0;

    const cam = this.renderer.cameras.camera;
    if (!cam._parent) {
      const n = new Node();
      n.add(cam);
    }
    vec3.copy(cam._parent.position, INTRO_POSITION);
    vec3.copy(this.camParentSave, cam._parent.position);
    this.cameraLookAt = vec3.fromValues(INTRO_LOOK_AT[0], INTRO_LOOK_AT[1], INTRO_LOOK_AT[2]);
    cam._parent.lookAt(this.cameraLookAt);
    cam._parent.invalidate();
    cam._parent.updateWorldMatrix();

    // Set camera initial position
    const initialCameraPosition = vec3.fromValues(butterfly.node.position[0], 0, 0);
    vec3.copy(cam.position, initialCameraPosition);
    cam.invalidate();
    cam.updateWorldMatrix();

    // Set Theatre Animations
    this.camFovAnim = new TheatreFloat(this.cameraFov, this.sheetSuccess, "Camera FOV");
    this.ratioTheatreOutro = new TheatreFloat(this.ratioOutro, this.sheetOutro, "Ratio outro");
    this.ratioTheatreIntro = new TheatreFloat(this.ratioOutro, this.sheetIntro, "Ratio outro");
    this.progressCoeff = new TheatreFloat(this.progressCoeffVal, this.sheetSuccess, "Progress Coeff");
    this.offsetCameraTheatre = new TheatreFloat(this.offsetCamera, this.sheetSuccess, "Offset Camera");
    this.offsetCameraTheatreIntro = new TheatreFloat(this.offsetCamera, this.sheetIntro, "Offset Camera Intro");
    this.camFovBoomMTheatre = new TheatreFloat(this.cameraFovBoomM, this.scene.sheetPerfectVariants[1], "Camera FOV Boom");
    this.camFovBoomSTheatre = new TheatreFloat(this.cameraFovBoomS, this.scene.sheetPerfectVariants[0], "Camera FOV Boom S");
    this.camFovBoomLTheatre = new TheatreFloat(this.cameraFovBoomL, this.scene.sheetPerfectVariants[2], "Camera FOV Boom L");
    this.offsetCameraDistanceTheatre = new TheatreFloat(this.offsetCameraDistance, this.sheetSuccess, "Offset Camera Distance");
    this.cameraLookAtZPositionProgress = new TheatreFloat(this.cameraLookAtZPosition, this.sheetSuccess, "Camera LookAt Z Position");
    this.cameraLookAtZPositionIntro = new TheatreFloat(this.cameraLookAtZPosition, this.sheetIntro, "Camera LookAt Z Position Intro");
    this.offsetCameraDistanceTheatreIntro = new TheatreFloat(this.offsetCameraDistance, this.sheetIntro, "Offset Camera Distance Intro");
  }

  stop() {
    this.renderer.camera._parent.remove(this.renderer.camera);
    this.camFovAnim?.dispose();
    this.camTargetAnim?.dispose();
    this.progressCoeff?.dispose();
    this.ratioTheatreOutro?.dispose();
    this.ratioTheatreIntro?.dispose();
    this.camFovBoomSTheatre?.dispose();
    this.camFovBoomMTheatre?.dispose();
    this.camFovBoomLTheatre?.dispose();
    this.camAnimInitPosition?.dispose();
    this.offsetCameraTheatre?.dispose();
    this.offsetCameraTheatreIntro?.dispose();
    this.offsetCameraDistanceTheatre?.dispose();
    this.cameraLookAtZPositionIntro?.dispose();
    this.cameraLookAtZPositionProgress?.dispose();
    this.offsetCameraDistanceTheatreIntro?.dispose();
  }

  preRender(cam: Camera, butterflyPosition: vec3, isIntroPlaying = false, isOutroPlaying = false): void {
    const vIntroOutro = this.ratioOutro.value;
    const vScene = 1 - this.ratioOutro.value;

    // Update Camera FOV
    const perspective = cam.lens as PerspectiveLens;
    perspective.setHorizontalFov(this.cameraFov.value + this.cameraFovBoomS.value + this.cameraFovBoomM.value + this.cameraFovBoomL.value);

    // Update Camera
    vec3.copy(cam._parent.position, this.camParentSave);

    // Position
    // this.originVector = vec3.copy(this.originVector, cam._parent.position);

    const xNorm = (this.scene.mousePosition.x / window.innerWidth - 0.5) * 2;
    const yNorm = -(this.scene.mousePosition.y / window.innerHeight - 0.5) * 2;

    const amplitudeX = Viewport.isMobile ? 0 : 6; // might need to be adjusted according to progress
    const amplitudeY = Viewport.isMobile ? 0 : 4;

    const smooth = 0.001;
    this.cameraTargetX = lerp(this.cameraTargetX, xNorm * amplitudeX, smooth * Time.scaledDt * vScene);
    this.cameraTargetY = lerp(this.cameraTargetY, yNorm * amplitudeY, smooth * Time.scaledDt * vScene);

    vec3.copy(V3A, butterflyPosition);

    V3A[0] = this.offsetCameraDistance.value * 10 + butterflyPosition[0] * (1 - this.offsetCamera.value) + this.cameraTargetX;
    V3A[1] += this.cameraYPosition.value + this.cameraTargetY;
    V3A[2] += CAMERA_BEHIND_VALUE;

    vec3.lerp(V3B, INTRO_POSITION, V3A, vScene);
    vec3.lerp(cam._parent.position, cam._parent.position, V3B, 0.005 * Time.scaledDt);

    cam.invalidate();
    cam.updateWorldMatrix();

    // LookAt
    vec3.copy(V3A, butterflyPosition);
    V3A[0] += (this.cameraTargetX * 0.2);
    V3A[1] += 1 + this.cameraLookAtYPosition.value + (this.cameraTargetY * 0.2);
    V3A[2] += this.cameraLookAtZPosition.value + (this.cameraTargetX * 0.2);

    vec3.lerp(V3B, INTRO_LOOK_AT, V3A, vScene);
    vec3.lerp(this.cameraLookAt, this.cameraLookAt, V3B, 0.005 * Time.scaledDt);
    cam._parent.lookAt(this.cameraLookAt);

    // Compute roll angle
    // vec3.sub(this.directionVector, cam._parent.position, this.originVector);
    // this.roll = vec3.dot(this.directionVector, X_AXIS);

    quat.identity(QUAT);
    quat.rotateZ(QUAT, QUAT, butterflyPosition[0] * 4 * Math.PI / 180 * this.progressCoeffVal.value);
    quat.lerp(this.camRotation, INTRO_ROTATION, QUAT, vScene);
    quat.copy(cam.rotation, this.camRotation);

    vec3.copy(this.camParentSave, cam._parent.position);

    if (isOutroPlaying) {
      lerpToFromIntroOutro(
        vIntroOutro,
        cam,
        this.outroLookAt,
        OUTRO_POSITION,
        OUTRO_LOOK_AT,
        true,
        true,
        0.6
      );
    }

    if (isIntroPlaying) {
      const tPass = this.renderer.postprocess.texturepass;
      tPass.textureLuminosity = mix(DEFAULT_TEXTURE_LUMINOSITY, DOWN_TEXTURE_LUMINOSITY, this.ratioOutro.value);
    }
  }
}
