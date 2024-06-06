import Pond from "./Pond";
import Camera from "./Camera";
import Time from "@webgl/Time";
import gui from "@webgl/dev/gui";
import Delay from "@/core/Delay";
import Renderer from "@webgl/Renderer";
import { vec3, vec4 } from "gl-matrix";
import { Gui } from "@webgl/dev/gui/api";
import Scene2Lights from "./Scene2Lights";
import AppService from "@/services/AppService";
import { toStatePaths } from "xstate/lib/utils";
import { RenderContext } from "@webgl/core/Renderer";
import AudioManager, { SCENE_AUDIO_AMBIENT_ID, SCENE_AUDIO_AMBIENT_LAYER_ID } from "@/core/audio/AudioManager";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import Background, { BackgroundType } from "./utils/Background";
import TextureAddChunk from "@webgl/glsl/textureAdd/TextureAddChunk";
import { SPLASH_SOUND_LIST, EXIT_SOUND_LIST, JUMP_SOUND_LIST, ENTRY_SOUND_LIST } from "./soundlist";
import Scene, { BLOCK_HOLD_AFTER_RELEASE_TIME, BLOCK_HOLD_DOWN_AFTER_RELEASE_TIME } from "../Scene/Scene";
import { BACKGROUND_BOTTOM_ALPHA, BACKGROUND_BOTTOM_COLOR, BACKGROUND_MIDDLE_ALPHA, BACKGROUND_MIDDLE_COLOR, BACKGROUND_TOP_ALPHA, BACKGROUND_TOP_COLOR, BACKGROUND_TOP_INTRO_COLOR, JUMP_STEPS, UI_VOLUME, VOICE_VOLUME } from "./constants";
import { BACKGROUND_BOTTOM_COLOR as BACKGROUND_S3_BOTTOM_COLOR, BACKGROUND_MIDDLE_COLOR as BACKGROUND_S3_MIDDLE_COLOR, BACKGROUND_TOP_INTRO_COLOR as BACKGROUND_S3_TOP_COLOR, BACKGROUND_BOTTOM_ALPHA as BACKGROUND_S3_BOTTOM_ALPHA, BACKGROUND_MIDDLE_ALPHA as BACKGROUND_S3_MIDDLE_ALPHA, BACKGROUND_TOP_ALPHA as BACKGROUND_S3_TOP_ALPHA } from "@webgl/activities/Scene3/constants";

const V3A = vec3.create();

const AMBIENT_VOLUME = 0.75;

export default class Scene2 extends Scene {

  /// #if DEBUG
  public static guiFolder: Gui;
  /// #endif

  pond: Pond
  background: Background
  tileTexChunk: TextureAddChunk

  isOutroPlaying = false

  lights: Scene2Lights

  camera: Camera;

  coolDownPeriod = 8

  chromaTheatreObj: TheatreFloat;
  chroma = { value: 0 }
  vignetteTheatreObj: TheatreFloat;
  vignette = { value: 0 }
  private startRelease = 0
  private downHillV = { value: 0 }
  private downHill: TheatreFloat;

  sceneId = 2

  constructor(renderer: Renderer, id: number) {
    super(renderer, id);
    this.stepValues = JUMP_STEPS;
    /// #if DEBUG
    Scene2.guiFolder = gui.folder("Scene 2");
    /// #endif

    this.tileTexChunk = new TextureAddChunk(this.renderer);
    this.pond = new Pond(this.renderer, this.tileTexChunk);

    this.background = new Background(this.renderer, BackgroundType.LINEAR_3_STOPS);
    this.background.topColor = vec4.fromValues(...BACKGROUND_TOP_COLOR, BACKGROUND_TOP_ALPHA);
    this.background.middleColor = vec4.fromValues(...BACKGROUND_MIDDLE_COLOR, BACKGROUND_MIDDLE_ALPHA);
    this.background.bottomColor = vec4.fromValues(...BACKGROUND_BOTTOM_COLOR, BACKGROUND_BOTTOM_ALPHA);

    this.background.setIntroColors(
      vec4.fromValues(...BACKGROUND_TOP_INTRO_COLOR, BACKGROUND_TOP_ALPHA),
      vec4.fromValues(...BACKGROUND_MIDDLE_COLOR, BACKGROUND_MIDDLE_ALPHA),
      vec4.fromValues(...BACKGROUND_BOTTOM_COLOR, BACKGROUND_BOTTOM_ALPHA)
    );
    this.background.setOutroColors(
      vec4.fromValues(...BACKGROUND_S3_TOP_COLOR, BACKGROUND_S3_TOP_ALPHA),
      vec4.fromValues(...BACKGROUND_S3_MIDDLE_COLOR, BACKGROUND_S3_MIDDLE_ALPHA),
      vec4.fromValues(...BACKGROUND_S3_BOTTOM_COLOR, BACKGROUND_S3_BOTTOM_ALPHA)
    );
    this.background.setUseClampedMix(true);
    /// #if DEBUG
    gui.clearFolder("Background");
    const bf = gui.folder("Background");
    bf.addColor(this.background, "topColor");
    bf.addColor(this.background, "middleColor");
    bf.addColor(this.background, "bottomColor");
    /// #endif

    this.camera = new Camera(this.renderer, this.pond);
  }

