import { vec4 } from "gl-matrix";
import gui from "@webgl/dev/gui";
import Delay from "@/core/Delay";
import Renderer from "@webgl/Renderer";
import { Gui } from "@webgl/dev/gui/api";
import AppService from "@/services/AppService";
import { toStatePaths } from "xstate/lib/utils";
import River from "@webgl/activities/Scene3/River";
import { RenderContext } from "@webgl/core/Renderer";
import AudioManager, { SCENE_AUDIO_AMBIENT_ID, SCENE_AUDIO_AMBIENT_LAYER_ID } from "@/core/audio/AudioManager";
import Fog from "@webgl/activities/Scene3/chunks/fog/Fog";
import TheatreProgress from "@webgl/theatre/TheatreProgress";
import Scene3Lights from "@webgl/activities/Scene3/Scene3Lights";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import Background, { BackgroundType } from "@webgl/activities/Scene2/utils/Background";
import { JUMP_SOUND_LIST, JUMP_SOUND_LIST_2, LAND_SOUND_LIST, SMALL_JUMP_SOUND_LIST } from "./soundlist";
import Scene, { BLOCK_HOLD_AFTER_RELEASE_TIME, BLOCK_HOLD_DOWN_AFTER_RELEASE_TIME } from "@webgl/activities/Scene/Scene";
import { BACKGROUND_BOTTOM_COLOR, BACKGROUND_BOTTOM_COLOR_HOLD, BACKGROUND_MIDDLE_COLOR, BACKGROUND_MIDDLE_COLOR_HOLD, BACKGROUND_TOP_COLOR, BACKGROUND_TOP_COLOR_HOLD, JUMP_STEPS, BACKGROUND_BOTTOM_ALPHA, BACKGROUND_MIDDLE_ALPHA, BACKGROUND_TOP_ALPHA, VOICE_VOLUME, UI_VOLUME } from "@webgl/activities/Scene3/constants";
import { BACKGROUND_TOP_COLOR as BACKGROUND_OUTRO_TOP_COLOR, BACKGROUND_MIDDLE_COLOR as BACKGROUND_OUTRO_MIDDLE_COLOR, BACKGROUND_BOTTOM_COLOR as BACKGROUND_OUTRO_BOTTOM_COLOR, BACKGROUND_TOP_ALPHA as BACKGROUND_OUTRO_TOP_ALPHA, BACKGROUND_MIDDLE_ALPHA as BACKGROUND_OUTRO_MIDDLE_ALPHA, BACKGROUND_BOTTOM_ALPHA as BACKGROUND_OUTRO_BOTTOM_ALPHA } from "@webgl/activities/Scene4/constants";
import { BACKGROUND_TOP_INTRO_COLOR } from "../Scene3/constants";

const MAX_VIGNETTE_START = 0.2;

const AMBIENT_VOLUME = 0.75;

export default class Scene3 extends Scene {
  /// #if DEBUG
  public static guiFolder: Gui;
  /// #endif

  river: River;
  background: Background;

  lights: Scene3Lights;
  fogChunk: Fog;
  ambientChunk: AmbientAddChunk;

  postprocessSuccess: TheatreProgress;
  postprocessPerfect: TheatreProgress;

  blurStart = MAX_VIGNETTE_START;
  blurAmount = 0;
  blurStartTarget = MAX_VIGNETTE_START;

