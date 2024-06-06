import Node from "nanogl-node";
import Texture2D from "nanogl/texture-2d";
import MaterialPass from "nanogl-pbr/MaterialPass";
import MeshRenderer from "nanogl-gltf/lib/renderer/MeshRenderer";
import { mat4 } from "gl-matrix";
import { Uniform } from "nanogl-pbr/Input";
import { StandardPass } from "nanogl-pbr/StandardPass";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";

import Fog from "@webgl/activities/Scene3/chunks/fog/Fog";
import lerp from "@/utils/Lerp";
import Time from "@webgl/Time";
import Rotate from "@webgl/activities/Scene3/chunks/rotate/Rotate";
import Renderer from "@webgl/Renderer";
import RenderMask from "@webgl/core/RenderMask";
import WaterDistort from "@webgl/activities/Scene3/chunks/water-distort/WaterDistort";
import StretchScroll from "@webgl/activities/Scene3/chunks/stretch-scroll/StretchScroll";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import TextureAddChunk from "@webgl/glsl/textureAdd/TextureAddChunk";
import FloorReflectionChunk from "@webgl/glsl/standard_ssr/FloorReflectionChunk";
import { RenderContext } from "@webgl/core/Renderer";
import { RIVER_LENGTH, RIVER_WIDTH } from "@webgl/activities/Scene3/constants";
import { ElemData, ElemPoolManager } from "@webgl/activities/Scene3/ElemPoolManager";

type PaintSplashElem = ElemData & {
  seed: number;
  color: [number, number, number];
  distortChunks: WaterDistort[];
  colorUniforms: Array<Uniform[]>;
}

type PaintScrollElem = {
  node: Node;
  seed: number;
  scale: number;
  speed: number;
  alpha: number;
  color: [number, number, number];
  distortScale: number;
  scrollChunks: StretchScroll[];
  distortChunks: WaterDistort[];
  colorUniforms: Array<Uniform[]>;
}

type RenderElem = {
  y: number;
  elem: PaintSplashElem | PaintScrollElem;
  type: "splash" | "scroll";
}

const WIDTH = RIVER_WIDTH * 0.8;
const PAINT_SPLASH_COLOR = [0, .25, .408];

export default class PaintManager extends ElemPoolManager {
  root: Node;

  time = 0;
  stretch = 1;
  worldScroll = 0;
  scrollOffset = 0;
  speedProgress = 0;
  stretchOffset = 1;
  stretchLastAdd = 0;

  currentZ = 3;
  renderables: MeshRenderer[] = [];
  elemList: PaintSplashElem[] = [];
  renderElemList: RenderElem[] = [];

  paintScrollSize = 1;
  paintScrollElemList: PaintScrollElem[] = [];
  paintScrollRenderable: MeshRenderer;

  waterRotateTime: Uniform;
  waterRotateSeed: Uniform;
  waterScrollChunks: Map<string, StretchScroll> =  new Map();
  waterColorUniforms: Map<string, Uniform[]> = new Map();
  waterDistortChunks: Map<string, WaterDistort> = new Map();

  constructor(
    renderer: Renderer, riverRoot: Node, ambientChunk: AmbientAddChunk,
    fogChunk: Fog, noiseTex: Texture2D, floorReflectivityUniform: Uniform
  ) {
    const root = new Node();
    riverRoot.add(root);

    const waterRotate = new Rotate(noiseTex);
    const tileTexChunk = new TextureAddChunk(renderer);

    super("scene3/water.gltf", renderer, root, ambientChunk, null, fogChunk, (pass: StandardPass, name?: string) => {
      // COMMON
      const colorUniforms = [];
      // add water distort chunk BEFORE chunks using custom coords
      if (pass.inputs._chunks.findIndex(c => c instanceof WaterDistort) === -1) {
        const waterDistort = new WaterDistort(pass, noiseTex);
        this.waterDistortChunks.set(name || "default", waterDistort);
        pass.inputs._chunks.unshift(waterDistort);
        pass.inputs.invalidateList();
      }

      // PAINT SCROLL
      if (name.startsWith("paint_scroll")) {
        // add water scroll chunk just after water distort chunk
        if (pass.inputs._chunks.findIndex(c => c instanceof StretchScroll) === -1) {
          const waterScroll = new StretchScroll(pass);
          this.waterScrollChunks.set(name || "default", waterScroll);
          pass.inputs._chunks.splice(1, 0, waterScroll);
          pass.inputs.invalidateList();
          colorUniforms.push(pass.alphaFactor.attachUniform());
        }
      }
      // PAINT SPLASH
      else {
        // add rotate chunk
        pass.inputs.add(waterRotate);
        // add texture chunk
        pass.inputs.add(tileTexChunk);
        // alpha
        pass.alphaFactor.attachConstant(0.8);
      }

      // COMMON
      pass.alphaMode.set("BLEND");
      (pass.surface as MetalnessSurface).roughnessFactor.attachConstant(1);
      pass.mask = RenderMask.BLENDED;
      pass.glconfig
        .enableBlend()
        .depthMask(false)
        .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA);

      this.createWaterReflection(pass, floorReflectivityUniform);
      colorUniforms.unshift(pass.surface.baseColor.attachUniform());
      this.waterColorUniforms.set(name || "default", colorUniforms);
    });

