import Time from "@webgl/Time";
import { Ref, ref } from "vue";
import { vec3 } from "gl-matrix";
import gui from "@webgl/dev/gui";
import Delay from "@/core/Delay";
import gsap, { Sine } from "gsap";
import Camera from "nanogl-camera";
import { Subscription } from "xstate";
import Renderer from "@webgl/Renderer";
import Gltf from "nanogl-gltf/lib/Gltf";
import FrameManager from "./FrameManager";
import AppService from "@/services/AppService";
import Viewport from "@/store/modules/Viewport";
import { toStatePaths } from "xstate/lib/utils";
import { ISheet, onChange } from "@theatre/core";
import { RenderContext } from "@webgl/core/Renderer";
import { Activity } from "@webgl/activities/Activity";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import GltfResource from "@webgl/resources/GltfResource";
import PerspectiveLens from "nanogl-camera/perspective-lens";
import { setSceneDuration, setSceneStepValues } from "@/store/modules/Scene";
import AudioManager, { SCENE_AUDIO_AMBIENT_ID, SCENE_AUDIO_AMBIENT_LAYER_ID } from "@/core/audio/AudioManager";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";

const AUTO_RELEASE_TIME = 100;

const AMBIENT_VOLUME = 0.75;
const VOICE_VOLUME = 0.75;
const UI_VOLUME = 0.5;

export const BLOCK_HOLD_DOWN_AFTER_RELEASE_TIME = 1000;
export const BLOCK_HOLD_AFTER_RELEASE_TIME = 100;

export default class Scene implements Activity {

  static currentStepValues: number[];

  gltf: Gltf;

  resource: GltfResource;

  matOverride: MaterialOverrideExtension;

  focus: number;

  paused = false;

  previousState = "";

  changeStateSubscription: Subscription;

  cameraInitialPosition: vec3 = vec3.fromValues(1, 1, 1);
  cameraLookAt: vec3 = vec3.fromValues(0, 0, 0);

  mousePosition = { x: 0, y: 0 } as { x: number; y: number };

  touchStartTime = 0;

  sceneId = -1

  sheetSuccess: ISheet
  sheetPerfect: ISheet
  sheetDownhill: ISheet;
  sheetIntro: ISheet
  sheetOutro: ISheet

  isLoaded = false;
  skipIntro = false;
  waitingStart = false;
  isIntroPlaying = false;
  isOutroPlaying = false;

  introTitleRef: Ref<number>

  introTheatreProgress: TheatreFloat;
  progressIntro = { value: 0 };

  holdingPercent = 0;
  holdingPrecedentValue = 0;

  coolDownPeriod = 5

  afterHoldTime = 0

  stepValues = [0.01, 0.33, 0.66, 1.0];

  frameManager: FrameManager;

  unsubscribeSuccessLength: VoidFunction
  unsubscribePerfectPlay: VoidFunction
  unsubscribeIntroLength: VoidFunction
  unsubscribeOutroLength: VoidFunction

  perfectSequencePlaying = false;

  isPerfectRelease = false

  firstReleaseDone = false
  firstPerfectDone = false

  outroSequenceTime: number;
  introSequenceTime: number;

  unblockReleaseTO = -1;
  unblockDownReleaseTO = -1;

  jumpCounter = 0;

  path = "scene1/blocking.gltf";

  constructor(protected renderer: Renderer, protected id: number) {
    this.sheetSuccess = AppService.state.machine.context.theatreProject.project.sheet(`scene${this.id}-success`);
    this.sheetDownhill = AppService.state.machine.context.theatreProject.project.sheet(`scene${this.id}-downhill`);
    this.sheetPerfect = AppService.state.machine.context.theatreProject.project.sheet(`scene${this.id}-perfect`);
    this.sheetIntro = AppService.state.machine.context.theatreProject.project.sheet(`scene${this.id}-intro`);
    this.sheetOutro = AppService.state.machine.context.theatreProject.project.sheet(`scene${this.id}-outro`);
    this.matOverride = new MaterialOverrideExtension();
    this.introTitleRef = ref(0);
    this.frameManager = new FrameManager(
      this.renderer.postprocess.frame, this.sheetSuccess
    );
  }

  async load(): Promise<any> {
  }

