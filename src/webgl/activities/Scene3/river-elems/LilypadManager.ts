import Node from "nanogl-node";
import MeshRenderer from "nanogl-gltf/lib/renderer/MeshRenderer";
import { ISheet } from "@theatre/core";
import { StandardPass } from "nanogl-pbr/StandardPass";
import { mat4, quat, vec3 } from "gl-matrix";

import Fog from "@webgl/activities/Scene3/chunks/fog/Fog";
import Time from "@webgl/Time";
import Renderer from "@webgl/Renderer";
import RenderMask from "@webgl/core/RenderMask";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import TextureAddChunk from "@webgl/glsl/textureAdd/TextureAddChunk";
import TheatreProgress from "@webgl/theatre/TheatreProgress";
import { RenderContext } from "@webgl/core/Renderer";
import { ElemPoolManager, ElemData } from "@webgl/activities/Scene3/ElemPoolManager";

export type LilypadElem = ElemData & {
  seed: number;
  target: vec3;
}

type LotusPart = {
  name: string;
  renderable: MeshRenderer;
}

export default class LilypadManager extends ElemPoolManager {
  currentZ = 3;
  elemList: LilypadElem[];

  renderLotus = false;

  lotusPool: Array<Array<LotusPart>> = [];
  renderables: MeshRenderer[] = [];
  poolPositionNodes: Node[] = [];

  lotusScaleSuccess: TheatreProgress[];

  constructor(
    renderer: Renderer, root: Node, ambientChunk: AmbientAddChunk,
    fogChunk: Fog, private sheetSuccess: ISheet
  ) {
    const tileTexChunk = new TextureAddChunk(renderer);

    super("scene3/lilypads.gltf", renderer, root, ambientChunk, tileTexChunk, fogChunk, (pass: StandardPass, name: string) => {
      if (name !== "Lotus") {
        pass.alphaMode.set("BLEND");
      }

      pass.mask = RenderMask.BLENDED;
      pass.glconfig
        .enableBlend()
        .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA);
    });
  }

  // --LOAD--

  override onLoaded() {
    this.pool = [];
    this.lotusPool = [];
    this.renderables = this.poolRes.gltf.renderables;

    const lotusList = new Map<string, LotusPart[]>();

    for (const renderable of this.renderables) {
      const name = renderable.node.name;

      if (name.startsWith("Lotus")) {
        const splitName = name.split("_");
        const lotusName = splitName[1];
        const partName = splitName[2];

        const lotusParts = lotusList.get(lotusName) || [];
        lotusParts.push({ name: partName, renderable });
        lotusList.set(lotusName, lotusParts);

        continue;
      }

      this.pool.push([renderable]);
      this.poolPositionNodes.push(renderable.node._children[0] || new Node());
    }

    lotusList.forEach(lotusParts => {
      lotusParts.sort((a, b) => a.name < b.name ? -1 : 1);
      this.lotusPool.push(lotusParts);
    });

    this.setupRadius();
  }

  // --START/STOP--

  override start() {
    super.start();

    this.lotusScaleSuccess = [];
    for (let i = 0; i < 4; i++) {
      this.lotusScaleSuccess.push(new TheatreProgress(0, (val) => this.updateLotusScale(val, i + 1), this.sheetSuccess, `Lotus / Part ${i + 1}`));
    }
  }

  stop() {
    for (const lotusProgress of this.lotusScaleSuccess) {
      lotusProgress.dispose();
    }
  }

  // --ADD--

  createElem(): ElemData {
    // LILYPAD

    const node = new Node();
    this.root.add(node);

    const index = Math.floor(Math.random() * this.pool.length);
    const scale = 1 + Math.random() * 0.2;
    const radius = this.poolRadius[index].global * scale;

    node.x = Math.random() * 10 - 5;
    node.z = this.currentZ - radius;
    node.rotateY(Math.random() * Math.PI * 2);
    node.setScale(scale);

    const renderables = [...this.pool[index]];
    const renderableNodes = renderables.map(() => null);

    // LOTUS

    const lotusIndex = Math.floor(Math.random() * this.lotusPool.length);
    const lotusParts = this.lotusPool[lotusIndex];

    for (let i = 0; i < lotusParts.length; i++) {
      const lotusPart = lotusParts[i];
      const partNode = new Node();

      node.add(partNode);
      vec3.copy(partNode.position, this.poolPositionNodes[index].position);
      partNode.setScale(this.lotusScaleSuccess[i]?.value || 0);

      renderables.push(lotusPart.renderable);
      renderableNodes.push(partNode);
    }

    // ELEM

    const lilypad = {
      node: node,
      seed: Math.random(),
      target: vec3.fromValues(node.x, 0, node.z + 1),
      radius,
      renderables,
      renderableNodes
    };

    return lilypad;
  }

  updateZ(elem: ElemData) {
    this.currentZ = elem.node.z - elem.radius - 5 - Math.random() * 10;
  }

  // --ANIM--

  updateLotusScale(progress: number, index: number) {
    for (const lilypad of this.elemList) {
      const node = lilypad.renderableNodes?.[index];
      if (!node) continue;
      quat.identity(node.rotation);
      node.rotateY(progress * (2 * Math.PI / 3));
      node.setScale(progress);
    }
    // (lotus world matrix is updated each frame in river elems manager
    // so we don't need to update here)
  }

  // --RENDER--

  preRender() {
    this.renderLotus = this.renderer.scene.holdValue > 0;
    this.tileTexChunk.timeU.set(Time.time);
  }

  render(ctx: RenderContext) {
    for (const lilypad of this.elemList) {
      // update texture chunk repeat
      this.tileTexChunk.textureRepeatU.set(lilypad.radius * 0.2);

      for (const [index, renderable] of lilypad.renderables.entries()) {
        if (index > 0 && !this.renderLotus) break;
        const node = lilypad.renderableNodes?.[index] || lilypad.node;
        mat4.copy(renderable.node._wmatrix, node._wmatrix);
        renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
      }
    }
  }
}