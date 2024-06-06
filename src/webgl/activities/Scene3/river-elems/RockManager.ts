import Node from "nanogl-node";
import Renderer from "@webgl/Renderer";
import GltfNode from "nanogl-gltf/lib/elements/Node";
import Texture2D from "nanogl/texture-2d";
import MeshRenderer from "nanogl-gltf/lib/renderer/MeshRenderer";
import { ISheet } from "@theatre/core";
import { mat4, vec3 } from "gl-matrix";
import { StandardPass } from "nanogl-pbr/StandardPass";

import Fog from "@webgl/activities/Scene3/chunks/fog/Fog";
import Time from "@webgl/Time";
import Viewport from "@/store/modules/Viewport";
import RockMoss from "@webgl/activities/Scene3/chunks/rock-moss/RockMoss";
import RenderMask from "@webgl/core/RenderMask";
import Underwater from "@webgl/activities/Scene3/chunks/underwater/UnderWater";
import AssetDatabase from "@webgl/resources/AssetDatabase";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import TextureAddChunk from "@webgl/glsl/textureAdd/TextureAddChunk";
import TheatreProgress from "@webgl/theatre/TheatreProgress";
import { RenderContext } from "@webgl/core/Renderer";
import { TextureResource } from "@webgl/resources/TextureResource";
import { ElemPoolManager, ElemData, RadiusData } from "@webgl/activities/Scene3/ElemPoolManager";

export type RockElem = ElemData & {
  isDecor: boolean;
  radiusList: number[];
  mossChunks: RockMoss[];
  frogPosition?: vec3;
  maxFlowerAmount: number;
}

const MOSS_ROCKS_IDS = [
  { id: "01", rocks: ["01", "05"] },
  { id: "02", rocks: ["02"] },
  { id: "03", rocks: ["03"] },
  { id: "04", rocks: ["04"] },
];


export default class RockManager extends ElemPoolManager {
  decorPool: Array<MeshRenderer[]>;
  decorPoolRadius: RadiusData[] = [];
  poolPositionNodes: Node[] = [];

  isLeft = true;
  decorZ = 3;
  isDecor = false;
  currentZ = 3;
  elemList: RockElem[];
  mossProgress = 0;

  mossTexRes: TextureResource[] = [];
  mossChunks: Map<string, RockMoss> = new Map();
  underwaterChunk: Underwater;

  mossProgressSuccess: TheatreProgress;

  constructor(
    renderer: Renderer, root: Node, ambientChunk: AmbientAddChunk,
    fogChunk: Fog, private sheetSuccess: ISheet, noiseTex: Texture2D
  ) {
    // Moss textures
    const mossTexRes: Map<string, TextureResource> = new Map();

    for (let i = 0; i < MOSS_ROCKS_IDS.length; i++) {
      const texData = MOSS_ROCKS_IDS[i];
      const id = texData.id;

      const texRes = new TextureResource({
        sources: [{
          codec: "basis",
          lods: [
            {
              files: [AssetDatabase.getAssetPath(`scene3/MossRock_${id}_Flowers_Diffuse.ktx2`)]
            }],
        }]
      }, renderer.gl);

      for (let j = 0; j < texData.rocks.length; j++) {
        mossTexRes.set(`MossRock_${texData.rocks[j]}`, texRes);
      }
    }

    // Underwater chunk
    const underwater = new Underwater();

    // Texture chunk
    const tileTexChunk = new TextureAddChunk(renderer);

    // Setup
    super("scene3/rocks.gltf", renderer, root, ambientChunk, tileTexChunk, fogChunk, (pass: StandardPass, name: string) => {
      if (name.startsWith("MossRock")) {
        const mossTex = mossTexRes.get(name);
        if (mossTex) {
          const mossChunk = new RockMoss(mossTex.texture, noiseTex, pass);
          this.mossChunks.set(name || "default", mossChunk);
          pass.inputs.add(mossChunk);
        }
      }

      pass.inputs.add(underwater);
      pass.mask = RenderMask.BLENDED;
      pass.glconfig
        .enableBlend()
        .depthMask(true)
        .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA);
    });

