
import BaseEffect, { EffectDependency } from "nanogl-post/effects/base-effect";

import Texture from "nanogl/texture";
import Texture2D from "nanogl/texture-2d";

import code from "./chromashift.glsl";
import preCode from "./chromashift_pre.glsl";
import Program from "nanogl/program";

const TDATA = new Uint8Array(3 * 3);
TDATA[0] = 0xFF;
TDATA[4] = 0xFF;
TDATA[8] = 0xFF;

class Chromashift extends BaseEffect {

  preRender(): void {
  }

  _code: string;
  _preCode: string;
  _rgbTex: Texture2D;
  amount: number;


  constructor() {
    super();

    this._flags |= EffectDependency.LINEAR;

    this._code = code();
    this._preCode = preCode();

    this._rgbTex = null;

    this.amount = 0.015;

  }


  init() {
    const gl = this.post.gl;
    this._rgbTex = new Texture(gl, gl.RGB);
    this._rgbTex.fromData(3, 1, TDATA);
    this._rgbTex.clamp();
    this._rgbTex.setFilter(true, false, false);
  }


  release() {
    this._rgbTex.dispose();
    this._rgbTex = null;
  }


  genCode(precode: string[], code: string[]) {
    precode.push(this._preCode);
    code.push(this._code);
  }


  setupProgram(prg: Program) {

    if (prg.tChromaShiftTex)
      prg.tChromaShiftTex(this._rgbTex);

    prg.uAmount(this.amount);

  }

  resize() { }

}
export default Chromashift;