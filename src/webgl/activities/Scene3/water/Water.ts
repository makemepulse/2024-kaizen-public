import Node from "nanogl-node";
import Rect from "nanogl-primitives-2d/rect";
import Program from "nanogl/program";
import Texture2D from "nanogl/texture-2d";
import GLState, { LocalConfig } from "nanogl-state/GLState";
import { ISheet } from "@theatre/core";
import { Uniform } from "nanogl-pbr/Input";
import { vec2, vec4 } from "gl-matrix";

import gui from "@webgl/dev/gui";
import Fog from "@webgl/activities/Scene3/chunks/fog/Fog";
import lerp from "@/utils/Lerp";
import Time from "@webgl/Time";
import Programs from "@webgl/glsl/programs";
import Renderer from "@webgl/Renderer";
import RenderMask from "@webgl/core/RenderMask";
import PaintManager from "@webgl/activities/Scene3/water/PaintManager";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import TheatreProgress from "@webgl/theatre/TheatreProgress";
import { ElemData } from "@webgl/activities/Scene3/ElemPoolManager";
import { RenderContext } from "@webgl/core/Renderer";
import { RIVER_WIDTH, RIVER_LENGTH, RIVER_RATIO, HEATMAP_ZONE_SIZE, FOG_STEP } from "@webgl/activities/Scene3/constants";

const HEATMAP_SCALE = [1 / RIVER_WIDTH, -1 / HEATMAP_ZONE_SIZE];
const MAX_DIST = RIVER_LENGTH * 0.5;
const MIN_DIST = MAX_DIST - FOG_STEP;

export default class Water {
  time = 0;
  speedProgress = 0;
  relativeScroll = 0;

  quad: Rect;
  root: Node;
  glconfig: LocalConfig;

  waterNode: Node;
  waterEffectsPrg: Program;

  paintManager: PaintManager;

  heatmapTex: Texture2D;
  heatmapCvs: HTMLCanvasElement;

  rippleTime = 0;
  rippleSeed = vec2.fromValues(Math.random(), Math.random());
  rippleSize = vec2.fromValues(0, 0);
  ripplePosition = vec4.fromValues(0.5, 0.5, 0.5, 0.5);
  rippleStartSizeTarget = 0;
  rippleStartSizeFactor = 0;

  rippleSizeSuccess: TheatreProgress;
  endRippleSizePerfect: TheatreProgress;

  floorReflectivity = 0.07
  floorReflectivityUniform: Uniform;

