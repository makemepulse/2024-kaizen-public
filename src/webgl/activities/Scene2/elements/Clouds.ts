import Renderer from "@webgl/Renderer";
import { RenderContext } from "@webgl/core/Renderer";
import GltfResource from "@webgl/resources/GltfResource";
import Gltf from "nanogl-gltf/lib/Gltf";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import MeshRenderer from "nanogl-gltf/lib/renderer/MeshRenderer";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";
import { StandardPass } from "nanogl-pbr/StandardPass";
import RenderMask from "@webgl/core/RenderMask";
import { ISheet } from "@theatre/core";
import CloudsChunk from "../chunks/clouds/CloudsChunk";
import { Uniform } from "nanogl-pbr/Input";
import Time from "@webgl/Time";
import CutoutShadow from "@webgl/core/CutOutShadow";
import Node from "nanogl-node";
import Fish from "./Fish";
import TheatreFloat from "@webgl/theatre/TheatreFloat";

/// #if DEBUG
import Scene2 from "../Scene2";
import TextureAddChunk from "@webgl/glsl/textureAdd/TextureAddChunk";
/// #endif

export default class Clouds {
  res: GltfResource;
  gltf: Gltf;

  root: Node

  renderables: MeshRenderer[] = [];

  opacity: Uniform;
  color: Uniform;
  time: Uniform;

  rotationTimeline: TheatreFloat;
  opacityFactorTimeline: TheatreFloat;

  rotation = { value: 1, startV: 0 };
  opacityFactor = { value: 1, startV: 0 };

  totalTimes: number[];
  sheetSuccess: ISheet;

  constructor(private renderer: Renderer, tileAddChunk: TextureAddChunk) {
    const overrides = new MaterialOverrideExtension();

    const shadowCutout = new CutoutShadow();

    overrides.overridePass("", (ctx, material) => {
      const cloudsChunk = new CloudsChunk(material);
      this.opacity = cloudsChunk.opacity.attachUniform();
      this.color = cloudsChunk.color.attachUniform();
      this.time = cloudsChunk.time.attachUniform();

      const pass = material.getPass("color").pass as StandardPass<MetalnessSurface>;
      // pass.inputs.add(tileAddChunk);
      pass.inputs.add(cloudsChunk);
      pass.alphaMode.set("BLEND");
      pass.mask = RenderMask.BLENDED;
      pass.glconfig
        .depthMask(false)
        .enableBlend()
        .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA);
      shadowCutout.color.attach((pass as StandardPass).alpha.param);

      // const reflectDistPass = new ReflectDistPass();
      // reflectDistPass.mask = RenderMask.REFLECTED;
      // const passReflect = material.addPass(reflectDistPass, RenderPass.REFLECT_DEPTH);
      // material.getPass("depth").pass.inputs.add(shadowCutout);
      // passReflect.pass.inputs.add(shadowCutout);
      return pass;
    });

    this.res = new GltfResource("scene2/clouds.glb", renderer.gl, {
      defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [overrides],
    });
  }

  async load() {
    return this.res.load();
  }

  onLoaded() {
    this.gltf = this.res.gltf;
    this.renderables = this.gltf.renderables;

    this.totalTimes = this.renderables.map(() => 0);

    this.root = new Node();
    this.root.add(this.gltf.root);

    this.root.y = 4;
  }

  start() {
    this.gltf.root.invalidate();
    this.gltf.root.updateWorldMatrix();

    this.opacity.set(1);
    this.color.set(0.8750, 1.000, 0.9899);

    this.rotationTimeline = new TheatreFloat(this.rotation, this.sheetSuccess, "Clouds Rotation Factor");
    this.opacityFactorTimeline = new TheatreFloat(this.opacityFactor, this.sheetSuccess, "Clouds Opacity Factor");

    this.rotation.startV = this.rotation.value;
    this.opacityFactor.startV = this.opacityFactor.value;

    /// #if DEBUG
    const PARAMS = {
      opacity: this.opacity.value[0],
      color: this.color.value
    };

    const f = Scene2.guiFolder.folder("Clouds");
    f.range(PARAMS, "opacity", 0, 1).onChange(() => this.opacity.set(PARAMS.opacity));
    f.addColor(PARAMS, "color").onChange(() => this.color.set(...PARAMS.color));
    /// #endif
  }

  stop() {
    this.rotationTimeline.dispose();
    this.opacityFactorTimeline.dispose();
  }

  render(ctx: RenderContext) {
    for (const [index, renderable] of this.renderables.entries()) {
      this.totalTimes[index] += Time.dt * this.rotation.value * renderable.node.extras.speedBase * 10 * (Fish.isSlowMo ? Fish.slowMoFactor * 0.1 : 1);
      this.time.set(this.totalTimes[index] * 0.00001);
      this.opacity.set(renderable.node.extras.opacityBase * this.opacityFactor.value);
      renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
    }
  }
}
