import Renderer from "@webgl/Renderer";
import RenderMask from "@webgl/core/RenderMask";
import Background, { BackgroundType } from "../Scene2/utils/Background";
import { vec3, vec4 } from "gl-matrix";
import { ISheet } from "@theatre/core";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import gui from "@webgl/dev/gui";
import AppService from "@/services/AppService";
import TheatreRgb from "@webgl/theatre/TheatreRgb";
import { OUTRO_TOP_COLOR, OUTRO_MID_COLOR, OUTRO_BOT_COLOR } from "./constants";

export default class ConclusionBackground {

  loaded: boolean;

  background: Background;

  sheet: ISheet;

  topColorPos: TheatreFloat;
  midColorPos: TheatreFloat;
  botColorPos: TheatreFloat;

  topColor: TheatreRgb;
  midColor: TheatreRgb;
  botColor: TheatreRgb;

  constructor(private renderer: Renderer) {


    this.sheet = AppService.state.machine.context.theatreProject.project.sheet("conclusion / bg");
    this.background = new Background(this.renderer, BackgroundType.LINEAR_3_STOPS);
    this.background.setUseClampedMix(true);

    /// #if DEBUG
    const fd = gui.folder("Conclusion");
    fd.addColor(this.background, "topColor");
    fd.addColor(this.background, "middleColor");
    fd.addColor(this.background, "bottomColor");
    fd.addColor(this.background, "transitionTopColor");
    fd.addColor(this.background, "transitionMiddleColor");
    fd.addColor(this.background, "transitionBottomColor");
    /// #endif
  }



  async load () {
    await Promise.all([
      this.background.load(),
    ]);

    this.background.onLoaded();
    this.loaded = true;
  }

  start() {
    this.sheet.sequence.play();
    this.topColorPos = new TheatreFloat({value: OUTRO_TOP_COLOR[3]}, this.sheet, "topPos");
    this.midColorPos = new TheatreFloat({value: OUTRO_MID_COLOR[3]}, this.sheet, "midPos");
    this.botColorPos = new TheatreFloat({value: OUTRO_BOT_COLOR[3]}, this.sheet, "botPos");
    this.topColor = new TheatreRgb(vec3.fromValues(OUTRO_TOP_COLOR[0], OUTRO_TOP_COLOR[1], OUTRO_TOP_COLOR[2]), this.sheet, "topColor");
    this.midColor = new TheatreRgb(vec3.fromValues(OUTRO_MID_COLOR[0], OUTRO_MID_COLOR[1], OUTRO_MID_COLOR[2]), this.sheet, "midColor");
    this.botColor = new TheatreRgb(vec3.fromValues(OUTRO_BOT_COLOR[0], OUTRO_BOT_COLOR[1], OUTRO_BOT_COLOR[2]), this.sheet, "botColor");
    this.background.start();
  }

  stop() {
    this.topColorPos.dispose();
    this.midColorPos.dispose();
    this.botColorPos.dispose();
    this.topColor.dispose();
    this.midColor.dispose();
    this.botColor.dispose();

    this.background.stop();
    this.sheet.sequence.pause();
    this.sheet.sequence.position = 0;
  }

  playIntro() {

  }

  preRender() {
    this.background.topColor.set([...this.topColor.rgb, this.topColorPos.value]);
    this.background.middleColor.set([...this.midColor.rgb, this.midColorPos.value]);
    this.background.bottomColor.set([...this.botColor.rgb, this.botColorPos.value]);
  }

  rttPass() {
  }

  render() {
    this.background.render(this.renderer.context.withMask(RenderMask.OPAQUE));
  }
}