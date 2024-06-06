import Node from "nanogl-node";
import { vec4 } from "gl-matrix";
import Camera from "nanogl-camera";
import Program from "nanogl/program";
import Renderer from "@webgl/Renderer";
import Gltf from "nanogl-gltf/lib/Gltf";
import { Uniform } from "nanogl-pbr/Input";
import ArrayBuffer from "nanogl/arraybuffer";
import IndexBuffer from "nanogl/indexbuffer";
import RenderMask from "@webgl/core/RenderMask";
import RenderPass from "@webgl/core/RenderPass";
import { LocalConfig } from "nanogl-state/GLState";
import { ISheet, ISheetObject } from "@theatre/core";
import { RenderContext } from "@webgl/core/Renderer";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import OrthographicLens from "nanogl-camera/ortho-lens";
import GltfResource from "@webgl/resources/GltfResource";
import BackgroundChunk from "../chunks/background/BackgroundChunk";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";

export enum BackgroundType {
  RADIAL,
  LINEAR_2_STOPS,
  LINEAR_3_STOPS
}

export default class Background {

  static transition = { value: 1, startV: 0 };

  res: GltfResource;
  gltf: Gltf;

  cfg: LocalConfig;
  prg: Program;
  buffer: ArrayBuffer;
  bufferIndex: IndexBuffer;

  cam: Camera<OrthographicLens>;

  node: Node;

  topColor = vec4.create();
  middleColor = vec4.create();
  bottomColor = vec4.create();

  transitionTopColor = vec4.create();
  transitionMiddleColor = vec4.create();
  transitionBottomColor = vec4.create();

  introTopColor = vec4.create();
  introMiddleColor = vec4.create();
  introBottomColor = vec4.create();

  outroTopColor = vec4.create();
  outroMiddleColor = vec4.create();
  outroBottomColor = vec4.create();

  currentTopColor = vec4.create();
  currentMiddleColor = vec4.create();
  currentBottomColor = vec4.create();
  useClampedMix = false;

  currentTopColorUniform: Uniform;
  currentMiddleColorUniform: Uniform;
  currentBottomColorUniform: Uniform;
  useClampedMixUniform: Uniform;

  transitionTimeline: TheatreFloat;
  transitionDownhill: TheatreFloat;

  sheetIntro: ISheet;
  sheetOutro: ISheet;
  sheetSuccess: ISheet;
  sheetDownhill: ISheet;

  sheetOutroObj: ISheetObject<{ transition: number }>;
  sheetIntroObj: ISheetObject<{ transition: number }>;

  /**
   * @param topColor External color in case of radial gradient
   * @param bottomColor Internal color in case of radial gradient
   * @param radial Either radial or linear gradient
   * @param radialStrength Strength of the radial gradient (lower is smoother, higher is more abrupt)
   */
  constructor(private renderer: Renderer, private type = BackgroundType.LINEAR_2_STOPS, private radialStrength = 1) {
    const overrides = new MaterialOverrideExtension();

    overrides.overridePass("", (ctx, material) => {
      const backgroundChunk = new BackgroundChunk(material);
      this.currentTopColorUniform = backgroundChunk.topColor.attachUniform();
      this.currentMiddleColorUniform = backgroundChunk.middleColor.attachUniform();
      this.currentBottomColorUniform = backgroundChunk.bottomColor.attachUniform();
      this.useClampedMixUniform = backgroundChunk.useClampedMix.attachUniform();

      backgroundChunk.type.attachConstant(this.type);
      backgroundChunk.radialStrength.attachConstant(this.radialStrength);

      const pass = material.getPass("color").pass;
      pass.inputs.add(backgroundChunk);
      // pass.inputs.add(this.tileTexChunk);
      return pass;
    });
    this.res = new GltfResource("intro/sphere.glb", renderer.gl, {
      defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [overrides],
    });
  }

  async load() {
    await this.res.load();
  }

  onLoaded() {
    this.gltf = this.res.gltf;
    this.gltf.root.scale.set([20, 20, 20]);
    this.gltf.root.invalidate();
    this.gltf.root.updateWorldMatrix();
  }

