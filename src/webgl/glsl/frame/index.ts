import Program from "nanogl/program";
import Texture2D from "nanogl/texture-2d";
import BaseEffect from "nanogl-post/effects/base-effect";
import { vec2, vec3, vec4 } from "gl-matrix";

import Time from "@webgl/Time";

import code from "./frame.frag";
import preCode from "./frame_pre.frag";

export default class Frame extends BaseEffect {
  _code: string
  _preCode: string

  private aspectRatio = [1, 1];

  color = vec3.fromValues(234 / 255, 228 / 255, 203 / 255);
  noiseRepeat = 0.1;
  noiseOffset = vec2.fromValues(Math.random(), Math.random());
  borderWidth = [
    vec4.fromValues(0, 0, 0, 0),
    vec4.fromValues(0, 0, 0, 0),
    vec4.fromValues(0, 0, 0, 0),
  ];
  effectStrength = 1.0;

  constructor(private noiseTex: Texture2D) {
    super();
    this._preCode = preCode();
    this._code = code();
  }

  genCode(precode: string[], code: string[]) {
    precode.push(this._preCode);
    code.push(this._code);
  }

  init() {}
  release() {}

  setupProgram(prg: Program) {
    prg.uFrameTime(Time.time);
    prg.uFrameColor(this.color);
    prg.uFrameNoise(this.noiseTex);
    prg.uFrameAspect(this.aspectRatio);
    prg.uFrameStrength(this.effectStrength);
    prg.uFrameNoiseOffset(this.noiseOffset);
    prg.uFrameNoiseRepeat(this.noiseRepeat);
    prg.uFrameBorderWidth1(this.borderWidth[0]);
    prg.uFrameBorderWidth2(this.borderWidth[1]);
    prg.uFrameBorderWidth3(this.borderWidth[2]);
  }

  resize(w: number, h: number) {
    if (w === 0 || h === 0) return;
    this.aspectRatio = [w / h, 1];
  }

  preRender() {}
}
