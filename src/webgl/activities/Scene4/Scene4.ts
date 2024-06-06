/// #if DEBUG
import gui from "@webgl/dev/gui";
import { Gui } from "@webgl/dev/gui/api";
/// #endif
import gsap from "gsap";
import Crane from "./Crane";
import Vortex from "./Vortex";
import Node from "nanogl-node";
import Time from "@webgl/Time";
import lerp from "@/utils/Lerp";
import Camera from "nanogl-camera";
import Renderer from "@webgl/Renderer";
import { ISheet } from "@theatre/core";
import Scene4Lights from "./Scene4Lights";
import { quat, vec3, vec4 } from "gl-matrix";
import { mix } from "@webgl/math";
import Particles from "./particles/Particles";
import { JUMP_SOUND_LIST } from "./soundlist";
import AppService from "@/services/AppService";
import { toStatePaths } from "xstate/lib/utils";
import Viewport from "@/store/modules/Viewport";
import { RenderContext } from "@webgl/core/Renderer";
import AudioManager, { SCENE_AUDIO_AMBIENT_ID, SCENE_AUDIO_AMBIENT_LAYER_ID } from "@/core/audio/AudioManager";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import PerspectiveLens from "nanogl-camera/perspective-lens";
import { INTRO_POSITION, INTRO_LOOK_AT } from "../Scene4/constants";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import TextureAddChunk from "@webgl/glsl/textureAdd/TextureAddChunk";
import Background, { BackgroundType } from "../Scene2/utils/Background";
import { DEFAULT_TEXTURE_LUMINOSITY, DOWN_TEXTURE_LUMINOSITY } from "@webgl/glsl/texutrepass";
import Scene, { BLOCK_HOLD_AFTER_RELEASE_TIME, BLOCK_HOLD_DOWN_AFTER_RELEASE_TIME } from "../Scene/Scene";
import { OUTRO_TOP_COLOR, OUTRO_MID_COLOR, OUTRO_BOT_COLOR } from "@webgl/activities/Conclusion/constants";
import { BACKGROUND_TOP_ALPHA, BACKGROUND_TOP_COLOR, BACKGROUND_MIDDLE_COLOR, BACKGROUND_MIDDLE_ALPHA, BACKGROUND_BOTTOM_COLOR, BACKGROUND_BOTTOM_ALPHA, BACKGROUND_TRANS_TOP_COLOR, BACKGROUND_TRANS_TOP_ALPHA, BACKGROUND_TRANS_MIDDLE_COLOR, BACKGROUND_TRANS_MIDDLE_ALPHA, BACKGROUND_TRANS_BOTTOM_COLOR, BACKGROUND_TRANS_BOTTOM_ALPHA, VOICE_VOLUME, UI_VOLUME, JUMP_STEPS } from "./constants";

const V_ANGLE = vec3.create();
vec3.set(V_ANGLE, 0.02, 0.03, 0.06);

const CAM_START = vec3.fromValues(20, 60, 200);
const CAM_BEHIND = vec3.fromValues(-80, 10, 0);

const V3_A = vec3.create();

const CONTRAST_TO = 1.21;
const BRIGHTNESS_TO = 0.97;
const BIAS_TO = 1.49;
// contrast.contrast = 1.21;
// contrast.brightness = 0.97;
// contrast.bias = 1.49;
const AMBIENT_VOLUME = 0.75;

export default class Scene4 extends Scene {

  /// #if DEBUG
  public static guiFolder: Gui;
  /// #endif

  private _vortex: Vortex;
  private _vortex2: Vortex;
  private _cranes: Crane[] = [];

  stepValues = [0.01, 0.40625, 0.71875, 1.0];

  private _particles: Particles;

  cameraTargetX = 0;
  cameraTargetY = 0;

  private _ambientChunk: AmbientAddChunk;
  private _root: Node;

  private background: Background;

  private _lights: Scene4Lights

  // sheetPerfectVariants: ISheet[] = [];
  sheetPerfect: ISheet;

  public cameraSwitchIntro = { value: 0 }

  public speed = { value: 1, startV: 0 }
  public cameraSwitch = { value: 0, startV: 0 }
  public cameraFov = { value: 0, startV: 0 }
  public ambientAdd = { value: 0.1, startV: 0 }
  public vignetteB = { value: 0.0, startV: 0 }
  public chroma = { value: 0.0, startV: 0 }
  public sat = { value: 0.0, startV: 0 }
  public cloudOpacity = { value: 0.0, startV: 0 }
  public cranesOffset1 = { value: 1.0, startV: 1 }
  public cranesOffset2 = { value: 1.0, startV: 1 }

