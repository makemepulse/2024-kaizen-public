import Renderer from "@webgl/Renderer";
import { RenderContext } from "@webgl/core/Renderer";
import GltfResource from "@webgl/resources/GltfResource";
import { vec3 } from "gl-matrix";
import Gltf from "nanogl-gltf/lib/Gltf";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import UnlitPass from "nanogl-pbr/UnlitPass";
import RipplesChunk from "../chunks/Ripples/RipplesChunk";
import Time from "@webgl/Time";

export default class Ripples {
  res: GltfResource;
  gltf: Gltf;

  rippleChunk: RipplesChunk

  time = 0

  positionStart = vec3.create()
  positionEnd = vec3.create()

  opacityStart = 0
  opacityEnd = 0

  timeStart = 0
  timeEnd = 0

  constructor(private renderer: Renderer) {
    const overrides = new MaterialOverrideExtension();

    this.rippleChunk = new RipplesChunk(renderer);
    overrides.overridePass("", (ctx, material) => {
      const pass = material.getPass("color").pass as UnlitPass;
      pass.inputs.add(this.rippleChunk);

      return pass;
    });

    this.res = new GltfResource("scene2/ripple.gltf", renderer.gl, {
      defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [overrides],
    });

  }

  async load() {
    return Promise.all([this.res.load()]);
  }

  onLoaded() {
    this.gltf = this.res.gltf;
  }

  start() {

  }

  stop() {

  }

  spawnStart(position: vec3) {
    vec3.copy(this.positionStart, position);
    this.opacityStart = 1;
    this.timeStart = 0;
  }

  spawnEnd(position: vec3) {
    vec3.copy(this.positionEnd, position);
    this.opacityEnd = 1;
    this.timeEnd = 0;
  }

  preRender() {
    this.timeStart += Time.scaledDt * 0.001;
    this.timeEnd += Time.scaledDt * 0.001;

    this.opacityStart += (0 - this.opacityStart) * 0.01;
    this.opacityEnd += (0 - this.opacityEnd) * 0.01;
  }

  render(ctx: RenderContext) {
    if (this.opacityStart > 0.01) {
      vec3.copy(this.gltf.root.position, this.positionStart);
      this.gltf.root.position[1] = 0.07;
      this.gltf.root.invalidate();
      this.gltf.root.updateWorldMatrix();
      this.rippleChunk.opacityU.set(this.opacityStart)
      this.rippleChunk.timeU.set(this.timeStart);
      for (const renderable of this.gltf.renderables) {
        renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
      }
    }
    if (this.opacityEnd > 0.01) {
      vec3.copy(this.gltf.root.position, this.positionEnd);
      this.gltf.root.position[1] = 0.07;
      this.gltf.root.invalidate();
      this.gltf.root.updateWorldMatrix();
      this.rippleChunk.opacityU.set(this.opacityEnd)
      this.rippleChunk.timeU.set(this.timeEnd);
      for (const renderable of this.gltf.renderables) {
        renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
      }
    }
  }
}