  onLoaded(): void {
    /* CAMERA FOV */
    const isDesktop = window.innerWidth >= 1050 || !("ontouchstart" in window);
    let focus = 0.95;
    if (!isDesktop) {
      focus = 0.77;
    }
    (this.renderer.cameras.camera.lens as PerspectiveLens).setHorizontalFov(
      focus
    );

    this.setupLighting();

    this.isLoaded = true;

    if (this.waitingStart) {
      this.waitingStart = false;
      this.start();
    }
  }

  unload(): void { }

  start(): void {
    if (!this.isLoaded) {
      this.waitingStart = true;
      return;
    }

    this.isPerfectRelease = false;
    this.renderer.scene.blockRelease = false;
    this.renderer.scene.showTitle.value = false;
    this.afterHoldTime = 0;
    Scene.currentStepValues = this.stepValues;
    this.isOutroPlaying = false;
    this.renderer.scene.isOutroPlaying.value = false;
    this.renderer.scene.firstRelease.value = false;
    this.renderer.scene.currentScene = this;

    this.introTheatreProgress = new TheatreFloat(this.progressIntro, this.sheetIntro, "title gsap intro progress");
    this.changeStateSubscription = AppService.state.subscribe(this.changeState);
    this.renderer.scene.holdValue = this.holdingPrecedentValue = this.renderer.scene.hold = 0;
    this.renderer.scene.isHolding = false;
    this.renderer.scene.blockHold = true;
    this.unsubscribeSuccessLength = onChange(this.sheetSuccess.sequence.pointer.length, (len) => {
      this.renderer.scene.holdingSequenceTime = len;
      setSceneDuration(len);
      setSceneStepValues(this.stepValues);
    });
    this.unsubscribeOutroLength = onChange(this.sheetOutro.sequence.pointer.length, (len) => {
      this.outroSequenceTime = len;
    });
    this.renderer.scene.currIntroPercentage.value = 0;
    this.unsubscribeIntroLength = onChange(this.sheetIntro.sequence.pointer.length, (len) => {
      this.introSequenceTime = len;
    });
    this.renderer.scene.currOutroPercentage.value = 0;
    // this.unsubscribePerfectPlay = onChange(this.sheetPerfect.sequence.pointer.playing, (playing) => {
    //   console.log("sheet perfect playing", playing)
    //   this.perfectSequencePlaying = playing;
    // });
    /* CAMERA START */
    if (!Viewport.isDesktop) {
      const rootElement = document.documentElement;
      rootElement.classList.add("prevent-select");
    }

    const cam: Camera = this.renderer.cameras.camera;
    // vec3.copy(cam.position, this.cameraInitialPosition);

    // cam.lookAt(this.cameraLookAt);
    // cam.invalidate();
    // cam.updateWorldMatrix();
    cam.updateViewProjectionMatrix(
      this.renderer.viewport.width,
      this.renderer.viewport.height
    );

    // console.log("start activity " + this.id);


    /// #if DEBUG
    const url = new URL(window.location.href);
    const searchParams = new URLSearchParams(url.search);
    this.skipIntro = searchParams.has("skipIntro");
    if (this.skipIntro) {
      this.sheetIntro.sequence.position = 100;
      this.renderer.scene.blockHold = false;
      this.renderer.scene.transitionToPortail.spriteManager.reset();
    } else {

      const hasReachedPortail = AppService.state.getSnapshot().context.hasReachedPortail;
      if(!hasReachedPortail) AudioManager.playVoiceWithDelay(this.id, 1, VOICE_VOLUME, 1500);
      this.isIntroPlaying = true;
      this.renderer.scene.isIntroPlaying.value = true;
      if (hasReachedPortail)
        this.renderer.scene.playTransitionToPortail();

      this.sheetIntro.sequence.play({ rate: hasReachedPortail ? 20 : 1 }).then(() => {
        this.isIntroPlaying = false;
        this.renderer.scene.isIntroPlaying.value = false;
        this.renderer.scene.blockHold = false;
      });
    }
    /// #else
    // Start the intro sequence
    AudioManager.playVoiceWithDelay(this.id, 1, VOICE_VOLUME, 1500);
    this.isIntroPlaying = true;
    this.renderer.scene.isIntroPlaying.value = true;

    const hasReachedPortail = AppService.state.getSnapshot().context.hasReachedPortail;
    if (hasReachedPortail)
      this.renderer.scene.playTransitionToPortail();

    this.sheetIntro.sequence.play({ rate: hasReachedPortail ? 20 : 1 }).then(() => {
      this.isIntroPlaying = false;
      this.renderer.scene.isIntroPlaying.value = false;
      this.renderer.scene.blockHold = false;
    });
    /// #endif

    // reset sequences
    this.sheetOutro.sequence.position = 0;
    this.sheetSuccess.sequence.position = 0;
    this.sheetPerfect.sequence.position = 0;

    // start frame manager
    this.frameManager.start();

    // Add event listener mouse move
    window.addEventListener("mousemove", this.onMouseMove);

    // Add event listener pointer
    window.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);

