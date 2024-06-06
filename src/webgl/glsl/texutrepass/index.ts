import BaseEffect from "nanogl-post/effects/base-effect";
import code from "./texutrepass.frag";
import preCode from "./texutrepass_pre.frag";
import Program from "nanogl/program";
import Time from "@webgl/Time";
import Texture2D from "nanogl/texture-2d";
import Renderer from "@webgl/Renderer";


export const DEFAULT_TEXTURE_LUMINOSITY = 1.24;
export const DOWN_TEXTURE_LUMINOSITY = 0.4;
export default class TexturePass extends BaseEffect {
  _preCode: string
  _code: string
  effectStrength = 1.0
  noise: Texture2D;
  texture: Texture2D;
  public textureRepeat = 3.1;
  public textureOpacity = 0.6;
  public aspectRatio = 1.0;
  public displacement = 0.07;
  public timeScale = 0.004;
  public textureLuminosity = DEFAULT_TEXTURE_LUMINOSITY;
  public backgroundInfluence = 0.5;

  constructor(private renderer: Renderer) {
    super();
    this._preCode = preCode();
    this._code = code();

    this.texture = renderer.scene.texturePool.get("tile").texture;
    this.noise = renderer.scene.texturePool.get("perlinNoise").texture;
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
    prg.uTexture(this.texture);
    prg.uNoise(this.noise);
    prg.uRepeat(this.textureRepeat);
    prg.uOpacity(this.textureOpacity);
    prg.uAspect(this.aspectRatio);
    prg.uTime2(Time.time);
    prg.uDisplacement(this.displacement);
    prg.uTimeScale(this.timeScale);
    prg.uTextureLuminosity(this.textureLuminosity);
    prg.uBackgroundLum(this.backgroundInfluence);
  }
  preRender() { }
  resize(w: number, h: number) {
    this.aspectRatio = w / h;
  }
}
