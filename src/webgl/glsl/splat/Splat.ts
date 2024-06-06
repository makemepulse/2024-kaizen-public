import BaseEffect from "nanogl-post/effects/base-effect";
import preCode from "./splat_pre.frag";
import code from "./splat.frag";
import Program from "nanogl/program";
import Time from "@webgl/Time";
const G_SIZE = 128;
export default class Splat extends BaseEffect {
  _preCode: string
  _code: string
  effectStrength = 1.0
  h = 2.0
  lacunarity = 1.0
  frequency = 1.4
  octaves = 2.0
  scale = 1.0
  speed = 2.0
  constructor() {
    super();
    this._preCode = preCode();
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
    prg.uSplatStrength(this.effectStrength);
    prg.uTimeSplat((Time.scaledTime * 0.0001));
    prg.uH(this.h);
    prg.uLacunarity(this.lacunarity);
    prg.uFreq(this.frequency);
    prg.uOctaves(this.octaves);
    prg.uScaleSplat(this.scale);
    prg.uSpeedSplat(this.speed);
  }
  preRender() { }
  resize(w: number, h: number) { }
}
