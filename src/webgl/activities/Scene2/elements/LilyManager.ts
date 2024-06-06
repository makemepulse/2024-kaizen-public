import Renderer from "@webgl/Renderer";
import { RenderContext } from "@webgl/core/Renderer";
import GltfResource from "@webgl/resources/GltfResource";
import Gltf from "nanogl-gltf/lib/Gltf";
import MeshRenderer from "nanogl-gltf/lib/renderer/MeshRenderer";
import Node from "nanogl-gltf/lib/elements/Node";
import Lily from "./Lily";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import { StandardPass } from "nanogl-pbr/StandardPass";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";
import RenderMask from "@webgl/core/RenderMask";
import BlendAlpha from "../chunks/blend-alpha/BlendAlpha";
import { Sampler, Uniform } from "nanogl-pbr/Input";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import CSBFix from "../chunks/csb-fix/CSBFix";
import LilyFoam from "../chunks/lily-foam/LilyFoam";
import Texture2D from "nanogl/texture-2d";
import TexCoord from "nanogl-pbr/TexCoord";
import Time from "@webgl/Time";
import LilyMove from "../chunks/lily-move/LilyMove";
import { ISheet } from "@theatre/core";
import Background from "../utils/Background";
import Scene2 from "../Scene2";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import TextureAddChunk from "@webgl/glsl/textureAdd/TextureAddChunk";

export const LOTUS_COUNT = 5;

export default class LilyManager {

  lilyRes: GltfResource;
  foamRes: GltfResource;
  positionsRes: GltfResource;

  lily: Gltf;
  foam: Gltf;
  positions: Node[];

  lilies: Lily[] = [];

  renderables: MeshRenderer[] = [];

  foamBlendThreshold: Uniform;
  foamBlendShadowThreshold: Uniform;
  foamBlendOpacity: Uniform;
  viewFoam: Uniform;

  lilyContrast: Uniform;
  lilySaturation: Uniform;
  lilyBrightness: Uniform;

  lotusContrast: Uniform;
  lotusSaturation: Uniform;
  lotusBrightness: Uniform;

  foamTime: Uniform;
  foamNoiseTex: Sampler;
  foamColor: Uniform;

  noiseTex: Texture2D;

  lilyTime: Uniform;
  lilyMoveFactor: Uniform;
  lilyNoiseTex: Sampler;

  moveFactorTimeline: TheatreFloat;
  lotusOpeningTimeline: TheatreFloat;

  moveFactor = { value: 1, startV: 0 };
  lotusOpening = { value: 0, startV: 0 };

  sheetSuccess: ISheet;

  constructor(private renderer: Renderer, ambientChunk: AmbientAddChunk, tileAddChunk: TextureAddChunk) {
    this.noiseTex = this.renderer.scene.texturePool.get("perlinNoise").texture;

    const overridesLily = new MaterialOverrideExtension();

    const CSBLily = new CSBFix();
    this.lilyContrast = CSBLily.contrast.attachUniform();
    this.lilySaturation = CSBLily.saturation.attachUniform();
    this.lilyBrightness = CSBLily.brightness.attachUniform();

    const lilyMove = new LilyMove();
    this.lilyTime = lilyMove.time.attachUniform();
    this.lilyMoveFactor = lilyMove.moveFactor.attachUniform();
    this.lilyNoiseTex = lilyMove.noise.attachSampler("tNoise", TexCoord.create("aTexCoord0"));

    const achunk = new AmbientAddChunk();
    achunk.ambientAddUniform.set(2);

    overridesLily.overridePass("", (ctx, material) => {
      const pass = material.getPass("color").pass as StandardPass<MetalnessSurface>;
      pass.inputs.add(achunk);
      pass.inputs.add(CSBLily);
      pass.inputs.add(tileAddChunk);
      // pass.inputs.add(lilyMove);
      return pass;
    });


    this.lilyRes = new GltfResource("scene2/lily.glb", renderer.gl, {
      defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [overridesLily],
    });

    const overrides = new MaterialOverrideExtension();

    const blendAlpha = new BlendAlpha();
    this.foamBlendThreshold = blendAlpha.threshold.attachUniform();
    this.foamBlendShadowThreshold = blendAlpha.shadowThreshold.attachUniform();
    this.foamBlendOpacity = blendAlpha.opacity.attachUniform();

    overrides.overridePass("", (ctx, material) => {
      const lilyFoam = new LilyFoam(material);
      this.foamTime = lilyFoam.time.attachUniform();
      this.foamNoiseTex = lilyFoam.noise.attachSampler("tNoise", TexCoord.create("aTexCoord0"));
      this.foamColor = lilyFoam.color.attachUniform();
      this.viewFoam = lilyFoam.viewFoam.attachUniform();

      const pass = material.getPass("color").pass as StandardPass<MetalnessSurface>;
      pass.inputs.add(ambientChunk);
      pass.inputs.add(blendAlpha);
      pass.inputs.add(lilyFoam);
      pass.inputs.add(tileAddChunk);
      pass.alphaMode.set("BLEND");
      pass.mask = RenderMask.BLENDED;
      pass.glconfig
        .depthMask(false)
        .enableBlend()
        .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA);
      return pass;
    });

    this.foamRes = new GltfResource("scene2/foam.glb", renderer.gl, {
      defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [overrides],
    });

    const overridesLotus = new MaterialOverrideExtension();

    const CSBLotus = new CSBFix();
    this.lotusContrast = CSBLotus.contrast.attachUniform();
    this.lotusSaturation = CSBLotus.saturation.attachUniform();
    this.lotusBrightness = CSBLotus.brightness.attachUniform();