  private contrastValue = { value: 0.0 }

  private downHillV = { value: 0 }
  private downHill: TheatreFloat;

  introLookAt = new Node()

  private startRelease = 0

  private speedTheatre: TheatreFloat
  private cameraSwitchTheatre: TheatreFloat
  private introcameraSwitchTheatre: TheatreFloat
  private outrocameraSwitchTheatre: TheatreFloat
  private cameraFovTheatre: TheatreFloat
  private vignetteBlurTheatre: TheatreFloat
  private chromaTheatre: TheatreFloat
  private satTheatre: TheatreFloat
  private ambientAddTheatre: TheatreFloat
  private opacityExtCloudsTheatre: TheatreFloat
  private cranesOffset1Theatre: TheatreFloat
  private cranesOffset2Theatre: TheatreFloat

  private contrastTheatreIntro: TheatreFloat

  private contrastTheatreOutro: TheatreFloat

  private quatcamx = quat.create()
  private quatcamy = quat.create()

  private _startHFov = 0

  tileTexChunk: TextureAddChunk;
  camShakeV = vec3.create()

  private saveTexturePass = {
    textureRepeat: 0,
    textureOpacity: 0,
    textureLuminosity: 0,
    backgroundInfluence: 0,
  }

  private savecontrast: number;
  private savebrightness: number;
  private savebias: number;

  sceneId = 4

  constructor(renderer: Renderer, id: number) {
    super(renderer, id);
    this.stepValues = JUMP_STEPS;
    /// #if DEBUG
    Scene4.guiFolder = gui.folder("Scene 4");
    /// #endif
    this.tileTexChunk = new TextureAddChunk(this.renderer);

    this.sheetPerfect = AppService.state.machine.context.theatreProject.project.sheet("scene4-perfect-small");
    // this.sheetPerfectVariants[1] = AppService.state.machine.context.theatreProject.project.sheet("scene4-perfect-medium");
    // this.sheetPerfectVariants[2] = AppService.state.machine.context.theatreProject.project.sheet("scene4-perfect-large");

    this._ambientChunk = new AmbientAddChunk();
    this._ambientChunk.ambientAddUniform.set(this.ambientAdd.value);
    this._vortex = new Vortex("scene4/clouds_01.gltf", this.renderer, this._ambientChunk, this.tileTexChunk);
    this._vortex2 = new Vortex("scene4/clouds_02.gltf", this.renderer, this._ambientChunk, this.tileTexChunk);
    this._particles = new Particles(this.renderer, 50, vec3.fromValues(0.8, 0.3, 0.3));
    this._cranes = [];
    for (let i = 0; i < 5; i++) {
      const crane = new Crane(
        i === 0 ? "scene4/crane.gltf" : "scene4/crane_2.gltf",
        this.renderer,
        this._ambientChunk,
        this.tileTexChunk,
        i < 3,
        i === 0 ? vec3.fromValues(1, 0.82, 1) : vec3.fromValues(0.88, 0.71, 0.88)
      );
      crane.id = i;
      crane.forwardOffset = i === 0 ? 0 : Math.ceil(i * 0.5) * (i % 2 === 0 ? -1 : 1);
      this._cranes.push(crane);
    }

    this._root = new Node();


    this.background = new Background(this.renderer, BackgroundType.LINEAR_3_STOPS);
    this.background.setUseClampedMix(true);
  }

  override async load(): Promise<any> {

    this._lights = new Scene4Lights(this.renderer);
    await Promise.all([
      this._vortex.load(), this._vortex2.load(), this.background.load(),
      ...this._cranes.map(crane => crane.load())
    ]);
    // On Loaded Call
    this.onLoaded();
  }

  override onLoaded(): void {
    for (const crane of this._cranes) {
      crane.onLoaded();
      crane.sheetPerfect = this.sheetPerfect;
    }

    this._vortex.onLoaded();
    this._vortex2.onLoaded();
    this.background.onLoaded();

    this.background.sheetOutro = this.sheetOutro;
    this.background.sheetSuccess = this.sheetSuccess;
    this.background.sheetDownhill = this.sheetDownhill;

    super.onLoaded();
  }

