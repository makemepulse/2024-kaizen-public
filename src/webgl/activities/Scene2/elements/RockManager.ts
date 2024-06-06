import Renderer from "@webgl/Renderer";
import { RenderContext } from "@webgl/core/Renderer";
import GltfResource from "@webgl/resources/GltfResource";
import Gltf from "nanogl-gltf/lib/Gltf";
import MeshRenderer from "nanogl-gltf/lib/renderer/MeshRenderer";
import Node from "nanogl-node";
import OutRock from "./OutRock";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import { Sampler, Uniform } from "nanogl-pbr/Input";
import UnderwaterRock from "../chunks/underwater-rock/UnderwaterRock";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";
import { StandardPass } from "nanogl-pbr/StandardPass";
import RenderMask from "@webgl/core/RenderMask";
import RockFoam from "../chunks/rock-foam/RockFoam";
import Texture2D from "nanogl/texture-2d";
import TexCoord from "nanogl-pbr/TexCoord";
import Time from "@webgl/Time";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import CutoutShadow from "@webgl/core/CutOutShadow";
import CSBFix from "../chunks/csb-fix/CSBFix";
import Background from "../utils/Background";
import Scene2 from "../Scene2";
import TextureAddChunk from "@webgl/glsl/textureAdd/TextureAddChunk";
import CenterRockUnderwater from "../chunks/center-rock-underwater/CenterRockUnderwater";

const OUT_ROCK_COUNT = Math.floor(3 + Math.random() * 3); // Between 3 and 5

export default class RockManager {

  outRockRes: GltfResource;
  centerRocksRes: GltfResource;
  foamRes: GltfResource;
  outPositionsRes: GltfResource;

  outRockGltf: Gltf;
  centerRocksGltf: Gltf;
  foam: Gltf;
  outPositions: Node[];
  inPositions: Node[];

  outRocks: OutRock[] = [];

  renderables: MeshRenderer[] = [];

  waterHeight: Uniform;
  distortionFactor: Uniform;
  opacityThreshold: Uniform;
  waterColor: Uniform;

  outFoamColor: Uniform;
  outAlphaThreshold: Uniform;
  outRockFoamOpacity: Uniform;
  outRockTime: Uniform;
  outViewFoam: Uniform;
  outRockNoiseTex: Sampler;

  centerFoamColor: Uniform;
  centerAlphaThreshold: Uniform;
  centerRockFoamOpacity: Uniform;
  centerRockTime: Uniform;
  centerViewFoam: Uniform;
  centerRockNoiseTex: Sampler;

  rockContrast: Uniform;
  rockSaturation: Uniform;
  rockBrightness: Uniform;

  noiseTex: Texture2D;

  constructor(private renderer: Renderer, ambientChunk: AmbientAddChunk, tileAddChunk: TextureAddChunk) {
    this.noiseTex = this.renderer.scene.texturePool.get("perlinNoise").texture;

    const overrides = new MaterialOverrideExtension();
    const overridesRocks = new MaterialOverrideExtension();

    const underwater = new UnderwaterRock();
    this.waterHeight = underwater.waterHeight.attachUniform();
    this.distortionFactor = underwater.distortionFactor.attachUniform();
    this.opacityThreshold = underwater.opacityThreshold.attachUniform();
    this.waterColor = underwater.waterColor.attachUniform();

    const shadowCutout = new CutoutShadow();

    const CSBRocks = new CSBFix();
    this.rockContrast = CSBRocks.contrast.attachUniform();
    this.rockSaturation = CSBRocks.saturation.attachUniform();
    this.rockBrightness = CSBRocks.brightness.attachUniform();

    overrides.overridePass("Rock", (ctx, material) => {
      const pass = material.getPass("color").pass as StandardPass<MetalnessSurface>;
      pass.inputs.add(underwater);
      pass.alphaMode.set("BLEND");
      pass.mask = RenderMask.BLENDED;
      pass.glconfig
        .enableBlend()
        .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA);
      return pass;
    });

    // overrides.overridePass("Rock_Grey.002", (ctx, material) => {
    //   const pass = material.getPass("color").pass;
    //   pass.inputs.add(ambientChunk);
    //   pass.inputs.add(CSBRocks);
    //   pass.glconfig
    //     .depthMask(true)
    //     .enableDepthTest(true);
    //   shadowCutout.color.attach((pass as StandardPass).alpha.param);

