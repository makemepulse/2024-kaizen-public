import { RenderContext } from "@webgl/core/Renderer";
import Renderer from "@webgl/Renderer";
import Program from "nanogl/program";
import GLArrayBuffer from "nanogl/arraybuffer";
import GLState, { LocalConfig } from "nanogl-state/GLState";
import Programs from "@webgl/glsl/programs";
import { vec3 } from "gl-matrix";
import Time from "@webgl/Time";
import Texture2D from "nanogl/texture-2d";
import { ISheet } from "@theatre/core";
import Scene2 from "../Scene2";
import TheatreFloat from "@webgl/theatre/TheatreFloat";

export default class Energy {

  scaleFactorTimeline: TheatreFloat;

  static scaleFactor = { value: 1, startV: 0 };

  sheetSuccess: ISheet;

  vbuffer: GLArrayBuffer;

  prg: Program;
  cfg: LocalConfig;

  noiseTex: Texture2D;

  time = 0

  offset: vec3 = vec3.create();

  constructor(private renderer: Renderer, private count: number, private radius: number, private color: vec3, private strength: number) {
    this.prg = Programs(renderer.gl).get("pond-energy");

    this.noiseTex = this.renderer.scene.texturePool.get("perlinNoise").texture;

    this.vbuffer = new GLArrayBuffer(renderer.gl);
    this.vbuffer
      .attrib("aPosition", 3, renderer.gl.FLOAT)
      .attrib("aSettings", 4, renderer.gl.FLOAT);

    this.vbuffer.attribPointer(this.prg);

    this.cfg = GLState.get(renderer.gl).config();
    this.cfg
      .enableDepthTest(true)
      .depthMask(false)
      .enableBlend(true)
      .blendEquation(renderer.gl.FUNC_ADD)
      .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE);

    /// #if DEBUG
    const f = Scene2.guiFolder.folder("Energy Particles");
    f.addColor(this, "color");
    /// #endif
  }

  start(center: vec3) {
    if (this.sheetSuccess) {
      this.scaleFactorTimeline = new TheatreFloat(Energy.scaleFactor, this.sheetSuccess, "Energy Scale Factor");
    }

    const vdata = new Float32Array(this.count * 7);

    for (let i = 0; i < this.count; i++) {
      // X, startY (= age at birth), Z
      vdata[i * 7 + 0] = center[0] + Math.random() * this.radius * 2 - this.radius;
      vdata[i * 7 + 1] = center[1] + Math.random() * 4;
      vdata[i * 7 + 2] = center[2] + Math.random() * this.radius * 2 - this.radius;

      // Scale, Opacity, MaxLife, Speed
      vdata[i * 7 + 3] = Math.random() * .2 * this.strength + .2;
      vdata[i * 7 + 4] = Math.random() * .15 * this.strength + .2;
      vdata[i * 7 + 5] = Math.random() * this.strength + .5;
      vdata[i * 7 + 6] = Math.random() * 2 + .2;
    }

    Energy.scaleFactor.startV = Energy.scaleFactor.value;

    this.vbuffer.data(vdata);
  }

  dispose(): void {
    this.scaleFactorTimeline.dispose();
  }

  preRender() {
    this.time += Time.scaledDt * 0.0002 * Energy.scaleFactor.value;
  }

  render(ctx: RenderContext): void {
    this.prg.use();

    this.prg.uProjection(ctx.camera.lens.getProjection());
    this.prg.uView(ctx.camera._view);
    this.prg.uColor(this.color);
    this.prg.uTime(this.time);
    this.prg.uNoise(this.noiseTex);
    this.prg.uScaleFactor(Energy.scaleFactor.value * 0.5);
    this.prg.uOffset(this.offset);

    this.cfg.apply();

    this.vbuffer.attribPointer(this.prg);
    this.vbuffer.drawPoints();
  }
}