  override setupLighting() {
    for (const crane of this._cranes) {
      crane.setupLighting(this.renderer.scene.lighting);
    }
  }

  override start(): void {
    super.start();

    this._startHFov = (this.renderer.camera.lens as PerspectiveLens)._hfov;

    AudioManager.fadeIn(SCENE_AUDIO_AMBIENT_ID[this.id - 1], AMBIENT_VOLUME, 3);
    AudioManager.fadeIn(SCENE_AUDIO_AMBIENT_LAYER_ID[this.id - 1], AMBIENT_VOLUME - 0.15, 3);

    if (this.waitingStart) return;

    if (AppService.glapp.quality.level.isVignetteBlur) this.renderer.postprocess.post.add(this.renderer.postprocess.vignetteblur);
    this.renderer.postprocess.post.add(this.renderer.postprocess.frame);

    const contrast = this.renderer.postprocess.contrast;
    this.savecontrast = contrast.contrast;
    this.savebrightness = contrast.brightness;
    this.savebias = contrast.bias;

    this._root.add(this.renderer.scene.lighting.root);
    this._root.add(this._lights.node);
    this._lights.start(this.renderer.scene.lighting);


    this.renderer.clearColor.set([1, 1, 1, 1]);
    this.renderer.cameras.use("main");
    const cam = this.renderer.camera;
    if (cam._parent) cam._parent.remove(cam);

    for (const crane of this._cranes) {
      this._root.add(crane.gltf.root);
    }
    this._root.add(this._vortex.gltf.root);
    this._root.add(this._vortex2.gltf.root);
    this._root.add(this.background.gltf.root);
    this._root.add(this._particles.node);
    this._root.add(this.introLookAt);
    this._root.add(cam);
    vec3.copy(cam.position, INTRO_POSITION);
    vec3.copy(this.cameraInitialPosition, INTRO_LOOK_AT);
    // (cam.lens as PerspectiveLens).fov = 0.3217054402;
    this.cameraFov.value = (cam.lens as PerspectiveLens).fov;

    this.cameraSwitchTheatre = new TheatreFloat(this.cameraSwitch, this.sheetSuccess, "cameraSwitch");
    this.speedTheatre = new TheatreFloat(this.speed, this.sheetSuccess, "speed");
    this.cameraFovTheatre = new TheatreFloat(this.cameraFov, this.sheetSuccess, "cameraFov");
    this.ambientAddTheatre = new TheatreFloat(this.ambientAdd, this.sheetSuccess, "ambient");
    this.chromaTheatre = new TheatreFloat(this.chroma, this.sheetSuccess, "chromatic aberation");
    this.satTheatre = new TheatreFloat(this.sat, this.sheetPerfect, "saturation boom");
    this.vignetteBlurTheatre = new TheatreFloat(this.vignetteB, this.sheetSuccess, "vignette blur");
    this.opacityExtCloudsTheatre = new TheatreFloat(this.cloudOpacity, this.sheetSuccess, "clouds opacity");
    this.cranesOffset1Theatre = new TheatreFloat(this.cranesOffset1, this.sheetSuccess, "Cranes / Group 1 Offset");
    this.cranesOffset2Theatre = new TheatreFloat(this.cranesOffset2, this.sheetSuccess, "Cranes / Group 2 Offset");

    this.contrastTheatreIntro = new TheatreFloat(this.contrastValue, this.sheetIntro, "contrast");

    this.contrastTheatreOutro = new TheatreFloat(this.contrastValue, this.sheetOutro, "contrast");


    this.downHill = new TheatreFloat(this.downHillV, this.sheetDownhill, "downhill");

    this.outrocameraSwitchTheatre = new TheatreFloat(this.cameraSwitchIntro, this.sheetOutro, "switch camera");

    this.introcameraSwitchTheatre = new TheatreFloat(this.cameraSwitchIntro, this.sheetIntro, "switch camera");

    this.cameraSwitch.startV = this.cameraSwitch.value;
    this.speed.startV = this.speed.value;
    this.cameraFov.startV = this.cameraFov.value;
    this.ambientAdd.startV = this.ambientAdd.value;
    this.chroma.startV = this.chroma.value;
    this.vignetteB.startV = this.vignetteB.value;
    this.cloudOpacity.startV = this.cloudOpacity.value;
    this.cranesOffset1.startV = this.cranesOffset1.value;
    this.cranesOffset2.startV = this.cranesOffset2.value;

    vec3.copy(this._lights.point.position, this._cranes[0]?.craneNode.position);
    this._lights.point.y += 30;

    cam.invalidate();
    cam.updateWorldMatrix();
    this.background.start();

    this.background.topColor = vec4.fromValues(...BACKGROUND_TOP_COLOR, BACKGROUND_TOP_ALPHA);
    this.background.middleColor = vec4.fromValues(...BACKGROUND_MIDDLE_COLOR, BACKGROUND_MIDDLE_ALPHA);
    this.background.bottomColor = vec4.fromValues(...BACKGROUND_BOTTOM_COLOR, BACKGROUND_BOTTOM_ALPHA);
    this.background.setTransitionColors(
      vec4.fromValues(...BACKGROUND_TRANS_TOP_COLOR, BACKGROUND_TRANS_TOP_ALPHA),
      vec4.fromValues(...BACKGROUND_TRANS_MIDDLE_COLOR, BACKGROUND_TRANS_MIDDLE_ALPHA),
      vec4.fromValues(...BACKGROUND_TRANS_BOTTOM_COLOR, BACKGROUND_TRANS_BOTTOM_ALPHA)
    );

    this.background.setOutroColors(
      vec4.fromValues(...OUTRO_TOP_COLOR),
      vec4.fromValues(...OUTRO_MID_COLOR),
      vec4.fromValues(...OUTRO_BOT_COLOR)
    );

    this.background.setUseClampedMix(true);
    Background.transition.value = 0;

    for (const crane of this._cranes) {
      crane.start();
    }

    this._particles.start();

    /// #if DEBUG
    Scene4.guiFolder.clearFolder("Background");
    const bf = Scene4.guiFolder.folder("Background");
    bf.addColor(this.background, "topColor");
    bf.addColor(this.background, "middleColor");
    bf.addColor(this.background, "bottomColor");
    /// #endif
  }

