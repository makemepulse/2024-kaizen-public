import { Ref, ref } from "vue";
import Renderer from "@webgl/Renderer";
import { Activity } from "@webgl/activities/Activity";
import ConclusionPerspectiveCam from "./ConclusionPerspectiveCam";
import AppService from "@/services/AppService";
import ConclusionBackground from "./ConclusionBackground";
import { ISheet, onChange } from "@theatre/core";
import { Clouds } from "./Clouds";
import GLState, { type LocalConfig } from "nanogl-state/GLState";
import TheatreBool from "@webgl/theatre/TheatreBool";

export default class Conclusion implements Activity {
  sheet: ISheet;
  sequenceTime: number;
  unsubscribeSequenceLength: VoidFunction;

  perspectiveCam: ConclusionPerspectiveCam;
  ConclusionBackground: ConclusionBackground;
  clouds: Clouds;

  showLogoRef: Ref<boolean>;
  showLogoTheatre: TheatreBool;

  isLoaded = false;
  waitingStart = false;
  introStarted = false;
  introFinished = false;
  blendCfg: LocalConfig;


  constructor(private renderer: Renderer) {
    const gl = renderer.gl;

    this.sheet = AppService.state.machine.context.theatreProject.project.sheet("conclusion");

    this.showLogoRef = ref(false);

    this.perspectiveCam = new ConclusionPerspectiveCam(this.renderer);
    this.ConclusionBackground = new ConclusionBackground(this.renderer);
    this.clouds = new Clouds(this.renderer);


    this.blendCfg = GLState.get(gl).config()
      .enableBlend()
      .blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  }

  async load(): Promise<any> {
    this.clouds.sheet = this.sheet;
    this.perspectiveCam.introSheet = this.sheet;

    await Promise.all([
      this.ConclusionBackground.load(),
      this.clouds.load()
    ]);

    this.onLoaded();
  }

  onLoaded() {
    this.isLoaded = true;
    if (this.waitingStart) {
      this.waitingStart = false;
      this.start();
    }
  }

  unload(): void {
  }

  start(): void {
    if (!this.isLoaded) {
      this.waitingStart = true;
      return;
    }

    this.showLogoTheatre = new TheatreBool(false, (val) => {
      this.showLogoRef.value = val;
    }, this.sheet, "Show Title");

    this.unsubscribeSequenceLength = onChange(this.sheet.sequence.pointer.length, (len) => {
      this.sequenceTime = len;
    });

    this.perspectiveCam.start();
    this.ConclusionBackground.start();
    this.clouds.start();

    this.renderer.scene.prepareTransition(false);
    this.sheet.sequence.play().then(async () => {
      this.renderer.scene.playTransitionToPortail();
    });

  }

  stop(): void {
    this.unsubscribeSequenceLength();

    this.ConclusionBackground.stop();
    this.perspectiveCam.stop();
    this.clouds.stop();

    this.showLogoTheatre.dispose();

    this.sheet.sequence.position = 0;
  }

  rttPass(): void {
    if (!this.isLoaded) return;

    this.ConclusionBackground.rttPass();
  }

  // RENDER
  preRender(): void {
    if (!this.isLoaded) return;

    this.renderer.scene.currIntroPercentage.value = this.sequenceTime > 0
      ? this.sheet.sequence.position / this.sequenceTime
      : 0;

    this.perspectiveCam.preRender();
    this.ConclusionBackground.preRender();
    this.clouds.preRender();
  }


  render() {
    if (!this.isLoaded) return;

    this.ConclusionBackground.render();
    this.blendCfg.apply();
    this.clouds.render();
  }
}