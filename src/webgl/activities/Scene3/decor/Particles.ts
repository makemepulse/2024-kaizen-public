import Bounds from "nanogl-pbr/Bounds";
import Program from "nanogl/program";
import Texture2D from "nanogl/texture-2d";
import GLArrayBuffer from "nanogl/arraybuffer";
import GLState, { LocalConfig } from "nanogl-state/GLState";
import { vec3 } from "gl-matrix";
import { ISheet } from "@theatre/core";

import Time from "@webgl/Time";
import Scene3 from "@webgl/activities/Scene3/Scene3";
import Renderer from "@webgl/Renderer";
import Programs from "@webgl/glsl/programs";
import TheatreProgress from "@webgl/theatre/TheatreProgress";
import { RenderContext } from "@webgl/core/Renderer";
import { FOG_STEP, RIVER_LENGTH } from "@webgl/activities/Scene3/constants";

type ParticleData = {
  z: number;
  group: number;
}

const FLOAT_PER_PARTICLE = 8;
const MAX_DIST_Z = RIVER_LENGTH * 0.5;
const MIN_DIST_Z = MAX_DIST_Z - FOG_STEP;
const MIN_DIST_X = 1;

export default class Particles {
  canRender = false;

  prg: Program;
  cfg: LocalConfig;

  varray: Float32Array;
  vbuffer: GLArrayBuffer;
  groupCount: [number, number] = [0, 0];
  availableIdx: number[] = [];
  particlesData: ParticleData[] = [];

  time = 0;
  bounds: Bounds;
  maxDistX = 1;
  boundsSize = vec3.create();
  worldScroll = 0;

  scale: [number, number] = [0, 0];
  scaleSuccess: TheatreProgress[];

  constructor(
    private renderer: Renderer, private count: number, private color: vec3,
    private sheetSuccess: ISheet, private noiseTex: Texture2D
  ) {
    this.prg = Programs(renderer.gl).get("river-particles");

    this.cfg = GLState.get(renderer.gl).config();
    this.cfg
      .enableDepthTest(true)
      .depthMask(false)
      .enableBlend(true)
      .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE);

    /// #if DEBUG
    const f = Scene3.guiFolder.folder("Energy Particles");
    f.addColor(this, "color");
    /// #endif
  }

  // --START/STOP--

  start() {
    this.vbuffer = new GLArrayBuffer(this.renderer.gl);
    this.vbuffer
      .attrib("aPosScale", 4, this.renderer.gl.FLOAT)
      .attrib("aSettings", 4, this.renderer.gl.FLOAT);

    this.scaleSuccess = [];
    for (let i = 0; i < this.scale.length; i++) {
      const name = `Particles / Size / Group ${i}`;
      this.scaleSuccess[i] = new TheatreProgress(0, (val) => this.updateScale(val, i), this.sheetSuccess, name);
    }

    this.time = 0;
    this.worldScroll = 0;
    this.bounds = new Bounds();

    this.varray = new Float32Array(this.count * FLOAT_PER_PARTICLE);
    this.vbuffer.data(this.varray);
    this.scale = [0, 0];
    this.groupCount = [0, 0];
    this.availableIdx = Array.from({ length: this.count }, (_, i) => i);
    this.particlesData = [];
  }

  stop(): void {
    this.vbuffer.dispose();
    for (const scaleSuccess of this.scaleSuccess) {
      scaleSuccess.dispose();
    }
  }

  // --UPDATE BOUNDS--

  updateBounds(min: number[], max: number[]) {
    this.bounds.fromMinMax(min, max);

    this.boundsSize[0] = this.bounds.max[0] - this.bounds.min[0];
    this.boundsSize[1] = this.bounds.max[1] - this.bounds.min[1];
    this.boundsSize[2] = this.bounds.max[2] - this.bounds.min[2];

    this.maxDistX = this.boundsSize[0] * 0.5;
  }

  // --ADD/REMOVE PARTICLES--

  addParticles() {
    for (let i = 0; i < this.availableIdx.length; i++) {
      const idx = this.availableIdx[i];
      const data = [];
      const savedData = { z: 0, group: 0 };

      // X, startY (= age at birth), Z
      data[0] = this.bounds.min[0] + Math.random() * this.boundsSize[0];
      data[1] = this.bounds.min[1] + Math.random() * this.boundsSize[1];
      data[2] = -this.worldScroll + this.bounds.min[2] + Math.random() * this.boundsSize[2];
      savedData.z = data[2];

      // Scale
      data[3] = Math.random() * .66 + .33;
      // Group
      const group = this.groupCount[0] < this.count * 0.5 ? 0 : 1;
      data[4] = group;
      savedData.group = group;
      this.groupCount[group]++;
      // Opacity, MaxLife, Speed
      data[5] = Math.random() * .5 + .1;
      data[6] = Math.random() * 5 + 6;
      data[7] = Math.random() * 1.5 + .2;

      this.varray.set(data, idx * FLOAT_PER_PARTICLE);
      this.particlesData[idx] = savedData;
    }

    this.vbuffer.data(this.varray);
    this.availableIdx = [];
  }

  removeParticle(idx: number) {
    const data = this.particlesData[idx];
    this.availableIdx.push(idx);
    this.groupCount[data.group]--;
  }

  // --SCROLL--

  scroll(z: number) {
    this.worldScroll = z;
  }

  // --ANIM--

  updateScale = (progress: number, index: number) => {
    this.scale[index] = progress;
  }

  // --PRE-RENDER--

  preRender(speedProgress: number) {
    this.time += Time.dt * 0.001 * (1 + speedProgress);
    this.canRender = this.scale[0] + this.scale[1] > 0;
  }

  // --RENDER--

  render(ctx: RenderContext): void {
    if (!this.canRender) return;

    this.prg.use();

    this.prg.uProjection(ctx.camera.lens.getProjection());
    this.prg.uView(ctx.camera._view);
    this.prg.uColor(this.color);
    this.prg.uTime(this.time);
    this.prg.uScale(this.scale);
    this.prg.uNoise(this.noiseTex);
    this.prg.uOffset(this.worldScroll);
    this.prg.uMaxSize(8);
    this.prg.uMinDistZ(MIN_DIST_Z);
    this.prg.uMaxDistZ(MAX_DIST_Z);
    this.prg.uMinDistX(MIN_DIST_X);
    this.prg.uMaxDistX(this.maxDistX);

    this.cfg.apply();

    this.vbuffer.attribPointer(this.prg);
    this.vbuffer.drawPoints();
  }
}