  override stop(): void {
    super.stop();

    this.renderer.postprocess.post.remove(this.renderer.postprocess.vignetteblur);
    this.renderer.postprocess.post.remove(this.renderer.postprocess.frame);

    this._lights.stop();
    this._root.remove(this.renderer.scene.lighting.root);
    this._root.remove(this._lights.node);

    this._root.remove(this._vortex.gltf.root);
    this._root.remove(this._vortex2.gltf.root);
    this._root.remove(this.background.gltf.root);
    this._root.remove(this._particles.node);
    this._root.remove(this.introLookAt);
    this._root.remove(this.renderer.camera);
    for (const crane of this._cranes) {
      this._root.remove(crane.gltf.root);
      crane.stop();
    }

    this._particles.stop();

    this.cameraFovTheatre.dispose();
    this.speedTheatre.dispose();
    this.cameraSwitchTheatre.dispose();
    this.chromaTheatre.dispose();
    this.vignetteBlurTheatre.dispose();
    this.ambientAddTheatre.dispose();
    this.opacityExtCloudsTheatre.dispose();
    this.satTheatre.dispose();
    this.cranesOffset1Theatre.dispose();
    this.cranesOffset2Theatre.dispose();

    this.contrastTheatreIntro.dispose();

    this.contrastTheatreOutro.dispose();

    this.downHill.dispose();

    this.introcameraSwitchTheatre.dispose();

    this.background.stop();

    this.outrocameraSwitchTheatre.dispose();
  }

  override changeState = async (state: any) => {

    if (this.isIntroPlaying) return;
    if (this.previousState === toStatePaths(state.value)[0].join(".")) return;
    else this.previousState = toStatePaths(state.value)[0].join(".");

    if (state.matches("scene.interacting.perfect")) {
      this.release();
    }

    this.checkOutro(state);
  };

