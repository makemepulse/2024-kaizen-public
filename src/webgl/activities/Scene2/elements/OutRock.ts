import RenderPass from "@webgl/core/RenderPass";
import { RenderContext } from "@webgl/core/Renderer";
import { quat, vec3 } from "gl-matrix";
import Gltf from "nanogl-gltf/lib/Gltf";
import MeshRenderer from "nanogl-gltf/lib/renderer/MeshRenderer";

export default class OutRock {

  time = Math.random()

  position: vec3 = vec3.create();
  rotation: quat = quat.create();
  scale = 1;

  renderables: MeshRenderer[];

  constructor(private gltf: Gltf) {
    this.scale = 0.5 + Math.random() * 0.5;
    this.renderables = gltf.renderables;
  }

  start() {
    this.invalidate();
  }

  invalidate() {
    this.gltf.root.invalidate();
    this.gltf.root.updateWorldMatrix();
  }

  render(ctx: RenderContext) {
    if (ctx.pass === RenderPass.REFLECT_DEPTH || ctx.pass === RenderPass.DEPTH) return
    vec3.copy(this.gltf.root.position, this.position);
    vec3.set(this.gltf.root.scale, this.scale, this.scale, this.scale);

    this.invalidate();

    for (const renderable of this.renderables) {
      // if (renderable.node.name.includes("Plane.002_Baked") && (ctx.pass === RenderPass.REFLECT_DEPTH || ctx.pass === RenderPass.DEPTH)) continue;
      renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
    }
  }

}