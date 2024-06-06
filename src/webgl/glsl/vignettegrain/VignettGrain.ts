import BaseEffect from "nanogl-post/effects/base-effect";
import perCode from "./grain_pre.frag";
import code from "./grain.frag";
import Program from "nanogl/program";
import Time from "@webgl/Time";
const G_SIZE = 128;
export default class VignetteGrain extends BaseEffect {
  _preCode: string
  _code: string
  color: number[];
  curve: number;
  strength: number;

  constructor(private amount: number, private sharpness: number, color: number[], curve: number, strength: number) {
    super();
    this.sharpness = sharpness;
    this.color = color;
    this.curve = curve;
    this.strength = strength;
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
    prg.uTime((Time.scaledTime * 0.0001) % 1);
    const c = this.color;
    const s = this.strength;
    const max = Math.max(bw, bh);
    prg.uVignetteAspect(bw / max, bh / max, 0.5 * bw / max, 0.5 * bh / max);
    prg.uVignette(2.0 * (1.0 - c[0]) * s, 2.0 * (1.0 - c[1]) * s, 2.0 * (1.0 - c[2]) * s, this.curve);
  }
  preRender() { }
  resize(w: number, h: number) { }
}