  constructor(renderer: Renderer, id: number) {
    super(renderer, id);

    /// #if DEBUG
    Scene3.guiFolder = gui.folder("Scene 3");
    /// #endif

    this.stepValues = JUMP_STEPS;

    this.lights = new Scene3Lights(this.renderer);
    this.ambientChunk = new AmbientAddChunk();
    this.fogChunk = new Fog();

    this.river = new River(
      renderer, this.ambientChunk, this.fogChunk,
      this.sheetSuccess, this.sheetPerfect,
      this.sheetIntro, this.sheetOutro
    );

    this.background = new Background(this.renderer, BackgroundType.LINEAR_3_STOPS);
    this.background.topColor = vec4.fromValues(...BACKGROUND_TOP_COLOR, BACKGROUND_TOP_ALPHA);
    this.background.middleColor = vec4.fromValues(...BACKGROUND_MIDDLE_COLOR, BACKGROUND_MIDDLE_ALPHA);
    this.background.bottomColor = vec4.fromValues(...BACKGROUND_BOTTOM_COLOR, BACKGROUND_BOTTOM_ALPHA);
    this.background.setTransitionColors(
      vec4.fromValues(...BACKGROUND_TOP_COLOR_HOLD, 0.55),
      vec4.fromValues(...BACKGROUND_MIDDLE_COLOR_HOLD, 0.5),
      vec4.fromValues(...BACKGROUND_BOTTOM_COLOR_HOLD, 0.45),
    );
    this.background.setIntroColors(
      vec4.fromValues(...BACKGROUND_TOP_INTRO_COLOR, BACKGROUND_TOP_ALPHA),
      vec4.fromValues(...BACKGROUND_MIDDLE_COLOR, BACKGROUND_MIDDLE_ALPHA),
      vec4.fromValues(...BACKGROUND_BOTTOM_COLOR, BACKGROUND_BOTTOM_ALPHA),
    );
    this.background.setOutroColors(
      vec4.fromValues(...BACKGROUND_OUTRO_TOP_COLOR, BACKGROUND_OUTRO_TOP_ALPHA),
      vec4.fromValues(...BACKGROUND_OUTRO_MIDDLE_COLOR, BACKGROUND_OUTRO_MIDDLE_ALPHA),
      vec4.fromValues(...BACKGROUND_OUTRO_BOTTOM_COLOR, BACKGROUND_OUTRO_BOTTOM_ALPHA),
    );
    this.background.setUseClampedMix(true);

    /// #if DEBUG
    const bf = Scene3.guiFolder.folder("Background");
    bf.addColor(this.background, "topColor");
    bf.addColor(this.background, "middleColor");
    bf.addColor(this.background, "bottomColor");
    /// #endif
  }

  // --LOAD--

  override async load(): Promise<any> {

    this.renderer.startReflect();
    await Promise.all([
      this.river.load(),
      this.background.load()
    ]);

    this.onLoaded();
  }

  override onLoaded(): void {
    this.river.onLoaded();
    this.background.sheetOutro = this.sheetOutro;
    this.background.sheetIntro = this.sheetIntro;
    this.background.sheetSuccess = this.sheetSuccess;
    this.background.onLoaded();

    super.onLoaded();
  }

  // --START/STOP--

  override start(): void {
    super.start();

    AudioManager.fadeIn(SCENE_AUDIO_AMBIENT_ID[this.id - 1], AMBIENT_VOLUME, 3);
    AudioManager.fadeIn(SCENE_AUDIO_AMBIENT_LAYER_ID[this.id - 1], AMBIENT_VOLUME - 0.15, 3);

    if (this.waitingStart) return;

    this.postprocessSuccess = new TheatreProgress(0, this.updatePostprocessSuccess, this.sheetSuccess, "Post process");
    this.postprocessPerfect = new TheatreProgress(0, this.updatePostprocessPerfect, this.sheetPerfect, "Post process");

    this.renderer.reflect.groundHeight = -0.04;
    this.renderer.reflect.cameraDisto = -0.33;
    this.renderer.isReflect = true;

    this.renderer.clearColor.set([.20, .51, .608, 1]);

    if (AppService.glapp.quality.level.isVignetteBlur) this.renderer.postprocess.post.add(this.renderer.postprocess.vignetteblur);
    this.renderer.postprocess.post.add(this.renderer.postprocess.frame);

    this.renderer.postprocess.vignetteblur.size = 0.02;
    this.renderer.postprocess.vignetteblur.vignetteSize = 0.5;
    this.renderer.postprocess.texturepass.textureRepeat = 3.5;

    this.background.start();
    this.river.start(this.skipIntro);
    this.lights.start(this.renderer.scene.lighting);
  }

  override stop(): void {
    super.stop();

    this.postprocessSuccess.dispose();
    this.postprocessPerfect.dispose();

    this.background.stop();
    this.river.stop();
    this.lights.stop();

    this.renderer.isReflect = false;
    this.renderer.postprocess.vignetteblur.size = 0.01;
    this.renderer.postprocess.vignetteblur.vignetteSize = 0.47;
    this.renderer.postprocess.vignetteblur.vignetteStart = 0.11;
    this.renderer.postprocess.vignetteblur.effectStrength = 0;
    this.renderer.postprocess.texturepass.textureRepeat = 2.5;
    this.renderer.postprocess.post.remove(this.renderer.postprocess.vignetteblur);
    this.renderer.postprocess.post.remove(this.renderer.postprocess.frame);
  }

  // --LIGHTING--

  override setupLighting() {
    this.river.setupSceneLighting(this.renderer.scene.lighting);
  }

  // --STATE--