  async release() {

    if (this.isIntroPlaying || this.renderer.scene.blockRelease) return;

    window.clearTimeout(this.unblockReleaseTO);
    window.clearTimeout(this.unblockDownReleaseTO);
    this.renderer.scene.blockRelease = true;

    this.cameraShake(this.renderer.camera, 0.5, 2.5 * this.holdingPercent);
    this.startRelease = this.renderer.scene.hold;
    for (const [index, crane] of this._cranes.entries()) {
      crane.release(this.holdingPercent, index !== 0);
    }

    // Sound trigger
    this.jumpCounter++;

    AudioManager.stopHold(this.id);

    const variant = this.holdingPercent < JUMP_STEPS[1] ? 0 : this.holdingPercent < JUMP_STEPS[2] ? 1 : 2;

    const randomLine = Math.floor(Math.random() * JUMP_SOUND_LIST.length);
    const randomVariant = Math.floor(Math.random() * JUMP_SOUND_LIST[randomLine].length);
    if (variant === 0) {
      AudioManager.playReactions(JUMP_SOUND_LIST[randomLine][randomVariant], UI_VOLUME);
    }
    if (variant === 1) {
      this.firstReleaseDone ? AudioManager.playReactions(JUMP_SOUND_LIST[randomLine][randomVariant], UI_VOLUME) : (this.firstReleaseDone = true, AudioManager.playVoice(this.id, 3, VOICE_VOLUME));
    }
    if (variant === 2) {
      AudioManager.playReactions(JUMP_SOUND_LIST[randomLine][randomVariant], UI_VOLUME);
    }
    this.checkFirstPerfect();
    this.renderer.scene.blockHold = true;
    this.renderer.scene.blockHoldDown = true;
    await this.sheetPerfect.sequence.play({ rate: 1 - (1 - this.holdingPercent) * 0.5 });
    this.checkRelease();
    this.resetHoldTime();
    this.renderer.scene.blockRelease = false;
    this.unblockDownReleaseTO = window.setTimeout(() => {
      if (this.renderer.scene.isTitlePlaying.value) return;
      this.renderer.scene.blockHold = false;
      if (this.renderer.scene.isHolding) AudioManager.playHold(this.id, this.renderer.scene.holdValue);
    }, BLOCK_HOLD_AFTER_RELEASE_TIME);
    this.unblockReleaseTO = window.setTimeout(() => {
      if (this.renderer.scene.isTitlePlaying.value) return;
      this.renderer.scene.blockHoldDown = false;
    }, BLOCK_HOLD_DOWN_AFTER_RELEASE_TIME);
  }

  cameraShake(camera: Camera, duration = 0.5, intensity = 0.05) {

    const tl = gsap.timeline();

    const params = { transformProgress: 0 };

    const randomOffset = Math.random();

    tl.to(params, {
      transformProgress: 1,
      duration: duration,
      ease: "power2.inOut",
      onUpdate: () => {
        this.camShakeV[0] = Math.sin(params.transformProgress * Math.PI * 4) * intensity;
        this.camShakeV[1] = Math.sin(params.transformProgress * Math.PI * 4 + randomOffset) * intensity;
      },
      onComplete: () => {
        vec3.set(this.camShakeV, 0, 0, 0);
      }
    }, "0");
  }