  start() {
    if (this.sheetSuccess) this.transitionTimeline = new TheatreFloat(Background.transition, this.sheetSuccess, "Background Transition");
    if (this.sheetIntro) this.sheetIntroObj = this.sheetIntro.object("Background", { transition: 0 });
    if (this.sheetOutro) this.sheetOutroObj = this.sheetOutro.object("Background", { transition: 0 });
    if (this.sheetDownhill) this.transitionDownhill = new TheatreFloat(Background.transition, this.sheetDownhill, "Background Transition");

    Background.transition.value = 0;
    Background.transition.startV = Background.transition.value;
  }

  stop() {
    this.sheetIntro?.detachObject("Background");
    this.sheetOutro?.detachObject("Background");
    this.transitionTimeline?.dispose();
    this.transitionDownhill?.dispose();
  }

  setTransitionColors(topColor: vec4, middleColor: vec4, bottomColor: vec4) {
    vec4.copy(this.transitionTopColor, topColor);
    vec4.copy(this.transitionMiddleColor, middleColor);
    vec4.copy(this.transitionBottomColor, bottomColor);
  }

  setIntroColors(topColor: vec4, middleColor: vec4, bottomColor: vec4) {
    vec4.copy(this.introTopColor, topColor);
    vec4.copy(this.introMiddleColor, middleColor);
    vec4.copy(this.introBottomColor, bottomColor);
  }

  setOutroColors(topColor: vec4, middleColor: vec4, bottomColor: vec4) {
    vec4.copy(this.outroTopColor, topColor);
    vec4.copy(this.outroMiddleColor, middleColor);
    vec4.copy(this.outroBottomColor, bottomColor);
  }

  setUseClampedMix(value: boolean) {
    this.useClampedMix = value;
  }

  render(ctx: RenderContext) {
    if (ctx.mask !== RenderMask.OPAQUE || ctx.pass === RenderPass.DEPTH || ctx.pass === RenderPass.REFLECT_DEPTH) return;

    if (this.sheetSuccess) {
      vec4.lerp(this.currentTopColor, this.topColor, this.transitionTopColor, Background.transition.value);
      vec4.lerp(this.currentMiddleColor, this.middleColor, this.transitionMiddleColor, Background.transition.value);
      vec4.lerp(this.currentBottomColor, this.bottomColor, this.transitionBottomColor, Background.transition.value);
    } else {
      vec4.copy(this.currentTopColor, this.topColor);
      vec4.copy(this.currentMiddleColor, this.middleColor);
      vec4.copy(this.currentBottomColor, this.bottomColor);
    }

    if (this.sheetDownhill && this.renderer.scene.isGoingBack) {
      vec4.lerp(this.currentTopColor, this.topColor, this.transitionTopColor, Background.transition.value);
      vec4.lerp(this.currentMiddleColor, this.middleColor, this.transitionMiddleColor, Background.transition.value);
      vec4.lerp(this.currentBottomColor, this.bottomColor, this.transitionBottomColor, Background.transition.value);
    }

    if (this.sheetOutro) {
      vec4.lerp(this.currentTopColor, this.currentTopColor, this.outroTopColor, this.sheetOutroObj.value.transition);
      vec4.lerp(this.currentMiddleColor, this.currentMiddleColor, this.outroMiddleColor, this.sheetOutroObj.value.transition);
      vec4.lerp(this.currentBottomColor, this.currentBottomColor, this.outroBottomColor, this.sheetOutroObj.value.transition);
    }

    if (this.sheetIntro) {
      vec4.lerp(this.currentTopColor, this.currentTopColor, this.introTopColor, this.sheetIntroObj.value.transition);
      vec4.lerp(this.currentMiddleColor, this.currentMiddleColor, this.introMiddleColor, this.sheetIntroObj.value.transition);
      vec4.lerp(this.currentBottomColor, this.currentBottomColor, this.introBottomColor, this.sheetIntroObj.value.transition);
    }

    this.currentTopColorUniform.set(...this.currentTopColor);
    this.currentMiddleColorUniform.set(...this.currentMiddleColor);
    this.currentBottomColorUniform.set(...this.currentBottomColor);
    this.useClampedMixUniform.set(this.useClampedMix ? 1 : 0);

    for (const renderable of this.gltf.renderables) {
      renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
    }
  }

}