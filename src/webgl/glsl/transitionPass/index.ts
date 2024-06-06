import BaseEffect from "nanogl-post/effects/base-effect";
import code from "./texutrepass.frag";
import preCode from "./texutrepass_pre.frag";
import Program from "nanogl/program";
import Time from "@webgl/Time";
import Texture2D from "nanogl/texture-2d";
import Renderer from "@webgl/Renderer";

export default class TransitionPass extends BaseEffect {
  _preCode: string
  _code: string

  texture: Texture2D;

  constructor(private renderer: Renderer) {
    super();
    this._preCode = preCode();
    this._code = code();

    this.texture = new Texture2D(renderer.gl);
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
    // console.log(prg, this.texture);
    prg.uTransitionTex(this.texture);
    prg.uTransitionRotate(
      this.renderer.viewport.width > this.renderer.viewport.height ? 0 : 1
    );
  }
  preRender() {
    if(this.renderer.scene.transitionToPortail?.allImgLoaded && this.renderer.scene.transitionToPortail.atlas)
      this.texture = this.renderer.scene.transitionToPortail.atlas[0].texture;
  }
  resize(w: number, h: number): void {

  }
}