  preRender(): void {
    if (!this.isLoaded) return;

    super.preRender();
    this._root.x = -this._cranes[0]?.trailNodeX;
    this._root.updateWorldMatrix();
    const cam = this.renderer.cameras.camera;
    (cam.lens as PerspectiveLens).fov = this.cameraFov.value;
    this._ambientChunk.ambientAddUniform.set(this.ambientAdd.value);

    const pp = this.renderer.postprocess;

    pp.vignetteblur.effectStrength = this.vignetteB.value * this.contrastValue.value;
    pp.chroma.amount = this.chroma.value * this.contrastValue.value;
    pp.saturation.amount = 1 - this.sat.value * this.holdingPercent * this.contrastValue.value;
    if (this.isIntroPlaying || this.isOutroPlaying) {
      const contrast = pp.contrast;
      contrast.contrast = lerp(this.savecontrast, CONTRAST_TO, this.contrastValue.value);
      contrast.brightness = lerp(this.savebrightness, BRIGHTNESS_TO, this.contrastValue.value);
      contrast.bias = lerp(this.savebias, BIAS_TO, this.contrastValue.value);
    }

    const introV = this.cameraSwitchIntro.value;
    if (this.isIntroPlaying || this.isOutroPlaying) {
      vec3.lerp(cam.position, this.isOutroPlaying ? this.cameraInitialPosition : CAM_START, INTRO_POSITION, this.cameraSwitchIntro.value);
      vec3.lerp(V3_A, this._cranes[0]?.craneNode.position, INTRO_LOOK_AT, this.cameraSwitchIntro.value);
      cam.lookAt(V3_A);
      cam.invalidate();
      cam.updateWorldMatrix();
      // const tPass = this.renderer.postprocess.texturepass;
      // tPass.textureOpacity = mix(TEXTUREPASS_OPACITY, 0, this.cameraSwitchIntro.value);
      this.cameraTargetX = lerp(this.cameraTargetX, 0, introV);
      this.cameraTargetY = lerp(this.cameraTargetY, 0, introV);
      vec3.lerp(this.camShakeV, this.camShakeV, [0, 0, 0], introV);
      // console.log(cam.position)
    } else {

      vec3.lerp(this.cameraInitialPosition, CAM_START, CAM_BEHIND, this.cameraSwitch.value);
      vec3.copy(cam.position, this.cameraInitialPosition);
      const xNorm = (this.mousePosition.x / window.innerWidth - 0.5) * 2;
      const yNorm = -(this.mousePosition.y / window.innerHeight - 0.5) * 2;

      const amplitudeX = (Math.PI * 0.025 + this.speed.value * Math.PI * 0.005) * (Viewport.isMobile ? 0 : 0.4);
      const amplitudeY = (Math.PI * 0.025 + this.speed.value * Math.PI * 0.005) * (Viewport.isMobile ? 0 : 0.4);

      const smooth = 0.001;
      this.cameraTargetX = lerp(this.cameraTargetX, xNorm * amplitudeX, smooth * Time.scaledDt);
      this.cameraTargetY = lerp(this.cameraTargetY, yNorm * amplitudeY, smooth * Time.scaledDt);

      cam.lookAt(this._cranes[0]?.craneNode.position);
    }

    quat.identity(this.quatcamy);
    quat.rotateX(this.quatcamy, this.quatcamy, this.cameraTargetY);
    quat.identity(this.quatcamx);
    quat.rotateY(this.quatcamx, this.quatcamx, -this.cameraTargetX);
    quat.multiply(cam.rotation, cam.rotation, this.quatcamx);
    quat.multiply(cam.rotation, cam.rotation, this.quatcamy);
    vec3.add(cam.position, cam.position, this.camShakeV);
    cam.invalidate();
    cam.updateWorldMatrix();
    (cam.lens as PerspectiveLens).setHorizontalFov(mix(this.cameraFov.value * (Viewport.isMobile ? 0.5 : 1), this._startHFov, introV));

    // const addSpeed = this._crane.zNode.value * (smoothstep(0.1, 0, this._crane.jumpFactor)) * 3;

    this._vortex.speed = this.speed.value;
    this._vortex2.speed = this.speed.value;

    this._vortex.preRender();
    this._vortex2.preRender();

    this._vortex.cloudsOpacity = this.cloudOpacity.value;

    for (const [index, crane] of this._cranes.entries()) {
      if (index !== 0) {
        const offset = index < 3 ? this.cranesOffset1.value : this.cranesOffset2.value;
        crane.craneNodePosition[0] -=
          2 * crane.forwardOffset
          + (10 + Math.max(-crane.forwardOffset, 0)) * offset;
      }
      crane.speed = this.speed.value;
      crane.preRender();
    }

    this._lights.preRender(this._cranes[0]?.craneNodePosition, this.speed.value);

    this._particles.preRender(this.speed.value);



    if (this.isOutroPlaying) {
      for (const v of pp.frame.borderWidth) {
        v[0] *= 1 - this.cameraSwitchIntro.value;
        v[1] *= 1 - this.cameraSwitchIntro.value;
        v[2] *= 1 - this.cameraSwitchIntro.value;
        v[3] *= 1 - this.cameraSwitchIntro.value;
      }

      const tPass = this.renderer.postprocess.texturepass;
      const v = this.cameraSwitchIntro.value;
      tPass.textureLuminosity = mix(DEFAULT_TEXTURE_LUMINOSITY, DOWN_TEXTURE_LUMINOSITY, v);
    }
  }

  override render(ctx: RenderContext): void {
    if (!this.isLoaded) return;

    super.render(ctx);
    this.background.render(ctx);

    this._vortex.render(ctx);
    this._vortex2.render(ctx);

    for (const crane of this._cranes) {
      crane.render(ctx);
    }

    this._particles.render(ctx);
  }
}
