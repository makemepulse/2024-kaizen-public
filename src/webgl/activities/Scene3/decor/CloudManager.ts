import Gltf from "nanogl-gltf/lib/Gltf";
import Node from "nanogl-node";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import { mat4 } from "gl-matrix";
import { ISheet } from "@theatre/core";
import { Uniform } from "nanogl-pbr/Input";
import { StandardPass } from "nanogl-pbr/StandardPass";

import lerp from "@/utils/Lerp";
import Time from "@webgl/Time";
import Renderer from "@webgl/Renderer";
import FogClouds from "@webgl/activities/Scene3/chunks/fog-clouds/FogClouds";
import RenderMask from "@webgl/core/RenderMask";
import GltfResource from "@webgl/resources/GltfResource";
import StretchScroll from "@webgl/activities/Scene3/chunks/stretch-scroll/StretchScroll";
import TheatreProgress from "@webgl/theatre/TheatreProgress";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import { RenderContext } from "@webgl/core/Renderer";
import { RIVER_LENGTH, RIVER_WIDTH } from "@webgl/activities/Scene3/constants";

const SPEED = 0.05;

type Cloud = {
  node: Node;
  seed: number;
  alpha: number;
  speed: number;
}

const MAX_FOG_DIST = RIVER_LENGTH * 0.5;

export default class CloudManager {
  gltf: Gltf;
  gltfRes: GltfResource;

  time = 0;
  stretch = 1;
  stretchOffset = 1;
  speedProgress = 0;
  stretchLastAdd = 0;

  root: Node;
  cloudsList: Cloud[] = [];

  fogChunk: FogClouds;
  scrollChunk: StretchScroll;
  alphaUniform: Uniform;

  speedSuccess: TheatreProgress;

  constructor(
    private renderer: Renderer, ambientChunk: AmbientAddChunk,
    private sheetSuccess: ISheet
  ) {
    this.root = new Node();

    const fogChunk = new FogClouds();
    fogChunk.minDistZ.attachConstant(0);
    fogChunk.maxDistZ.attachConstant(MAX_FOG_DIST);

    const materialOverride = new MaterialOverrideExtension();
    materialOverride.overridePass("", (ctx, material) => {
      const pass = material.getPass("color").pass as StandardPass;

      // add stretch scroll chunk BEFORE any other chunk
      if (pass.inputs._chunks.findIndex(c => c instanceof StretchScroll) === -1) {
        const scrollChunk = new StretchScroll(pass);
        scrollChunk.scaleUniform.set(1);
        this.scrollChunk = scrollChunk;
        pass.inputs._chunks.unshift(scrollChunk);
        pass.inputs.invalidateList();
      }

      this.alphaUniform = pass.alphaFactor.attachUniform();

      pass.inputs.add(ambientChunk);
      pass.alphaMode.set("BLEND");
      pass.mask = RenderMask.BLENDED;
      pass.glconfig
        .enableBlend()
        .depthMask(false)
        .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA);

      pass.inputs.add(fogChunk);
      return null;
    });

    this.fogChunk = fogChunk;

    this.gltfRes = new GltfResource("scene3/clouds.gltf", this.renderer.gl, {
      defaultTextureFilter: this.renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [materialOverride],
    });
  }

  // --LOAD--

  async load() {
    return this.gltfRes.load();
  }

  onLoaded() {
    this.gltf = this.gltfRes.gltf;
  }

  // --START/STOP--

  start() {
    this.speedSuccess = new TheatreProgress(0, this.updateSpeedProgress, this.sheetSuccess, "Clouds / Speed");

    this.time = 0;
    this.stretch = 1;
    this.stretchOffset = 1;
    this.speedProgress = 0;
    this.stretchLastAdd = 0;

    this.root.y = 6;
    this.root.scale[0] = RIVER_WIDTH * 0.5;
    this.root.scale[2] = RIVER_LENGTH;

    this.setupClouds();

    this.root.invalidate();
    this.root.updateWorldMatrix();
  }

  stop() {
    this.speedSuccess.dispose();
  }

  // --CLOUDS SETUP--

  setupClouds() {
    this.cloudsList = [];

    // --CLOUD 1--

    const node1 = new Node();
    node1.y = 1;
    node1.scale[1] = this.root.scale[2] * 0.05;
    this.root.add(node1);

    this.cloudsList.push({
      node: node1,
      seed: Math.random(),
      alpha: 0.6,
      speed: 0.2
    });

    // --CLOUD 2--

    const node2 = new Node();
    node2.y = -1;
    node2.scale[1] = this.root.scale[2] * 0.025;
    this.root.add(node2);

    this.cloudsList.push({
      node: node2,
      seed: Math.random(),
      alpha: 1,
      speed: 0.4
    });
  }

  // --ANIM--

  updateSpeedProgress = (progress: number) => {
    this.speedProgress = progress;
  }

  // --RENDER--

  preRender() {
    this.time += Time.dt * 0.001 * SPEED * (1 + this.speedProgress);

    const stretch = 1 / (1 + this.speedProgress * 15);
    const stretchAdd = this.renderer.scene.blockHold || stretch > this.stretch
      ? lerp(this.stretchLastAdd, 0, 0.01)
      : stretch - this.stretch;
    this.stretchOffset += stretchAdd;

    this.stretch = stretch;
    this.stretchLastAdd = stretchAdd;
  }

  render(ctx: RenderContext): void {
    for (const cloud of this.cloudsList) {
      // update scroll chunk
      this.scrollChunk.timeUniform.set(this.time * cloud.speed);
      this.scrollChunk.scaleUniform.set(2);
      this.scrollChunk.offsetUniform.set(cloud.seed * 0.5);
      this.scrollChunk.stretchUniform.set(this.stretch);
      this.scrollChunk.stretchOffsetUniform.set(this.stretchOffset);

      // update fog chunk
      this.fogChunk.cameraYUniform.set(ctx.camera._wposition[1]);

      // updata alpha uniform
      this.alphaUniform.set(cloud.alpha);

      // render
      for (const renderable of this.gltf.renderables) {
        mat4.copy(renderable.node._wmatrix, cloud.node._wmatrix);
        renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
      }
    }
  }
}