  override changeState = async (state: any) => {
    if (this.previousState === toStatePaths(state.value)[0].join(".")) return;
    else this.previousState = toStatePaths(state.value)[0].join(".");

    if (state.matches("scene.interacting.perfect")) {
      this.handlePerfect();
    }

    this.checkOutro(state);
  };

  // --PREPARE ANIM--

  async handlePerfect() {
    const holdVal = this.renderer.scene.holdRef.value;

    clearTimeout(this.unblockDownReleaseTO);
    clearTimeout(this.unblockReleaseTO);

    this.river.prepareJump(holdVal);

    this.sheetPerfect.sequence.position = 0;

    this.blurStartTarget = holdVal < this.stepValues[2]
      ? Math.random() * holdVal * 0.1
      : 0.1 + Math.random() * 0.1;

    this.jumpCounter++;

    AudioManager.stopHold(this.id);
    
    // Sound trigger
    const variant = holdVal < this.stepValues[1] ? 0 : holdVal < this.stepValues[2] ? 1 : 2;
    this.jumpSound();
    this.landingSound(variant);
    if (variant === 0) {
      AudioManager.playReactionsBrute(SMALL_JUMP_SOUND_LIST[Math.floor(Math.random() * SMALL_JUMP_SOUND_LIST.length)], UI_VOLUME);
    }
    if (variant === 1) {
      this.renderer.scene.blockHold = true;
      const randomLine = Math.floor(Math.random() * JUMP_SOUND_LIST.length);
      const randomVariant = Math.floor(Math.random() * JUMP_SOUND_LIST[randomLine].length);
      this.firstReleaseDone ? AudioManager.playReactionsBrute(JUMP_SOUND_LIST[randomLine][randomVariant], UI_VOLUME) : (this.firstReleaseDone = true, AudioManager.playVoice(this.id, 3, VOICE_VOLUME));
    }
    if (variant === 2) {
      const randomLine = Math.floor(Math.random() * JUMP_SOUND_LIST.length);
      const randomVariant = Math.floor(Math.random() * JUMP_SOUND_LIST[randomLine].length);
      AudioManager.playReactionsBrute(JUMP_SOUND_LIST[randomLine][randomVariant], UI_VOLUME);
    }
    this.checkFirstPerfect();
    this.renderer.scene.blockHold = true;
    this.renderer.scene.blockHoldDown = true;
    this.renderer.scene.blockRelease = true;
    this.sheetPerfect.sequence.play().then(() => {
      this.checkRelease();
      this.resetHoldTime();
      this.handlePerfectOver();
      // if((variant === 2 || this.jumpCounter === 10) && !this.firstPerfectDone) (this.firstPerfectDone = true, AudioManager.playVoice(this.id, 4, VOICE_VOLUME));
    });
  }

  async jumpSound() {
    AudioManager.playReactionsBrute(JUMP_SOUND_LIST_2[Math.floor(Math.random() * JUMP_SOUND_LIST_2.length)], 0.7);
  }

  async landingSound(variant: number) {
    if(variant === 0) await Delay(1000);
    else if(variant === 1) await Delay(1100);
    else if(variant === 2) await Delay(1400);
    else return;
    AudioManager.playReactionsBrute(LAND_SOUND_LIST[Math.floor(Math.random() * LAND_SOUND_LIST.length)], 0.7);
  }

  async handlePerfectOver() {
    this.renderer.scene.blockRelease = false;
    this.river.jumpEnded();
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

  override handleOutro(): Promise<void> {
    super.handleOutro();
    this.river.prepareOutro();
    return Promise.resolve();
  }

  // --ANIM--

  updatePostprocessSuccess = (progress: number) => {
    this.blurAmount = progress;
  }

  updatePostprocessPerfect = (progress: number) => {
    this.blurStart = MAX_VIGNETTE_START - progress * this.blurStartTarget;
  }

  // --RENDER--

  override preRender(): void {
    if (!this.isLoaded) return;

    super.preRender();

    this.river.preRender(this.isIntroPlaying, this.isOutroPlaying);
  }

  override rttPass(): void {
    if (!this.isLoaded) return;

    super.rttPass();
  }

  override render(ctx: RenderContext): void {
    if (!this.isLoaded) return;

    const blur = this.renderer.postprocess.vignetteblur;
    blur.vignetteStart = this.blurStart;
    blur.effectStrength = this.blurAmount;

    super.render(ctx);
    this.background.render(ctx);
    this.river.render(ctx);
  }
}
