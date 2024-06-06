import gsap from "gsap";
import type Stars from "./Stars";
import lerp from "@/utils/Lerp";
import { vec3 } from "gl-matrix";
import Delay from "@/core/Delay";
import type { Clouds } from "./Clouds";
import { Subscription } from "xstate";
import Renderer from "@webgl/Renderer";
import AppService from "@/services/AppService";
import type IntroBackground from "./IntroBackground";
import { ISheet, onChange } from "@theatre/core";
import { RenderContext } from "@webgl/core/Renderer";
import TheatreBool from "@webgl/theatre/TheatreBool";
import { Activity } from "@webgl/activities/Activity";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import type IntroPerspectiveCam from "./IntroPerspectiveCam";
import WebglLoading from "@/store/modules/WebglLoading";
import GLState, { LocalConfig } from "nanogl-state/GLState";
import AudioManager, { AUDIO_ID } from "@/core/audio/AudioManager";
import { PP_CONTRAST_INTRO, PP_VIGNETTE_COLOR_INTRO } from "../Scene1/constants";

const V3 = vec3.create();

export default class Intro implements Activity {

  cfg: LocalConfig;

  introSheet: ISheet;
  introTransitionSheet: ISheet;
  sequencePos: number;
  sequenceTime: number;
  sequenceTransitionTime: number;
  unsubscribeSequenceLength: VoidFunction;
  unsubscribeSequenceTransitionLength: VoidFunction;

  postProcessTransitionTheatre: TheatreFloat;
  postProcessTransition = { value: 0 };

  titleScreenInTimeline: TheatreBool;

  perspectiveCam: IntroPerspectiveCam;
  introBackground: IntroBackground;
  clouds: Clouds;

  introStarted = false;
  introPlaying = false;
  isSkipped = false;
  hasClicked = false;

  changeStateSubscription: Subscription;
  startVignetteColor: vec3;
  startContrast: number;
  startTextureOpacity: number;

  stars: Stars;

  secondTlStarted = false;

  constructor(private renderer: Renderer) {

    window.addEventListener("click", this.onClick);
    window.addEventListener("touchstart", this.onClick);
    window.addEventListener("keyup", this.onKeyUp);
    // Sheet from loader to title
    this.introSheet = AppService.state.machine.context.theatreProject.project.sheet("intro");
    // Sheet from title to scene
    this.introTransitionSheet = AppService.state.machine.context.theatreProject.project.sheet("intro-transition");

    this.cfg = GLState.get(this.renderer.gl).config()
      .depthMask(false)
      .enableDepthTest(false)
      .enableBlend(true)
      .blendFuncSeparate(this.renderer.gl.SRC_ALPHA, this.renderer.gl.ONE_MINUS_SRC_ALPHA, this.renderer.gl.ONE, this.renderer.gl.ONE_MINUS_SRC_ALPHA);
  }

  changeState = async (state: any) => {
    if (state.matches("intro.voice_over") && !this.introPlaying) {
      this.introPlaying = true;
      await Delay(1500);
      this.clouds.onClick();
      AudioManager.playIntro();
      this.renderer.scene.isOutroPlaying.value = true;
      this.introSheet.sequence.play().then(() => {
        if (!AppService.state.getSnapshot().context.introSkipped) { // If not skipped
          this.startSecondTl();
          this.showTitleScreen(true);
        }
      });
    }

    if (state.event?.type === "SKIP_INTRO") {
      this.isSkipped = true;
      AudioManager.skipIntro();
      const duration = 5;
      this.showTitleScreen(true);
      await this.clouds.goToTlEnd(); // Wait for clouds fade-out before tl stops
      this.introSheet.sequence.pause();
      this.clouds.timelineCloudsDone = true;

      const tl = gsap.timeline({
        onComplete: () => {
          this.startSecondTl(true);
        }
      });
      tl.add(this.introBackground.goToTlEnd(duration), 0);
    }
  }

  startSecondTl(skip = false) {
    if (this.secondTlStarted) return;
    this.secondTlStarted = true;
    this.introBackground.useTransitionSheet();
    if (!skip) AudioManager.fadeOut(AUDIO_ID.INTRO_VO);
    // AudioManager.fadeOut(AUDIO_ID.INTRO, 6 * 1000);
    // if(!skip) AudioManager.playIntroPart2();
    // AudioManager.fadeOutWithDelay(AUDIO_ID.INTRO, skip ? 5000 : 20500, 2000);
    this.introTransitionSheet.sequence.play().then(() => {
      // AudioManager.fadeOut(AUDIO_ID.INTRO, 200);
      AppService.state.send("NEXT");
      this.renderer.scene.isOutroPlaying.value = false;
    });
  }

  onClick = () => {
    if (this.hasClicked) return;

    const state = AppService.state.getSnapshot();
    if (!state.matches("intro.loader.ready")) return;

    AudioManager.playUI("kaizen_cta");
    this.hasClicked = true;
    AppService.state.send("NEXT");
  }

  onKeyUp = (e: KeyboardEvent) => {
    if (e.key !== " " || this.hasClicked) return;
    this.onClick();
  }

