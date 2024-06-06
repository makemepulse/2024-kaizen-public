import RenderPass from "@webgl/core/RenderPass";
import { RenderContext } from "@webgl/core/Renderer";
import { quat, vec3 } from "gl-matrix";
import Gltf from "nanogl-gltf/lib/Gltf";
import GltfTypes from "nanogl-gltf/lib/types/GltfTypes";
import Node from "nanogl-node";
import { smoothstep } from "@webgl/math";

export default class Lily {

  time = Math.random()

  position: vec3 = vec3.create();

  topRotation: quat = quat.create();
  lotusRotation: quat = quat.create();

  node: Node;
  foamNode: Node;
  petale_01: Node
  petale_02: Node
  petale_03: Node
  pistils: Node

  constructor(private gltf: Gltf, private foamGltf: Gltf, public hasLotus = false, public scale = 1) {
    this.node = gltf.root;

    quat.rotateY(this.topRotation, this.topRotation, Math.random() * Math.PI * 2);

    this.foamNode = foamGltf.root;
  }

  start() {
    if (this.hasLotus) {
      this.petale_01 = this.gltf.getElementByName(GltfTypes.NODE, "petale_01");
      this.petale_02 = this.gltf.getElementByName(GltfTypes.NODE, "petale_02");
      this.petale_03 = this.gltf.getElementByName(GltfTypes.NODE, "petale_03");
      this.pistils = this.gltf.getElementByName(GltfTypes.NODE, "pistils");
      this.petale_01.setScale(0.01);
      this.petale_02.setScale(0.01);
      this.petale_03.setScale(0.01);
      this.pistils.setScale(0.01);
      this.petale_01.invalidate();
      this.petale_02.invalidate();
      this.petale_03.invalidate();
      this.pistils.invalidate();
      this.petale_01.updateWorldMatrix();
      this.petale_02.updateWorldMatrix();
      this.petale_03.updateWorldMatrix();
      this.pistils.updateWorldMatrix();
      quat.rotateY(this.lotusRotation, this.lotusRotation, Math.random() * Math.PI * 2);
    }

    this.invalidate();
  }

  invalidate() {
    this.gltf.root.invalidate();
    this.gltf.root.updateWorldMatrix();

    this.node.invalidate();
    this.node.updateWorldMatrix();

    this.foamNode.invalidate();
    this.foamNode.updateWorldMatrix();
  }

  preRender(opening: number) {
    if (this.hasLotus) {
      const e = opening;
      const e0 = smoothstep(0, 0.4, e);
      const e1 = smoothstep(0, 0.6, e);
      const e2 = smoothstep(0, 0.8, e);
      const e3 = smoothstep(0, 1.0, e);

      this.pistils.setScale(e0);
      this.petale_01.setScale(e1);
      this.petale_02.setScale(e2);
      this.petale_03.setScale(e3);
      quat.identity(this.pistils.rotation);
      this.pistils.rotateY(Math.PI * 2 * e0);
      quat.identity(this.petale_01.rotation);
      this.petale_01.rotateY(Math.PI * 2 * e1);
      quat.identity(this.petale_02.rotation);
      this.petale_02.rotateY(Math.PI * 2 * e2);
      quat.identity(this.petale_03.rotation);
      this.petale_03.rotateY(Math.PI * 2 * e3);
      this.petale_01.invalidate();
      this.petale_02.invalidate();
      this.petale_03.invalidate();
      this.pistils.invalidate();
      this.petale_01.updateWorldMatrix();
      this.petale_02.updateWorldMatrix();
      this.petale_03.updateWorldMatrix();
      this.pistils.updateWorldMatrix();
    }
  }

  render(ctx: RenderContext) {
    vec3.copy(this.gltf.root.position, this.position);
    vec3.copy(this.foamNode.position, this.position);
    vec3.sub(this.foamNode.position, this.foamNode.position, vec3.fromValues(0, 0.001, 0));

    vec3.set(this.gltf.root.scale, this.scale, this.scale, this.scale);
    vec3.copy(this.foamNode.scale, this.gltf.root.scale);
    vec3.add(this.foamNode.scale, this.foamNode.scale, vec3.fromValues(0.4, 0.4, 0.4));

    quat.copy(this.node.rotation, this.topRotation);
    quat.copy(this.foamNode.rotation, this.topRotation);

    this.invalidate();

    if (ctx.pass !== RenderPass.DEPTH && ctx.pass !== RenderPass.REFLECT_DEPTH)
      for (const renderable of this.foamGltf.renderables) {
        renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
      }

    for (const renderable of this.gltf.renderables) {
      renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
    }
  }

}