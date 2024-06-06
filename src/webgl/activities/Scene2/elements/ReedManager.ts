import Renderer from "@webgl/Renderer";
import { RenderContext } from "@webgl/core/Renderer";
import GltfResource from "@webgl/resources/GltfResource";
import Gltf from "nanogl-gltf/lib/Gltf";
import MeshRenderer from "nanogl-gltf/lib/renderer/MeshRenderer";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import { StandardPass } from "nanogl-pbr/StandardPass";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";
import RenderMask from "@webgl/core/RenderMask";
import ReedWind from "../chunks/reedWind/ReedWind";
import { Uniform } from "nanogl-pbr/Input";
import Time from "@webgl/Time";

export default class ReedManager {

  reedRes: GltfResource;

  reed: Gltf;

  renderables: MeshRenderer[] = [];

  windTime: Uniform
  time = Math.random()

  constructor(private renderer: Renderer, ambientChunk: AmbientAddChunk) {
    const overrides = new MaterialOverrideExtension();

    const reedWind = new ReedWind();
    this.windTime = reedWind.time.attachUniform()
    this.windTime.set(this.time)
    overrides.overridePass("", (ctx, material) => {
      const pass = material.getPass("color").pass as StandardPass<MetalnessSurface>;
      pass.inputs.add(ambientChunk);
      pass.inputs.add(reedWind);
      pass.alphaMode.set("BLEND");
      pass.mask = RenderMask.BLENDED;
      pass.glconfig
        .enableBlend()
        .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA);
      return pass;
    });

    this.reedRes = new GltfResource("scene2/reeds.glb", renderer.gl, {
      defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [overrides],
    });
  }

  async load() {
    return this.reedRes.load();
  }

  onLoaded() {
    this.reed = this.reedRes.gltf;
    this.renderables = [...this.reed.renderables]
  }

  preRender() {
    this.time += Time.scaledDt * 0.001;
    this.windTime.set(this.time);
  }

  render(ctx: RenderContext) {
    for (const renderable of this.reed.renderables) {
      renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
    }
  }

}