  async load(): Promise<any> {

    const { Clouds } = await import("./Clouds");
    const { default: IntroBackground } = await import("./IntroBackground");
    const { default: IntroPerspectiveCam } = await import("./IntroPerspectiveCam");
    this.perspectiveCam = new IntroPerspectiveCam(this.renderer);
    this.introBackground = new IntroBackground(this.renderer);
    this.clouds = new Clouds(this.renderer);
    this.introBackground.introSheet = this.introSheet;
    this.perspectiveCam.introSheet = this.introSheet;
    this.perspectiveCam.introTransitionSheet = this.introTransitionSheet;
    this.clouds.introSheet = this.introSheet;

    this.introBackground.introTransitionSheet = this.introTransitionSheet;
    this.perspectiveCam.introTransitionSheet = this.introTransitionSheet;
    this.clouds.introTransitionSheet = this.introTransitionSheet;

    await Promise.all([this.introBackground.load(), this.clouds.load()]);
  }

  unload(): void {
  }

  showTitleScreen = (value: boolean) => {
    const { showTitle } = AppService.state.getSnapshot().context;
    if (value && !showTitle) {
      AppService.state.send("SET_SHOW_TITLE");
    }
  }

  async start() {
    const Stars = (await import("./Stars")).default;
    this.stars = new Stars(this.renderer, 20, 2);
    this.stars.introSheet = this.introSheet;
    this.stars.introTransitionSheet = this.introTransitionSheet;
    this.isSkipped = false;
    this.sequencePos = 0;

    this.renderer.clearColor.set([0, 0.25, 0.4, 1]);

    this.changeStateSubscription = AppService.state.subscribe(this.changeState);

    this.unsubscribeSequenceLength = onChange(this.introSheet.sequence.pointer.length, (len) => {
      this.sequenceTime = len;
    });
    this.unsubscribeSequenceTransitionLength = onChange(this.introTransitionSheet.sequence.pointer.length, (len) => {
      this.sequenceTransitionTime = len;
    });

    this.titleScreenInTimeline = new TheatreBool(false, this.showTitleScreen, this.introSheet, "titleScreenIn");

    this.renderer.postprocess.enabled = true;
    this.startVignetteColor = vec3.fromValues(this.renderer.postprocess.vignette.color[0], this.renderer.postprocess.vignette.color[1], this.renderer.postprocess.vignette.color[2]);
    this.startContrast = this.renderer.postprocess.contrast.contrast;
    // this.startTextureOpacity = this.renderer.postprocess.texturepass.textureOpacity;

    this.renderer.postprocess.texturepass.textureLuminosity = 0.4;

    this.perspectiveCam.start();
    this.introBackground.start();
    this.clouds.start();
    this.stars.start();

    this.postProcessTransitionTheatre = new TheatreFloat(this.postProcessTransition, this.introTransitionSheet, "postProcessTransition");

    AppService.state.send("INTRO_READY");
  }

  stop(): void {
    if (!this.unsubscribeSequenceLength) return;
    this.unsubscribeSequenceLength();
    this.unsubscribeSequenceTransitionLength();
    this.renderer.clearColor.set([1, 1, 1, 1]);
    this.changeStateSubscription.unsubscribe();
    this.introBackground.stop();
    this.perspectiveCam.stop();
    this.clouds.stop();
    this.stars.stop();
    this.postProcessTransitionTheatre.dispose();
    window.removeEventListener("click", this.onClick);
    window.removeEventListener("touchstart", this.onClick);
    window.removeEventListener("keyup", this.onKeyUp);
  }

  rttPass(): void {
    if (!this.stars) return;
    this.introBackground.rttPass();
  }

  // RENDER
  preRender(): void {
    if (!this.stars) return;
    if (WebglLoading.loaded / WebglLoading.toLoad > 0.8 && !this.introStarted) {
      this.introStarted = true;
      // this.clouds.playIntro();
      this.introBackground.playIntro();
    }

    // if (this.postProcessTransition.value > 0) this.lerpPostProcess();

    this.sequencePos = this.isSkipped
      ? lerp(this.sequencePos, this.sequenceTime, 0.1)
      : this.introSheet.sequence.position;
    this.renderer.scene.currOutroPercentage.value = this.sequenceTime + this.sequenceTransitionTime > 0
      ? (this.sequencePos + this.introTransitionSheet.sequence.position) / (this.sequenceTime + this.sequenceTransitionTime)
      : 0;

    this.perspectiveCam.preRender();
    this.introBackground.preRender();
    this.clouds.preRender();
    this.stars.preRender();
  }

  lerpPostProcess() {
    this.renderer.postprocess.vignette.color = vec3.lerp(V3, this.startVignetteColor, PP_VIGNETTE_COLOR_INTRO, this.postProcessTransition.value);
    this.renderer.postprocess.contrast.contrast = lerp(this.startContrast, PP_CONTRAST_INTRO, this.postProcessTransition.value);
  }

  render(ctx: RenderContext): void {
    if (!this.stars) return;
    this.introBackground.render();
    this.cfg.apply();
    this.clouds.render();
    this.stars.render(ctx);
  }
}