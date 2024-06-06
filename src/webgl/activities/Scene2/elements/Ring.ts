import Renderer from "@webgl/Renderer";
import { RenderContext } from "@webgl/core/Renderer";
import Gltf from "nanogl-gltf/lib/Gltf";
import RingChunk from "../chunks/ring/RingChunk";
import Time from "@webgl/Time";
import { quat } from "gl-matrix";
import Node from "nanogl-node";
import vec3 from "gl-matrix/src/gl-matrix/vec3";

export class Ring {

  gltf: Gltf

  time = 0
  baseTime = 0.0001
  timeMult = 0.001

  rotation = 0

  opacity = 0.3

  node: Node

  constructor(private renderer: Renderer) {

    this.node = new Node();
  }

  onLoaded(gltf: Gltf) {
    this.gltf = gltf;
  }

  start() {
    this.node.setScale(8);
    this.node.y = -0.1;
    this.node.invalidate();
    this.node.updateWorldMatrix();
  }

  stop() {

  }

  preRender(rotation: number) {
    const e = rotation;
    this.time += Time.scaledDt * (0.00015 + e * 0.00035);
    quat.identity(this.node.rotation);
    quat.rotateY(this.node.rotation, this.node.rotation, this.rotation);
    this.node.invalidate();
    this.node.updateWorldMatrix();
    this.rotation += Time.scaledDt * (this.baseTime + e * this.timeMult);
  }

  render(ctx: RenderContext, ringChunk: RingChunk, opacity: number) {
    const e = opacity;
    ringChunk.opacityU.set(e * this.opacity);
    vec3.copy(this.gltf.root.position, this.node.position);
    vec3.copy(this.gltf.root.scale, this.node.scale);
    quat.copy(this.gltf.root.rotation, this.node.rotation);
    this.gltf.root.invalidate();
    this.gltf.root.updateWorldMatrix();

    for (const renderable of this.gltf.renderables) {
      renderable.node.updateWorldMatrix();
      renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
    }

  }
}