    overridesLotus.overridePass("", (ctx, material) => {
      const pass = material.getPass("color").pass as StandardPass<MetalnessSurface>;
      pass.inputs.add(achunk);
      pass.inputs.add(CSBLotus);
      // pass.inputs.add(lilyMove);
      return pass;
    });

    this.positionsRes = new GltfResource("scene2/nenupharSpawnPoints.gltf", renderer.gl, {
      defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
    });
  }

  async load() {
    return Promise.all([this.lilyRes.load(), this.foamRes.load(), this.positionsRes.load()]);
  }

  onLoaded() {
    this.lily = this.lilyRes.gltf;
    this.foam = this.foamRes.gltf;
    this.positions = this.positionsRes.gltf.nodes;
    this.renderables.push(...this.lily.renderables);

    this.positions.forEach((node) => {
      if (this.positions.length === 0) return;
      const pos = node.position;
      const hasLotus = true;
      const scale = 0.75 + (Math.random() * 2 - 1) * 0.5;

      const lily = new Lily(this.lily, this.foam, hasLotus, scale);
      lily.position.set([pos[0], pos[1] - 0.02, pos[2]]);

      this.lilies.push(lily);
    });
    this.lilies = this.lilies.sort((a, b) => a.position[1] - b.position[1]);
  }

  start() {
    this.moveFactorTimeline = new TheatreFloat(this.moveFactor, this.sheetSuccess, "Lily Move Factor");
    this.lotusOpeningTimeline = new TheatreFloat(this.lotusOpening, this.sheetSuccess, "Lotus Opening");

    this.lilies.forEach((n) => n.start());

    this.foamBlendThreshold.set(0);
    this.foamBlendShadowThreshold.set(0);
    this.foamBlendOpacity.set(0.228);

    this.lilyContrast.set(1.4347826087);
    this.lilySaturation.set(0.8260869565);
    this.lilyBrightness.set(0.6304347826);

    this.lotusContrast.set(1.0869565217);
    this.lotusSaturation.set(0.8478260870);
    this.lotusBrightness.set(0.7826086957);

    this.foamNoiseTex.set(this.noiseTex);
    this.foamColor.set(1, 1, 1.000);

    this.lilyNoiseTex.set(this.noiseTex);

    this.moveFactor.startV = this.moveFactor.value;
    this.lotusOpening.startV = this.lotusOpening.value;

    /// #if DEBUG
    const PARAMS = {
      foamBlendThreshold: this.foamBlendThreshold.value[0],
      foamBlendShadowThreshold: this.foamBlendShadowThreshold.value[0],
      foamBlendOpacity: this.foamBlendOpacity.value[0],
      lilyContrast: this.lilyContrast.value[0],
      lilySaturation: this.lilySaturation.value[0],
      lilyBrightness: this.lilyBrightness.value[0],
      lotusContrast: this.lotusContrast.value[0],
      lotusSaturation: this.lotusSaturation.value[0],
      lotusBrightness: this.lotusBrightness.value[0],
      foamColor: this.foamColor.value,
    };

    const f = Scene2.guiFolder.folder("Lily");
    f.range(PARAMS, "foamBlendThreshold", 0, 1).onChange(() => this.foamBlendThreshold.set(PARAMS.foamBlendThreshold));
    f.range(PARAMS, "foamBlendShadowThreshold", 0, 1).onChange(() => this.foamBlendShadowThreshold.set(PARAMS.foamBlendShadowThreshold));
    f.range(PARAMS, "foamBlendOpacity", 0, 1).onChange(() => this.foamBlendOpacity.set(PARAMS.foamBlendOpacity));
    f.range(PARAMS, "lilyContrast", 0, 2).onChange(() => this.lilyContrast.set(PARAMS.lilyContrast));
    f.range(PARAMS, "lilySaturation", 0, 2).onChange(() => this.lilySaturation.set(PARAMS.lilySaturation));
    f.range(PARAMS, "lilyBrightness", 0, 2).onChange(() => this.lilyBrightness.set(PARAMS.lilyBrightness));
    f.range(PARAMS, "lotusContrast", 0, 2).onChange(() => this.lotusContrast.set(PARAMS.lotusContrast));
    f.range(PARAMS, "lotusSaturation", 0, 2).onChange(() => this.lotusSaturation.set(PARAMS.lotusSaturation));
    f.range(PARAMS, "lotusBrightness", 0, 2).onChange(() => this.lotusBrightness.set(PARAMS.lotusBrightness));
    f.addColor(PARAMS, "foamColor").onChange(() => this.foamColor.set(...PARAMS.foamColor));
    /// #endif
  }

  stop() {
    this.moveFactorTimeline.dispose();
    this.lotusOpeningTimeline.dispose();
  }

  preRender() {
    this.foamBlendOpacity.set(0.25 + Background.transition.value * 0.2);
    this.lilyMoveFactor.set(this.moveFactor.value);

    this.foamTime.set(Time.scaledTime * 0.0001)

    this.viewFoam.set(0.3 + Background.transition.value * 0.8);
    this.lilies.forEach((n, i) => {
      n.preRender(this.lotusOpening.value);
      this.lilyTime.set(Time.dt * 0.00001 + i * 100.1);
    });

  }

  render(ctx: RenderContext) {
    this.lilies.forEach((n, i) => {
      this.foamTime.set((Time.scaledTime + n.time) * 0.0004);
      n.render(ctx);
    });
  }

}