    //   const reflectDistPass = new ReflectDistPass();
    //   reflectDistPass.mask = RenderMask.REFLECTED;
    //   const passReflect = material.addPass(reflectDistPass, RenderPass.REFLECT_DEPTH);
    //   material.getPass("depth").pass.inputs.add(shadowCutout);
    //   passReflect.pass.inputs.add(shadowCutout);
    //   return pass;
    // });

    const centerRockUnderwater = new CenterRockUnderwater();

    overridesRocks.overridePass("", (ctx, material) => {
      const pass = material.getPass("color").pass as StandardPass<MetalnessSurface>;
      pass.inputs.add(ambientChunk);
      pass.inputs.add(CSBRocks);
      pass.inputs.add(tileAddChunk);
      pass.inputs.add(centerRockUnderwater);
      pass.alphaMode.set("BLEND");
      pass.mask = RenderMask.BLENDED;
      pass.glconfig
        .enableBlend()
        .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA);
      return pass;
    });
    let rockFoam: RockFoam;
    overridesRocks.overridePass("Water", (ctx, material) => {
      if (material.getPass("color").pass.inputs._chunks.some(((c) => c instanceof RockFoam))) return;

      if (!rockFoam) rockFoam = new RockFoam(material);
      this.outFoamColor = rockFoam.foamColor.attachUniform();
      this.outAlphaThreshold = rockFoam.alphaThreshold.attachUniform();
      this.centerRockFoamOpacity = rockFoam.opacity.attachUniform();
      this.outRockTime = rockFoam.time.attachUniform();
      this.centerViewFoam = rockFoam.viewFoam.attachUniform();
      this.outRockNoiseTex = rockFoam.noise.attachSampler("tNoise", TexCoord.create("aTexCoord0"));

      const pass = material.getPass("color").pass as StandardPass<MetalnessSurface>;
      pass.inputs.add(rockFoam);
      // pass.inputs.add(tileAddChunk);
      pass.alphaMode.set("BLEND");
      pass.mask = RenderMask.BLENDED;
      pass.glconfig
        // .depthMask(false)
        .enableBlend()
        .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA);
      return pass;
    });

    overrides.overridePass("Water", (ctx, material) => {
      if (material.getPass("color").pass.inputs._chunks.some(((c) => c instanceof RockFoam))) return;

      if (!rockFoam) rockFoam = new RockFoam(material);
      this.outFoamColor = rockFoam.foamColor.attachUniform();
      this.outAlphaThreshold = rockFoam.alphaThreshold.attachUniform();
      this.outRockFoamOpacity = rockFoam.opacity.attachUniform();
      this.outRockTime = rockFoam.time.attachUniform();
      this.outViewFoam = rockFoam.viewFoam.attachUniform();
      this.outRockNoiseTex = rockFoam.noise.attachSampler("tNoise", TexCoord.create("aTexCoord0"));

      const pass = material.getPass("color").pass as StandardPass<MetalnessSurface>;
      pass.inputs.add(rockFoam);
      pass.inputs.add(tileAddChunk);
      pass.alphaMode.set("BLEND");
      pass.mask = RenderMask.BLENDED;
      pass.glconfig
        .depthMask(false)
        .enableBlend()
        .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA);
      return pass;
    });

    this.outRockRes = new GltfResource("scene2/rock_1.gltf", renderer.gl, {
      defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [overrides],
    });

    this.centerRocksRes = new GltfResource("scene2/rocks.glb", renderer.gl, {
      defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [overridesRocks],
    });

    // this.foamRes = new GltfResource("scene2/foam.glb", renderer.gl, {
    //   defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
    //   extensions: [overrides],
    // });

    this.outPositionsRes = new GltfResource("scene2/rocks_positions.gltf", renderer.gl, {
      defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
    });
  }

  async load() {
    return Promise.all([this.outRockRes.load(), this.centerRocksRes.load(), this.outPositionsRes.load()]);
  }

  onLoaded() {
    this.outRockGltf = this.outRockRes.gltf;
    this.centerRocksGltf = this.centerRocksRes.gltf;
    // this.foam = this.foamRes.gltf;
    this.outPositions = this.outPositionsRes.gltf.nodes;
    const r = this.centerRocksGltf.renderables.filter(r => !r.node.name.includes("Plane.002_Baked"))
    const r2 = this.centerRocksGltf.renderables.filter(r => r.node.name.includes("Plane.002_Baked"))
    for (const renderable of r) {
      renderable.node.position[1] -= 0.05;
      renderable.node.invalidate();
      renderable.node.updateWorldMatrix();
    }
    let count = 0
    for (const renderable of r2) {
      renderable.node.position[1] += 0.002 * count;
      count++;
      renderable.node.invalidate();
      renderable.node.updateWorldMatrix();
    }

    this.renderables = [...r];
    for (let i = 0; i < OUT_ROCK_COUNT; i++) {
      this.outRocks.push(new OutRock(this.outRockGltf));
    }

    this.outRocks.forEach((n) => {
      const positions = this.outPositions;
      if (positions.length === 0) return;
      const i = Math.floor(Math.random() * positions.length);
      const pos = positions[i].position;
      n.position.set([pos[0], pos[1], pos[2]]);
      positions.splice(i, 1);
    });
  }

  start(waterHeight: number) {
    this.outRocks.forEach((n) => n.start());
    this.waterHeight.set(waterHeight + .35);
    this.distortionFactor.set(2);
    this.opacityThreshold.set(10);
    this.waterColor.set(0.5739, 0.7010, 0.6495);

    this.outFoamColor.set(1, 1, 1);
    this.outAlphaThreshold.set(0.6);
    this.outRockFoamOpacity.set(0.35);
    this.outRockNoiseTex.set(this.noiseTex);

    // this.centerFoamColor.set(1, 1, 1);
    // this.centerAlphaThreshold.set(0.6);
    // this.centerRockFoamOpacity.set(0.35);
    // this.centerRockNoiseTex.set(this.noiseTex);

    this.rockContrast.set(1.13);
    this.rockSaturation.set(1);
    this.rockBrightness.set(1.2);

    /// #if DEBUG
    const PARAMS = {
      waterHeight,
      distortionFactor: this.distortionFactor.value[0],
      opacityThreshold: this.opacityThreshold.value[0],
      waterColor: this.waterColor.value,
      foamColor: this.outFoamColor.value,
      alphaThreshold: this.outAlphaThreshold.value[0],
      rockFoamOpacity: this.outRockFoamOpacity.value[0],
      rockContrast: this.rockContrast.value[0],
      rockSaturation: this.rockSaturation.value[0],
      rockBrightness: this.rockBrightness.value[0],
    };

    const f = Scene2.guiFolder.folder("Rocks");
    f.range(PARAMS, "waterHeight", -1, 1).onChange(() => this.waterHeight.set(PARAMS.waterHeight));
    f.range(PARAMS, "distortionFactor", 0, 10).onChange(() => this.distortionFactor.set(PARAMS.distortionFactor));
    f.range(PARAMS, "opacityThreshold", 0, 10).onChange(() => this.opacityThreshold.set(PARAMS.opacityThreshold));
    f.addColor(PARAMS, "waterColor").onChange(() => this.waterColor.set(...PARAMS.waterColor));
    f.addColor(PARAMS, "foamColor").onChange(() => this.outFoamColor.set(...PARAMS.foamColor));
    f.range(PARAMS, "alphaThreshold", 0, 1).onChange(() => this.outAlphaThreshold.set(PARAMS.alphaThreshold));
    f.range(PARAMS, "rockFoamOpacity", 0, 1).onChange(() => this.outRockFoamOpacity.set(PARAMS.rockFoamOpacity));
    f.range(PARAMS, "rockContrast", 0, 2).onChange(() => this.rockContrast.set(PARAMS.rockContrast));
    f.range(PARAMS, "rockSaturation", 0, 2).onChange(() => this.rockSaturation.set(PARAMS.rockSaturation));
    f.range(PARAMS, "rockBrightness", 0, 2).onChange(() => this.rockBrightness.set(PARAMS.rockBrightness));
    /// #endif
  }

  preRender() {
    this.outRockFoamOpacity.set(0.328 + Background.transition.value * 0.5);
    this.outViewFoam.set(0.4 + Background.transition.value * 0.6);

    this.centerRockFoamOpacity.set(0.6 + Background.transition.value * 0.2);
    this.centerViewFoam.set(0.4 + Background.transition.value * 0.6);
  }

  render(ctx: RenderContext) {
    this.outRocks.forEach((n) => {
      this.outRockTime.set((Time.scaledTime + n.time) * 0.0004);
      n.render(ctx);
    });
    for (const [index, renderable] of this.centerRocksGltf.renderables.entries()) {
      // this.centerRockTime.set((Time.scaledTime + index) * 0.0004);
      renderable.node.invalidate();
      renderable.node.updateWorldMatrix();
      renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
    }
  }

}