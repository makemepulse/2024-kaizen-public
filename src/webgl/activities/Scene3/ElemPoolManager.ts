import Node from "nanogl-node";
import MeshRenderer from "nanogl-gltf/lib/renderer/MeshRenderer";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import { StandardPass } from "nanogl-pbr/StandardPass";

import Fog from "@webgl/activities/Scene3/chunks/fog/Fog";
import Renderer from "@webgl/Renderer";
import GltfResource from "@webgl/resources/GltfResource";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import TextureAddChunk from "@webgl/glsl/textureAdd/TextureAddChunk";
import { RenderContext } from "@webgl/core/Renderer";

export type ElemData = {
  node: Node;
  radius: number;
  renderables: MeshRenderer[];
  renderableNodes?: Array<Node | null>;
}

export type RadiusData = {
  list: number[];
  global: number;
}

export abstract class ElemPoolManager {
  pool: Array<MeshRenderer[]>;
  poolRes: GltfResource;
  poolRadius: RadiusData[] = [];
  renderables: MeshRenderer[];

  elemList: ElemData[] = [];

  constructor(gltfPath: string, public renderer: Renderer, public root: Node, public ambientChunk: AmbientAddChunk, public tileTexChunk?: TextureAddChunk, public fogChunk?: Fog, overrideColor?: (pass: StandardPass, name?: string) => void) {
    const materialOverride = new MaterialOverrideExtension();
    materialOverride.overridePass("", (ctx, material) => {
      material.name = ctx.data.name;
      const pass =  material.getPass("color").pass;
      pass.inputs.add(this.ambientChunk);
      if (overrideColor) overrideColor(pass as StandardPass, ctx.data.name);
      if (tileTexChunk) pass.inputs.add(this.tileTexChunk);
      if (fogChunk) pass.inputs.add(this.fogChunk);
      return null;
    });

    this.poolRes = new GltfResource(gltfPath, this.renderer.gl, {
      defaultTextureFilter: this.renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [materialOverride],
    });
  }

  // --LOAD--

  async load() {
    await this.poolRes.load();
  }

  onLoaded() {
    this.renderables = this.poolRes.gltf.renderables;
    this.pool = this.renderables.map(renderable => [renderable]);
    this.poolRadius = [];
    this.setupRadius();
  }

  // --START--

  start() {
    this.elemList = [];
  }

  // --SETUP RADIUS--

  setupRadius(pool: Array<MeshRenderer[]> = this.pool, poolRadius: RadiusData[] = this.poolRadius, useTransform = false) {
    for (const renderables of pool) {
      const list = [];
      const relativeList = [];

      for (const renderable of renderables) {
        const min = renderable.bounds.min;
        const max = renderable.bounds.max;
        const node = renderable.node;
        const scale = useTransform ? node.scale : [1, 1, 1];

        // radius in list is renderable radius
        // when position is at origin
        const radius = Math.max(
          Math.abs(max[0]) * scale[0],
          Math.abs(min[0]) * scale[0],
          Math.abs(max[2]) * scale[2],
          Math.abs(min[2]) * scale[2]
        );
        list.push(radius);

        if (!useTransform) {
          relativeList.push(radius);
          continue;
        }

        // bounds used to calculate global radius
        // take into account renderable position
        // (if useTransform is true)
        relativeList.push(Math.max(
          Math.abs(max[0] + node.x) * scale[0],
          Math.abs(min[0] + node.x) * scale[0],
          Math.abs(max[2] + node.z) * scale[2],
          Math.abs(min[2] + node.z) * scale[2]
        ));
      }

      const global = Math.max(...relativeList);

      poolRadius.push({
        list,
        global,
      });
    }
  }

  // --ADD/REMOVE ELEMENT--

  createElem?(): ElemData;

  addElem(elem: ElemData) {
    this.elemList.push(elem);
    elem.node.invalidate();
    elem.node.updateWorldMatrix();
  }

  removeElem(index: number, elem: ElemData) {
    if (index <= -1) return;
    this.elemList.splice(index, 1);
  }

  // --RENDER--

  abstract render(ctx: RenderContext): void;
}