import { vec3 } from "gl-matrix";
import Renderer from "@webgl/Renderer";
import { ISheet } from "@theatre/core";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import AppService from "@/services/AppService";
import { PP_CONTRAST_INTRO, PP_VIGNETTE_COLOR_INTRO } from "./constants";
import lerp from "@/utils/Lerp";

export default class Scene1PostProcessing {
  private postProcessBoomS = { value: 0 };
  private postProcessBoomM = { value: 0 };
  private postProcessBoomL = { value: 0 };
  private postProcessCoeffS: TheatreFloat;
  private postProcessCoeffM: TheatreFloat;
  private postProcessCoeffL: TheatreFloat;

  private postProcessProgress = { value: 0 };
  private postProcessProgressCoeff: TheatreFloat;

  private vignetteBlurStrength = { value: 0 };
  private vignetteBlurStrengthCoeff: TheatreFloat;

  private vignetteBlurStart = { value: 0 };
  private vignetteBlurStartCoeff: TheatreFloat;

  startcontrast: number

  constructor(private renderer: Renderer, private sheetPerfectVariants: ISheet[], private sheetSuccess: ISheet) {
  }

  async load(renderer: Renderer): Promise<any> {
    this.renderer = renderer;
  }

  start() {
    this.postProcessCoeffS = new TheatreFloat(this.postProcessBoomS, this.sheetPerfectVariants[0], "Post Process Boom S");
    this.postProcessCoeffM = new TheatreFloat(this.postProcessBoomM, this.sheetPerfectVariants[1], "Post process boom");
    this.postProcessCoeffL = new TheatreFloat(this.postProcessBoomL, this.sheetPerfectVariants[2], "Post Process Boom L");
    this.postProcessProgressCoeff = new TheatreFloat(this.postProcessProgress, this.sheetSuccess, "Post Process Progress");
    this.vignetteBlurStrengthCoeff = new TheatreFloat(this.vignetteBlurStrength, this.sheetSuccess, "Vignette Blur Strength");
    this.vignetteBlurStartCoeff = new TheatreFloat(this.vignetteBlurStart, this.sheetSuccess, "Vignette Blur Start");

    if (AppService.glapp.quality.level.isVignetteBlur) this.renderer.postprocess.post.add(this.renderer.postprocess.vignetteblur);
    this.renderer.postprocess.post.add(this.renderer.postprocess.frame);
    this.startcontrast = this.renderer.postprocess.contrast.contrast;
    this.renderer.postprocess.vignetteblur.size = 0.0;
    this.renderer.postprocess.vignetteblur.size = 0.02;
    this.renderer.postprocess.vignetteblur.vignetteSize = 0.6;
    this.renderer.postprocess.vignetteblur.effectStrength = 0.0;
  }

  stop() {
    // this.renderer.postprocess.vignette.color = vec3.fromValues(0.0, 0.0, 0.0);
    // this.renderer.postprocess.contrast.contrast = 1.07;
    this.renderer.postprocess.post.remove(this.renderer.postprocess.vignetteblur);
    this.renderer.postprocess.post.remove(this.renderer.postprocess.frame);

    this.postProcessCoeffS?.dispose();
    this.postProcessCoeffM?.dispose();
    this.postProcessCoeffL?.dispose();
    this.vignetteBlurStartCoeff?.dispose();
    this.postProcessProgressCoeff?.dispose();
    this.vignetteBlurStrengthCoeff?.dispose();
  }

  preRender(introOutroValue: number): void {
    const pp = this.renderer.postprocess;

    pp.vignetteblur.effectStrength = this.vignetteBlurStrength.value * (1 - introOutroValue);
    pp.vignetteblur.vignetteStart = this.vignetteBlurStart.value * (1 - introOutroValue);
    // this.renderer.postprocess.vignette.color[0] = lerp(this.endvignetteColor[0], this.startvignetteColor[0], introOutroValue);
    this.renderer.postprocess.contrast.contrast = lerp(PP_CONTRAST_INTRO, this.startcontrast, introOutroValue);
  }
}
