import BaseEffect from "nanogl-post/effects/base-effect";
import perCode from "./vignettegrain_pre.frag";
import code from "./vignettegrain.frag";
import Program from "nanogl/program";
import Time from "@webgl/Time";
const G_SIZE = 128;
export default class VignetteGrain extends BaseEffect {
  _preCode: string
  _code: string
  effectStrength = 1.0
  constructor(private amount: number, private sharpness: number, private vignetteStart: number, private vignetteSize: number) {
    super();
    this._preCode = perCode();
    this._code = code();
  }
  genCode(precode: string[], code: string[]) {
    precode.push(this._preCode);
    code.push(this._code);
  }
  init() {
  }
  release() {
  }
  setupProgram(prg: Program) {
    const a = this.amount * window.devicePixelRatio;
    const ig = 1 / G_SIZE, bw = this.post.bufferWidth, bh = this.post.bufferHeight, ms = 1 - this.sharpness;
    prg.uGrainCoord(ig * bw, ig * bh, 0.5 * ms * ig, 0.5 * ms * ig);
    prg.uGrainScaleBias(2 * a, -a);
    prg.uVignetteStrength(this.vignetteSize);
    prg.uVignetteStart(this.vignetteStart);
    prg.uEffectStrength(this.effectStrength);
    prg.uTime((Time.scaledTime * 0.0001) % 1);
    prg.uGrainRatio(this.post.renderWidth / this.post.renderHeight);
  }
  preRender() { }
  resize(w: number, h: number) { }
}