  override async load(): Promise<any> {

    this.lights = new Scene2Lights(this.renderer);

    await Promise.all([this.pond.load(), this.background.load()]);
    this.background.sheetOutro = this.sheetOutro;
    this.background.sheetIntro = this.sheetIntro;

    this.pond.fish.sheetPerfect = this.sheetPerfect;
    this.pond.fish.sheetSuccess = this.sheetSuccess;
    this.pond.water.sheetSuccess = this.sheetSuccess;
    this.pond.lilies.sheetSuccess = this.sheetSuccess;
    this.pond.clouds.sheetSuccess = this.sheetSuccess;
    this.pond.energyParticles.sheetSuccess = this.sheetSuccess;
    this.pond.rings.sheetSuccess = this.sheetSuccess;
    this.lights.sheetSuccess = this.sheetSuccess;
    this.camera.sheetSuccess = this.sheetSuccess;
    this.camera.sheetPerfect = this.sheetPerfect;
    this.camera.sheetIntro = this.sheetIntro;
    this.camera.sheetOutro = this.sheetOutro;

    this.onLoaded();
  }

  override onLoaded(): void {
    this.pond.onLoaded();
    this.background.onLoaded();

    super.onLoaded();
  }

  override setupLighting() {
    this.pond.setupSceneLighting(this.renderer.scene.lighting);
  }

  override start(): void {
    super.start();

    AudioManager.fadeIn(SCENE_AUDIO_AMBIENT_ID[this.id - 1], AMBIENT_VOLUME, 3);
    AudioManager.fadeIn(SCENE_AUDIO_AMBIENT_LAYER_ID[this.id - 1], AMBIENT_VOLUME - 0.15, 3);

    if (this.waitingStart) return;

    this.renderer.isReflect = false;

    vec4.set(this.renderer.clearColor, 0.541, 0.686, 0.588, 1);

    this.camera.start();

    this.pond.start();
    this.background.start();

    this.lights.start(this.renderer.scene.lighting);

    this.chromaTheatreObj = new TheatreFloat(this.chroma, this.sheetPerfect, "chromatic aberation");
    this.vignetteTheatreObj = new TheatreFloat(this.vignette, this.sheetPerfect, "vignette blur");
    // this.contrastTheatreObj = new TheatreFloat(this.contrast, this.sheetPerfect, "contrast");

    if (AppService.glapp.quality.level.isVignetteBlur) this.renderer.postprocess.post.add(this.renderer.postprocess.vignetteblur);

    this.renderer.postprocess.post.add(this.renderer.postprocess.frame);

    this.downHill = new TheatreFloat(this.downHillV, this.sheetDownhill, "Downhill");
  }

  override stop(): void {
    super.stop();
    this.lights.stop();
    this.pond.stop();
    this.background.stop();
    this.camera.stop();

    this.renderer.postprocess.post.remove(this.renderer.postprocess.frame);
    this.renderer.postprocess.post.remove(this.renderer.postprocess.vignetteblur);
    this.chromaTheatreObj.dispose();
    this.vignetteTheatreObj.dispose();
    // this.contrastTheatreObj.dispose();

    this.renderer.isReflect = false;

    const pp = this.renderer.postprocess;
    pp.saturation.amount = 1;

    this.downHill.dispose();
  }

  override changeState = async (state: any) => {
    if (this.previousState === toStatePaths(state.value)[0].join(".")) return;
    else this.previousState = toStatePaths(state.value)[0].join(".");

    if (state.matches("scene.interacting.perfect")) {
      this.release();
    }

    this.checkOutro(state);
  };