  constructor(
    private renderer: Renderer, riverRoot: Node, private sheetSuccess: ISheet,
    private sheetPerfect: ISheet, ambientChunk: AmbientAddChunk, fogChunk: Fog,
    private noiseTex: Texture2D
  ) {
    this.floorReflectivityUniform = new Uniform("fru", 1);
    this.floorReflectivityUniform.set(this.floorReflectivity);
    /// #if DEBUG
    gui.folder("Reflect").range(this, 'floorReflectivity', 0, 1).onChange(() => {
      if (this.floorReflectivityUniform) {
        this.floorReflectivityUniform.set(this.floorReflectivity);
      }
    });
    /// #endif

    this.root = new Node();
    this.waterNode = new Node();
    this.root.add(this.waterNode);

    this.heatmapTex = new Texture2D(renderer.gl, renderer.gl.RGBA);

    this.paintManager = new PaintManager(renderer, riverRoot, ambientChunk, fogChunk, this.noiseTex, this.floorReflectivityUniform);

    this.waterEffectsPrg = Programs(renderer.gl).get("river");

    this.glconfig = GLState.get(renderer.gl).config()
      .enableBlend(true)
      .enableDepthTest(true)
      .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA);
  }

  // --LOAD--

  async load() {
    return Promise.all([
      this.paintManager.load(),
    ]);
  }

  onLoaded() {
    this.paintManager.onLoaded();
  }

  // --START/STOP--

  start() {
    this.quad = new Rect(this.renderer.gl, -0.5, -0.5, 1, 1);

    this.rippleSizeSuccess = new TheatreProgress(0, (val) => this.updateRippleStartSize(val), this.sheetSuccess, "Ripples / Start Ripple Size");
    this.endRippleSizePerfect = new TheatreProgress(0, (val) => this.updateRippleEndSize(val), this.sheetPerfect, "Ripples / End Ripple Size");

    this.time = 0;
    this.speedProgress = 0;
    this.relativeScroll = 0;

    this.waterNode.z = -0.02;
    this.waterNode.scale[0] = RIVER_WIDTH;
    this.waterNode.scale[1] = RIVER_LENGTH;
    this.waterNode.invalidate();

    this.root.rotation.set([0, 0, 0, 1]);
    this.root.rotateX(-Math.PI / 2);
    this.root.invalidate();
    this.root.updateWorldMatrix();

    this.paintManager.start();
  }

  stop() {
    this.quad.dispose();
    this.rippleSizeSuccess.dispose();
    this.endRippleSizePerfect.dispose();
  }

  // --SCROLL--

  scroll(z: number) {
    this.relativeScroll = z / this.waterNode.scale[1];
    this.paintManager.scroll(z);
  }

  // --RIPPLES--

  prepareStartRock(rock: ElemData) {
    this.prepareRipple(rock);
    this.rippleSize[1] = 0;
    this.rippleStartSizeFactor = 1;
  }

  prepareJump(rock: ElemData) {
    this.prepareRipple(rock, true);
    this.rippleStartSizeFactor = 0;
  }

  prepareRipple(rock: ElemData, isNext = false) {
    const i = isNext ? 1 : 0;
    this.rippleSeed[i] = isNext ? Math.random() : this.rippleSeed[1];
    this.rippleSize[i] = isNext ? 0 : this.rippleSize[1];
    this.ripplePosition[i * 2] = rock.node.x / (RIVER_WIDTH * 0.5) * 0.5 + 0.5;
    this.ripplePosition[i * 2 + 1] = -rock.node.z / (this.waterNode.scale[1] * 0.5) * 0.5 + 0.5;
  }

  updateRippleEndSize = (progress: number) => {
    this.rippleSize[1] = progress;
  }

  updateRippleStartSize = (progress: number) => {
    this.rippleStartSizeTarget = progress;
  }

  // --RENDER--

  preRender(speedProgress: number, isJumping: boolean) {
    this.speedProgress = speedProgress;

    const dt = Time.dt * 0.001;
    this.time += dt * (1 + speedProgress);
    this.rippleTime += dt * 0.5;

    this.rippleSize[0] = lerp(this.rippleSize[0], this.rippleStartSizeTarget * this.rippleStartSizeFactor, isJumping ? 0.02 : 0.05);

    this.paintManager.preRender(speedProgress);
  }

  renderWaterEffects(ctx: RenderContext) {
    if (this.heatmapCvs) this.heatmapTex.fromImage(this.heatmapCvs);

    this.quad.attribPointer(this.waterEffectsPrg);

    this.waterEffectsPrg.use();
    this.waterEffectsPrg.uTime(this.time);
    this.waterEffectsPrg.uAlpha(1);
    this.waterEffectsPrg.tNoise(this.noiseTex);
    this.waterEffectsPrg.uScroll(this.relativeScroll);
    this.waterEffectsPrg.tHeatmap(this.heatmapTex);
    this.waterEffectsPrg.uMinDist(MIN_DIST);
    this.waterEffectsPrg.uMaxDist(MAX_DIST);
    this.waterEffectsPrg.uQuadRatio(RIVER_RATIO);
    this.waterEffectsPrg.uSpeedProgress(this.speedProgress);
    this.waterEffectsPrg.uRippleSeed(this.rippleSeed);
    this.waterEffectsPrg.uHeatmapScale(HEATMAP_SCALE);
    this.waterEffectsPrg.uRippleTime(this.rippleTime);
    this.waterEffectsPrg.uRippleSize(this.rippleSize);
    this.waterEffectsPrg.uRipplePosition(this.ripplePosition);
    this.waterEffectsPrg.uVP(ctx.camera._viewProj);
    this.waterEffectsPrg.uWorldMatrix(this.waterNode._wmatrix);

    this.quad.render();
  }

  render(ctx: RenderContext) {
    if (ctx.mask !== RenderMask.BLENDED) return;

    this.paintManager.render(ctx);
    this.glconfig.apply();
    this.renderWaterEffects(ctx);
  }
}