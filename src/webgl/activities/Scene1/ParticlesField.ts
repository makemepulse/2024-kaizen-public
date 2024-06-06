import Time from "@webgl/Time";
import { vec3 } from "gl-matrix";
import Program from "nanogl/program";
import Renderer from "@webgl/Renderer";
import Texture2D from "nanogl/texture-2d";
import Programs from "@webgl/glsl/programs";
import GLArrayBuffer from "nanogl/arraybuffer";
import { RenderContext } from "@webgl/core/Renderer";
import { ISheet, ISheetObject } from "@theatre/core";
import GLState, { LocalConfig } from "nanogl-state/GLState";

/// #if DEBUG
import Scene1 from "@webgl/activities/Scene1/Scene1";
/// #endif

const dataLength = 10;

export default class ParticlesField {

  static sheetSuccessObj: ISheetObject<{ flickerFactor: number, particlesSpeed: number, alpha: number }>;
  static sheetIntroObj: ISheetObject<{ alpha: number }>;
  static sheetOutroObj: ISheetObject<{ alpha: number }>;
  sheetSuccess: ISheet;
  sheetIntro: ISheet;
  sheetOutro: ISheet;

  vbuffer: GLArrayBuffer;

  prg: Program;
  cfg: LocalConfig;

  noiseTex: Texture2D;

  originalPositionY: number;

  localTime = 0;

  constructor(private renderer: Renderer, private count: number, private radius: number, private color: vec3, private strength: number, sheetSuccess: ISheet, sheetIntro: ISheet, sheetOutro: ISheet) {
    this.prg = Programs(renderer.gl).get("particles-field");

    this.noiseTex = this.renderer.scene.texturePool.get("turbulenceNoise").texture;

    this.sheetSuccess = sheetSuccess;
    this.sheetIntro = sheetIntro;
    this.sheetOutro = sheetOutro;

    this.vbuffer = new GLArrayBuffer(renderer.gl);
    this.vbuffer
      .attrib("aPosition", 3, renderer.gl.FLOAT)
      .attrib("aSettings", 4, renderer.gl.FLOAT)
      .attrib("aAge", 3, renderer.gl.FLOAT);

    this.vbuffer.attribPointer(this.prg);

    this.cfg = GLState.get(renderer.gl).config();
    this.cfg
      .enableDepthTest(true)
      .depthMask(false)
      .enableBlend(true)
      .blendEquation(renderer.gl.FUNC_ADD)
      .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE);

    /// #if DEBUG
    const f = Scene1.guiFolder.folder("Particles field");
    f.addColor(this, "color");
    /// #endif
  }

  start(center: vec3) {
    if (!ParticlesField.sheetSuccessObj && this.sheetSuccess) {
      ParticlesField.sheetSuccessObj = this.sheetSuccess.object("Particles field", { flickerFactor: 0, particlesSpeed: 0, alpha : 0 });
    }
    if (!ParticlesField.sheetIntroObj && this.sheetIntro) {
      ParticlesField.sheetIntroObj = this.sheetIntro.object("Particles field", { alpha: 0 });
    }
    if (!ParticlesField.sheetOutroObj && this.sheetOutro) {
      ParticlesField.sheetOutroObj = this.sheetOutro.object("Particles field", { alpha: 1 });
    }

    const vdata = new Float32Array(this.count * dataLength);

    for (let i = 0; i < this.count; i++) {
      // X, startY (= age at birth), Z
      vdata[i * dataLength + 0] = center[0] + Math.random() * this.radius * 2 - this.radius;
      vdata[i * dataLength + 1] = center[1] + Math.random() * this.radius * 0.8 - this.radius;
      vdata[i * dataLength + 2] = center[2] + Math.random() * this.radius * 2 - this.radius;

      // Scale, Opacity, SpeedY, SpeedZ
      vdata[i * dataLength + 3] = Math.random() * .2 * this.strength + .2;
      vdata[i * dataLength + 4] = 0.8;
      vdata[i * dataLength + 5] = Math.random() * 1.5;
      vdata[i * dataLength + 6] = 100 + Math.random() * 0.4 + 0.8;

      // Age (Max Life) on different axis
      vdata[i * dataLength + 7] = 80;
      vdata[i * dataLength + 8] = 50;
      vdata[i * dataLength + 9] = 220;
    }

    this.originalPositionY = center[1];

    this.vbuffer.data(vdata);
  }

  dispose(): void {
    if (ParticlesField.sheetSuccessObj && this.sheetSuccess) {
      this.sheetSuccess.detachObject("Particles field");
    }
    if (ParticlesField.sheetIntroObj && this.sheetIntro) {
      this.sheetIntro.detachObject("Particles field");
    }
    if (ParticlesField.sheetOutroObj && this.sheetOutro) {
      this.sheetOutro.detachObject("Particles field");
    }
  }

  preRender(): void {
    this.localTime += Time.scaledDt * 0.0002 * ParticlesField.sheetSuccessObj.value.particlesSpeed;
  }

  render(ctx: RenderContext): void {
    this.prg.use();

    this.prg.uProjection(ctx.camera.lens.getProjection());
    this.prg.uView(ctx.camera._view);
    this.prg.uColor(this.color);
    this.prg.uTime(this.localTime);
    this.prg.uNoise(this.noiseTex);
    const alpha = !!ParticlesField.sheetSuccessObj && !!ParticlesField.sheetIntroObj && !!ParticlesField.sheetOutroObj ? ParticlesField.sheetSuccessObj.value.alpha * ParticlesField.sheetOutroObj.value.alpha * ParticlesField.sheetIntroObj.value.alpha : 0

    this.prg.uAlpha(alpha);
    this.prg.uFlicker(ParticlesField.sheetSuccessObj ? ParticlesField.sheetSuccessObj.value.flickerFactor : 0);
    // this.prg.uParticlesSpeed(ParticlesField.sheetSuccessObj ? ParticlesField.sheetSuccessObj.value.particlesSpeed : 1);

    this.cfg.apply();

    this.vbuffer.attribPointer(this.prg);
    this.vbuffer.drawPoints();
  }
}