  async release() {

    if (this.renderer.scene.blockRelease) return;
    window.clearTimeout(this.unblockReleaseTO);
    window.clearTimeout(this.unblockDownReleaseTO);

    this.startRelease = this.renderer.scene.hold;
    this.camera.camShake.value = 0;
    this.renderer.scene.blockRelease = true;
    // this.camera.cameraShake(this.renderer.camera, 0.8, 0.125 * this.holdingPercent);

    this.renderer.scene.blockHold = true;
    this.renderer.scene.blockHoldDown = true;
    // if (this.camera) this.camera.zoom();

    this.jumpCounter++;

    AudioManager.stopHold(this.id);

    // Sound trigger
    const variant = this.holdingPercent < this.stepValues[1] ? 0 : this.holdingPercent < this.stepValues[2] ? 1 : 2;
    const randomLine = Math.floor(Math.random() * JUMP_SOUND_LIST.length);
    const randomVariant = Math.floor(Math.random() * JUMP_SOUND_LIST[randomLine].length);

    this.waterExitSound();
    this.waterEntrySound(variant);
    if (variant === 0) {
      this.splashSound();
    }
    if (variant === 1) {
      this.firstReleaseDone ? AudioManager.playReactions(JUMP_SOUND_LIST[randomLine][randomVariant], UI_VOLUME) : (this.firstReleaseDone = true, AudioManager.playVoice(this.id, 3, VOICE_VOLUME));
    }
    if (variant === 2) {
      AudioManager.playReactions(JUMP_SOUND_LIST[randomLine][randomVariant], UI_VOLUME);
    }
    this.checkFirstPerfect();
    if (this.pond) {
      await this.pond.fish.jump(Math.max(0.4, this.holdingPercent)).then(() => {
        // TODO TO BE TEST
        this.checkRelease();
        // if((variant === 2 || this.jumpCounter === 10) && !this.firstPerfectDone) (this.firstPerfectDone = true, AudioManager.playVoice(this.id, 4, VOICE_VOLUME));
      });
    }

    // this.checkRelease();
    this.resetHoldTime();
    this.renderer.scene.blockRelease = false;
    this.unblockDownReleaseTO = window.setTimeout(() => {
      if (this.renderer.scene.isTitlePlaying.value) return;
      this.renderer.scene.blockHold = false;
      if(this.renderer.scene.isHolding) AudioManager.playHold(this.id, this.renderer.scene.holdValue);
    }, BLOCK_HOLD_AFTER_RELEASE_TIME);
    this.unblockReleaseTO = window.setTimeout(() => {
      if (this.renderer.scene.isTitlePlaying.value) return;
      this.renderer.scene.blockHoldDown = false;
    }, BLOCK_HOLD_DOWN_AFTER_RELEASE_TIME);
  }

  async waterExitSound() {
    await Delay(200);
    AudioManager.playReactionsBrute(EXIT_SOUND_LIST[Math.floor(Math.random() * EXIT_SOUND_LIST.length)], 0.4);
  }

  async waterEntrySound(variant: number) {
    if(variant === 0) await Delay(800);
    else if(variant === 1) await Delay(1200);
    else if(variant === 2) await Delay(1350);
    else return;
    if(this.isPerfectRelease) (await Delay(1600), AudioManager.playReactionsBrute("kaizen_ch2_superdive", 0.7));
    else AudioManager.playReactionsBrute(ENTRY_SOUND_LIST[Math.floor(Math.random() * ENTRY_SOUND_LIST.length)], 0.7);
  }

  async splashSound() {
    await Delay(800);
    AudioManager.playReactionsBrute(SPLASH_SOUND_LIST[Math.floor(Math.random() * SPLASH_SOUND_LIST.length)], UI_VOLUME);
  }

  override preRender(): void {
    if (!this.isLoaded) return;

    super.preRender();

    this.pond.preRender(this.isIntroPlaying, this.isOutroPlaying);

    const pp = this.renderer.postprocess;

    pp.vignetteblur.effectStrength = this.vignette.value;
    // pp.saturation.amount = 1 - this.contrast.value * this.holdingPercent;
    pp.chroma.amount = this.chroma.value;
    // pp.contrast.contrast = this.contrast.value;

    this.tileTexChunk.timeU.set(Time.time);

    if (this.isOutroPlaying) {
      for (const v of pp.frame.borderWidth) {
        v[0] *= 1 - this.camera.sheetOutroObj.value.ratio;
        v[1] *= 1 - this.camera.sheetOutroObj.value.ratio;
        v[2] *= 1 - this.camera.sheetOutroObj.value.ratio;
        v[3] *= 1 - this.camera.sheetOutroObj.value.ratio;
      }
    }

    this.camera.preRender(this.mousePosition, this.holdingPercent, this.isIntroPlaying, this.isOutroPlaying);
    const fish = this.pond.fish.gltf.renderables[0].node;
    fish.updateWorldMatrix();
    vec3.set(V3A, fish._wmatrix[12], fish._wmatrix[13], fish._wmatrix[14]);
    this.lights.preRender(V3A);
  }

  override rttPass(): void {
    if (!this.isLoaded) return;

    // super.rttPass();
    this.renderer.scene.lighting.lightSetup.prepare(this.renderer.gl);
    // this.renderer.scene.lighting.renderLightmaps((ctx: RenderContext) => {
    //   this.render(ctx);
    // });
  }

  override render(ctx: RenderContext): void {
    if (!this.isLoaded) return;

    super.render(ctx);
    this.background.render(ctx);
    this.pond.render(ctx);
  }
}