    // Reset mouse position
    this.mousePosition = { x: 0, y: 0 };

    /// #if DEBUG
    gui.clearFolder("General Scene");
    const f = gui.folder("General Scene");
    f.btn("Send Success", () => AppService.state.send("SUCCESS_INTERACTION"));
    f.btn("Send Perfect", () => AppService.state.send("PERFECT_INTERACTION"));
    /// #endif

    AppService.glapp.startProfile();
  }

  stop(): void {
    this.renderer.scene.showTitle.value = false;
    this.frameManager.stop();
    this.unsubscribeSuccessLength();
    this.unsubscribeIntroLength();
    this.unsubscribeOutroLength();
    this.introTheatreProgress.dispose();
    // this.unsubscribePerfectPlay();
    // console.log("stop activity " + this.id);
    this.changeStateSubscription.unsubscribe();
    window.removeEventListener("mousemove", this.onMouseMove);
    window.removeEventListener("pointerdown", this.onPointerDown);
    window.removeEventListener("pointerup", this.onPointerUp);
  }

  changeState = async (state: any) => {
    if (this.previousState === toStatePaths(state.value)[0].join(".")) return;
    else this.previousState = toStatePaths(state.value)[0].join(".");
    // console.log(state.value);
    // console.log("change state " + this.previousState);
  };

  checkRelease() {
    this.renderer.scene.firstRelease.value = true
    if (this.isPerfectRelease && !this.renderer.scene.showTitle.value) {
      this.renderer.scene.showTitle.value = true;
      AudioManager.playVoice(this.id, 4, VOICE_VOLUME);
    }
    this.isPerfectRelease = false;
  }

  checkFirstPerfect() {
    if(this.isPerfectRelease && !this.firstPerfectDone) {
      AudioManager.playSuperJump();
      this.firstPerfectDone = true;
    }
    if(this.isPerfectRelease && this.firstPerfectDone) {
      AudioManager.playNextSuperJump();
    }
  }

  resetHoldTime() {
    this.afterHoldTime = 0;
  }

  async checkOutro(state: any) {
    if (state.matches("scene.outro")) {
      this.renderer.scene.blockHold = true;
      AudioManager.fadeOutWithDelay(SCENE_AUDIO_AMBIENT_ID[this.id - 1], (this.outroSequenceTime * 1000) - 2500, 2500);
      AudioManager.fadeOutWithDelay(SCENE_AUDIO_AMBIENT_LAYER_ID[this.id - 1], (this.outroSequenceTime * 1000) - 2500, 2500);
      await Delay(500);
      if (this.sheetOutro && this.sheetOutro.sequence) this.handleOutro();
    }
  }

  async handleOutro() {
    this.isOutroPlaying = true;
    this.renderer.scene.isOutroPlaying.value = true;
    let tw: gsap.core.Tween;
    if (this.renderer.scene.hold !== 0 && this.sceneId !== 4 && this.sceneId !== 2 && this.sceneId !== 1) {
      tw = gsap.to(this.renderer.scene, {
        hold: 0,
        duration: this.holdingPercent * this.coolDownPeriod,
        ease: Sine.easeOut,
        onUpdate: () => {
          this.sheetSuccess.sequence.position = this.renderer.scene.hold;
        }
      });
    }
    if (this.sceneId === 2 || this.sceneId === 1) {
      this.renderer.scene.blockHold = true;
      this.renderer.scene.blockRelease = true;
    }
    this.sheetOutro.sequence.play().then(() => {
      this.renderer.scene.blockHold = false;
      this.renderer.scene.blockRelease = false;
      this.renderer.scene.isOutroPlaying.value = false;
      if (tw) tw.kill();
      const hasReachedPortail = AppService.state.getSnapshot().context.hasReachedPortail;
      if (hasReachedPortail) {
        this.renderer.scene.prepareTransition(false);
        this.renderer.scene.playTransitionToPortail();
      } else {
        AppService.state.send("GO_TO_QUOTE");
      }
    });
  }

  onMouseMove = (e: MouseEvent) => {
    this.mousePosition.x = e.clientX;
    this.mousePosition.y = e.clientY;
  };

  onPointerDown = (e: PointerEvent) => {
    this.touchStartTime = Time.scaledTime;
  };

  onPointerUp = (e: PointerEvent) => {
    if (!this.previousState.match("scene.interacting.idle")) return;
    const duration = Time.scaledTime - this.touchStartTime;
    // if(duration > 1000 && duration < 2500) {
    //   AppService.state.send("PERFECT_INTERACTION");
    // }
    // else{
    //   AppService.state.send("SUCCESS_INTERACTION");
    // }
  };

  setupLighting() {
  }

  changeStep(step: number) {
    if(!this.renderer.scene.isGoingBack && (step === 2 || step === 3)) {
      if(step === 2) AudioManager.playUI("kaizen_ch-all_step1", UI_VOLUME);
      if(step === 3) AudioManager.playUI("kaizen_ch-all_step2", UI_VOLUME);
    }
  }

  preRender(): void {
    const scene = this.renderer.scene;
    const isPerfect = !AppService.state.state.toStrings().includes("scene.interacting.idle");
    this.introTitleRef.value = this.progressIntro.value;

    this.holdingPercent = scene.hold / scene.holdingSequenceTime;
    const currentSceneStep = AppService.state.state.context.sceneStep;
    const maxStep = this.stepValues.length - 1;

    if (this.holdingPercent >= this.stepValues[currentSceneStep] && this.holdingPrecedentValue < this.stepValues[currentSceneStep]) {
      AppService.state.send("INCREMENT_SCENE_STEP");
      this.changeStep(currentSceneStep + 1);
    }
    if (this.holdingPercent < this.stepValues[Math.min(currentSceneStep - 1, maxStep)] && this.holdingPrecedentValue >= this.stepValues[Math.min(currentSceneStep - 1, maxStep)]) {
      AppService.state.send("DECREMENT_SCENE_STEP");
      this.changeStep(currentSceneStep - 1);
    }

    if (scene.isHolding !== scene.wasHolding && !scene.isHolding && !scene.blockRelease) {
      // this.sheetPerfect.sequence.play().then(() => this.perfectSequencePlaying = false);
      AppService.state.send("PERFECT_INTERACTION");
    }

    if (scene.isHolding && this.holdingPercent >= 1 && !scene.blockRelease) {
      this.afterHoldTime += Time.scaledDt;
      if (this.afterHoldTime > AUTO_RELEASE_TIME && !this.isPerfectRelease) {
        this.isPerfectRelease = true;
        this.renderer.scene.isHolding = false;
        AppService.state.send("PERFECT_INTERACTION");
      }
    }

    if (!isPerfect && !AppService.state.state.context.theatreProject.sequenceDebugEnabled && !this.isOutroPlaying) {
      this.sheetSuccess.sequence.position = scene.hold;
    }

    if (this.isIntroPlaying) {
      this.renderer.scene.currIntroPercentage.value = this.sheetIntro.sequence.position / this.introSequenceTime;
    } else {
      this.renderer.scene.currIntroPercentage.value = 0;
    }

    if (this.isOutroPlaying) {
      this.renderer.scene.currOutroPercentage.value = this.sheetOutro.sequence.position / this.outroSequenceTime;
    } else {
      this.renderer.scene.currOutroPercentage.value = 0;
    }

    // if (this.isOutroPlaying) {
    //   this.sheetSuccess.sequence.position += (0 - this.sheetSuccess.sequence.position) * 0.002;
    //   this.holdingPercent = this.sheetSuccess.sequence.position / scene.holdingSequenceTime;
    // }

    // if (this.renderer.scene.isGoingBack && !AppService.state.state.context.theatreProject.sequenceDebugEnabled && !this.renderer.scene.blockHold) {
    //   this.sheetDownhill.sequence.position = scene.hold;
    // }

    if (this.holdingPercent - this.holdingPrecedentValue > 0 ) {
      if (scene.wasHolding !== scene.isHolding) {
        AudioManager.playHold(this.id, scene.holdValue);
      }
    }

    this.holdingPrecedentValue = this.holdingPercent;
  }

  rttPass(): void {
    this.renderer.scene.lighting.lightSetup.prepare(this.renderer.gl);
    this.renderer.scene.lighting.renderLightmaps((ctx: RenderContext) => {
      this.render(ctx);
    });
  }

  render(ctx: RenderContext): void {
  }
}