    this.tileTexChunk = tileTexChunk;
    this.waterRotateTime = waterRotate.time.attachUniform();
    this.waterRotateSeed = waterRotate.seed.attachUniform();
  }

  createWaterReflection(pass: MaterialPass, floorReflectivityUniform: Uniform) {
    if (!pass) return;

    const reflChunk = new FloorReflectionChunk();
    reflChunk.reflectionTexture = this.renderer.reflect.getOutput();
    pass.inputs.add(reflChunk);

    reflChunk.strength.attach(floorReflectivityUniform);
  }

  // --LOAD--

  override onLoaded(): void {
    const gltf = this.poolRes.gltf;
    this.pool = [];
    this.renderables = gltf.renderables;

    for (const renderable of gltf.renderables) {
      if (renderable.node.name === "Plane_scroll") {
        this.paintScrollRenderable = renderable;
        this.paintScrollSize = renderable.bounds.max[2] - renderable.bounds.min[2];
        continue;
      }

      this.pool.push([renderable]);
    }

    this.setupRadius();
  }

  // --START--

  override start() {
    super.start();

    this.time = 0;
    this.stretch = 1;
    this.worldScroll = 0;
    this.scrollOffset = 0;
    this.stretchOffset = 1;
    this.stretchLastAdd = 0;
    this.renderElemList = [];

    this.root.y = 0;
    this.root.invalidate();
    this.root.updateWorldMatrix();

    this.setupPaintScrollElems();
  }

  // --PAINT SCROLL SETUP--

  setupPaintScrollElems() {
    this.paintScrollElemList = [];

    // get scroll chunks, distort chunks and color uniforms
    // from paint scroll renderable materials
    const scrollChunks = [];
    const colorUniforms = [];
    const distortChunks = [];
    for (const mat of this.paintScrollRenderable.materials) {
      const scrollChunk = this.waterScrollChunks.get(mat.name);
      if (scrollChunk) scrollChunks.push(scrollChunk);
      const distortChunk = this.waterDistortChunks.get(mat.name);
      if (distortChunk) distortChunks.push(distortChunk);
      const colorUniform = this.waterColorUniforms.get(mat.name);
      if (colorUniform) colorUniforms.push(colorUniform);
    }

    // MAIN PAINT SCROLL ELEMS

    const node1 = new Node();
    const xScale1 = WIDTH * 0.4;
    const length1 = xScale1 * 9;
    const seed1 = Math.random();
    node1.y = -0.0001;
    node1.x = WIDTH * 0.05;
    node1.scale[0] = xScale1;
    node1.scale[2] = RIVER_LENGTH;
    node1.invalidate();
    node1.updateWorldMatrix();

    this.paintScrollElemList.push({
      node: node1,
      seed: seed1,
      speed: 1 / length1 * 0.75,
      alpha: 1,
      color: [.258, .551, .608],
      scale: node1.scale[2] / length1,
      distortScale: 1 / xScale1 * 0.8,
      scrollChunks,
      distortChunks,
      colorUniforms,
    });

    const node2 = new Node();
    const xScale2 = WIDTH * 0.5;
    const length2 = xScale2 * 4;
    const seed2 = (seed1 + 0.3 + Math.random() * 0.2) % 1;
    node2.y = -0.0002;
    node2.x = -WIDTH * 0.1;
    node2.scale[0] = xScale2;
    node2.scale[2] = RIVER_LENGTH;
    node2.invalidate();
    node2.updateWorldMatrix();

    this.paintScrollElemList.push({
      node: node2,
      seed: seed2,
      speed: 1 / length2 * 0.5,
      alpha: 0.7,
      color: [.208, .501, .558],
      scale: node2.scale[2] / length2,
      distortScale: 1 / xScale2 * 0.8,
      scrollChunks,
      distortChunks,
      colorUniforms,
    });

    // SMALLER PAINT SCROLL ELEMS

    const node3 = new Node();
    const xScale3 = WIDTH * 0.1;
    const length3 = xScale3 * 15;
    const seed3 = Math.random();
    node3.x = WIDTH * 0.3;
    node3.y = 0.0001;
    node3.scale[0] = xScale3;
    node3.scale[3] = RIVER_LENGTH;
    node3.invalidate();
    node3.updateWorldMatrix();

    this.paintScrollElemList.push({
      node: node3,
      seed: seed3,
      alpha: 1,
      color: [.458, .751, .808],
      speed: 1 / length3 * 1.3,
      scale: node3.scale[3] / length3,
      distortScale: 1 / xScale3 * 0.8,
      scrollChunks,
      distortChunks,
      colorUniforms,
    });

    const node4 = new Node();
    const xScale4 = WIDTH * 0.15;
    const length4 = xScale4 * 10;
    const seed4 = (seed3 + 0.4 + Math.random() * 0.2) % 1;
    node4.x = -WIDTH * 0.05;
    node4.y = 0.0001;
    node4.scale[0] = xScale4;
    node4.scale[2] = RIVER_LENGTH;
    node4.invalidate();
    node4.updateWorldMatrix();

    this.paintScrollElemList.push({
      node: node4,
      seed: seed4,
      alpha: 1,
      color: [.458, .751, .808],
      speed: 1 / length4 * 1.6,
      scale: node4.scale[2] / length4,
      distortScale: 1 / xScale4 * 0.8,
      scrollChunks,
      distortChunks,
      colorUniforms,
    });

    // RENDER ELEM LIST

    for (const paintScroll of this.paintScrollElemList) {
      this.renderElemList.push({
        y: paintScroll.node._wposition[1],
        elem: paintScroll,
        type: "scroll",
      });
    }
  }

  // --PAINT SPLASH CREATION--

  elemFromData(position: number[], scale: number, color: [number, number, number], zHasOffset = false): PaintSplashElem {
    const index = Math.floor(Math.random() * this.pool.length);
    const renderables = [...this.pool[index]];
    const radius = this.poolRadius[index].global * scale;

    const node = new Node();
    this.root.add(node);

    const zOffset = zHasOffset ? radius : 0;
    node.position.set([position[0], position[1], position[2] - zOffset]);
    node.rotateY(Math.PI * 2 * Math.random());
    node.setScale(scale);

    const distortChunks = [];
    const colorUniforms = [];
    for (const renderable of renderables) {
      for (const mat of renderable.materials) {
        const distortChunk = this.waterDistortChunks.get(mat.name);
        if (distortChunk) distortChunks.push(distortChunk);
        const colorUniform = this.waterColorUniforms.get(mat.name);
        if (colorUniform) colorUniforms.push(colorUniform);
      }
    }

    return {
      node: node,
      seed: Math.random(),
      color,
      radius,
      renderables,
      distortChunks,
      colorUniforms,
    };
  }

  createElem(big = false): PaintSplashElem {
    const yOffsetFactor = Math.random();
    const colorFactor = 0.5 + (1 - yOffsetFactor) * 0.3;

    const position = [
      (big ? Math.random() * 0.2 - 0.1 : Math.random() * 0.8 - 0.4) * WIDTH,
      -1 - yOffsetFactor * 4,
      big ? this.currentZ : this.currentZ - Math.random() * WIDTH * 2,
    ];
    const scale = (big ? 0.6 + Math.random() * 0.2 : 0.1 + Math.random() * 0.4) * WIDTH;
    const color = PAINT_SPLASH_COLOR.map(
      c => c * colorFactor
    ) as [number, number, number];

    return this.elemFromData(position, scale, color, true);
  }

  override addElem(elem: PaintSplashElem, updateZ = false) {
    super.addElem(elem);

    this.renderElemList.push({
      y: elem.node._wposition[1],
      elem,
      type: "splash",
    });
    this.renderElemList.sort((a, b) => a.y - b.y);

    if (!updateZ) return;

    this.currentZ = elem.node.z - elem.radius * (Math.random() * 0.5);
  }

  override removeElem(index: number, elem: PaintSplashElem) {
    super.removeElem(index, elem);

    const renderIndex = this.renderElemList.findIndex(e => e.elem === elem);
    if (renderIndex <= -1) return;
    this.renderElemList.splice(renderIndex, 1);
  }

  // --SCROLL--

  scroll(z: number) {
    this.scrollOffset +=
      (z - this.worldScroll) / RIVER_LENGTH * this.stretch;
    this.worldScroll = z;
  }

  // --RENDER--

  preRender(speedProgress: number) {
    this.tileTexChunk.timeU.set(Time.time);

    const dt = Time.dt * 0.001;
    this.time += dt * (1 + speedProgress);

    const stretch = 1 / (1 + speedProgress * 12);
    const stretchAdd = this.renderer.scene.blockHold || stretch > this.stretch
      ? lerp(this.stretchLastAdd, 0, 0.01)
      : stretch - this.stretch;
    this.stretchOffset += stretchAdd;

    this.stretch = stretch;
    this.stretchLastAdd = stretchAdd;
    this.speedProgress = speedProgress;
  }

  renderPaintScroll(ctx: RenderContext, paintScroll: PaintScrollElem) {
    if (!this.paintScrollRenderable) return;

    // update scroll chunks uniforms
    for (const chunk of paintScroll.scrollChunks) {
      chunk.offsetUniform.set(this.scrollOffset + paintScroll.seed);
      chunk.scaleUniform.set(paintScroll.scale);
      chunk.timeUniform.set(this.time * paintScroll.speed);
    }

    // update water distort chunks uniforms
    for (const distortChunk of paintScroll.distortChunks) {
      distortChunk.timeUniform.set(this.time);
      distortChunk.offsetScaleUniform.set(paintScroll.distortScale);
    }

    // update color uniforms
    for (const colorUniform of paintScroll.colorUniforms) {
      colorUniform[0]?.set(...paintScroll.color);
      colorUniform[1]?.set(paintScroll.alpha);
    }

    // render paint scroll
    mat4.copy(this.paintScrollRenderable.node._wmatrix, paintScroll.node._wmatrix);
    this.paintScrollRenderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
  }

  renderPaintSplash(ctx: RenderContext, paintSplash: PaintSplashElem) {
    // update water rotate seed
    this.waterRotateSeed.set(paintSplash.seed);

    // update texture chunk repeat
    this.tileTexChunk.textureRepeatU.set(paintSplash.radius * 0.2);

    // update water distort chunks uniforms
    for (const distortChunk of paintSplash.distortChunks) {
      distortChunk.offsetScaleUniform.set(
        paintSplash.radius > 0 ? 1 / paintSplash.radius : 1
      );
    }

    // update color uniforms
    for (const colorUniform of paintSplash.colorUniforms) {
      colorUniform[0]?.set(...paintSplash.color);
    }

    // render paint renderables
    for (const renderable of paintSplash.renderables) {
      mat4.copy(renderable.node._wmatrix, paintSplash.node._wmatrix);
      renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
    }
  }

  render(ctx: RenderContext) {
    // update water distort chunks common uniforms
    for (const chunk of this.waterDistortChunks.values()) {
      chunk.timeUniform.set(this.time);
      chunk.scrollUniform.set(this.worldScroll);
    }

    // update water scroll chunks common uniforms
    for (const chunk of this.waterScrollChunks.values()) {
      chunk.stretchUniform.set(this.stretch);
      chunk.stretchOffsetUniform.set(this.stretchOffset);
    }

    // update water rotate chunk common uniform
    this.waterRotateTime.set(this.time);

    // render all paint elems
    // sorted by y position
    for (const paintElem of this.renderElemList) {
      if (paintElem.type === "scroll") {
        this.renderPaintScroll(ctx, paintElem.elem as PaintScrollElem);
        continue;
      }
      this.renderPaintSplash(ctx, paintElem.elem as PaintSplashElem);
    }
  }
}