    this.underwaterChunk = underwater;
    this.mossTexRes = [...new Set(mossTexRes.values())];
  }

  // --GETTERS--

  get mainRocks() {
    return this.elemList.filter(rock => !rock.isDecor);
  }

  // --LOAD--

  override async load() {
    await Promise.all([
      super.load(),
      ...this.mossTexRes.map(texRes => texRes.load())
    ]);
  }

  override onLoaded() {
    this.renderables = this.poolRes.gltf.renderables;

    this.pool = [];
    this.decorPool = [];
    this.poolPositionNodes = [];

    const rocks = this.poolRes.gltf.root._children as GltfNode[];

    for (const rock of rocks) {
      const isDecor = rock.name.startsWith("Decor");
      const children = rock._children as GltfNode[];
      const renderables = [];

      for (const node of children) {
        if (!isDecor && node.name.startsWith("Frog")) {
          this.poolPositionNodes.push(node);
          continue;
        }

        if (!node.renderable) continue;

        node.updateMatrix();
        renderables.push(node.renderable);
      }

      const list = isDecor ? this.decorPool : this.pool;
      list.push(renderables);
    }

    this.poolRadius = [];
    this.decorPoolRadius = [];
    this.setupRadius(this.pool, this.poolRadius, true);
    this.setupRadius(this.decorPool, this.decorPoolRadius, true);
  }

  // --START/STOP--

  override start() {
    super.start();

    this.isLeft = true;
    this.mossProgress = 0;

    this.mossProgressSuccess = new TheatreProgress(0, this.updateMossProgress, this.sheetSuccess, "Rocks / Moss progress");
  }

  stop() {
    this.mossProgressSuccess.dispose();
  }

  // --ROCK CREATION--

  elemFromData(x: number, z: number, pool: Array<MeshRenderer[]>,
    poolRadius: RadiusData[], isDecor: boolean): RockElem {
    const node = new Node();
    this.root.add(node);

    const rockIndex = Math.floor(Math.random() * pool.length);
    const scale = 1.5 + Math.random() * 0.3;

    const radiusData = poolRadius[rockIndex];
    const radiusList = radiusData.list.map(radius => radius * scale);
    const radius = radiusData.global * scale;

    const renderables = [...pool[rockIndex]];
    const renderableNodes = renderables.map(renderable => {
      const renderableNode = new Node();
      renderableNode.setMatrix(renderable.node._matrix);
      node.add(renderableNode);
      return renderableNode;
    });

    node.x = x;
    node.z = this.currentZ - radius + z;
    node.rotateY(Math.random() * Math.PI * 2);
    node.setScale(scale);

    const frogNode = this.poolPositionNodes[rockIndex];
    const mossChunks = [];
    for (const renderable of renderables) {
      for (const mat of renderable.materials) {
        const mossChunk = this.mossChunks.get(mat.name);
        if (mossChunk) mossChunks.push(mossChunk);
      }
    }

    const rock = {
      node: node,
      radius,
      isDecor,
      mossChunks,
      radiusList,
      renderables,
      renderableNodes,
      frogPosition: isDecor
        ? null
        : vec3.fromValues(frogNode.x, frogNode.y, frogNode.z),
      maxFlowerAmount: mossChunks.length > 0 && Math.random() > 0.3
        ? 0.3 + Math.random() * 0.7
        : 0,
    };

    return rock;
  }

  createElem(): RockElem {
    if (this.isDecor) {
      const factor = this.isLeft ? 1 : -1;
      const x = (7 + Math.random()) * factor;
      const z = Math.random() * 4 - 2;

      return this.elemFromData(x, z, this.decorPool, this.decorPoolRadius, true);
    }

    const factor = this.isLeft ? -1 : 1;
    const maxX = Viewport.isMobile ? 2 : 3;
    const x = Math.random() * maxX * factor;
    return this.elemFromData(x, 0, this.pool, this.poolRadius, false);
  }

  override addElem(elem: RockElem) {
    super.addElem(elem);

    // decor rock only possible if prev is not decor
    // and prev decor is far enough
    this.isDecor = this.isDecor || Math.abs(this.decorZ - this.currentZ) < 5
      ? false : Math.random() > 0.5;

    if (elem.isDecor) {
      this.decorZ = elem.node.z;
      return;
    }

    this.isLeft = !this.isLeft;
    this.currentZ = elem.node.z - elem.radius - 0.2 - Math.random() * 4;

    if (!elem.frogPosition) return;

    vec3.transformMat4(elem.frogPosition, elem.frogPosition, elem.node._matrix);
  }

  // --ANIM--

  updateMossProgress = (progress: number) => {
    this.mossProgress = progress;
  }

  // --RENDER--

  preRender() {
    this.tileTexChunk.timeU.set(Time.time);
  }

  render(ctx: RenderContext) {
    for (const rock of this.elemList) {
      for (const mossChunk of rock.mossChunks) {
        mossChunk.mossProgressUniform.set(this.mossProgress);
        mossChunk.mossEndProgressUniform.set(rock.maxFlowerAmount);
      }

      for (const [index, renderable] of rock.renderables.entries()) {
        // update texture chunk repeat
        const radius = rock.radiusList[index] ?? rock.radius;
        this.tileTexChunk.textureRepeatU.set(radius * 0.4);

        const node = rock.renderableNodes[index] || rock.node;
        mat4.copy(renderable.node._wmatrix, node._wmatrix);
        renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
      }
    }
  }
}