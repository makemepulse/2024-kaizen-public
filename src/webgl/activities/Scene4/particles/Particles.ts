import Bounds from "nanogl-pbr/Bounds";
import Program from "nanogl/program";
import Texture2D from "nanogl/texture-2d";
import GLArrayBuffer from "nanogl/arraybuffer";
import GLState, { LocalConfig } from "nanogl-state/GLState";
import { vec3 } from "gl-matrix";

import Time from "@webgl/Time";
import Renderer from "@webgl/Renderer";
import Programs from "@webgl/glsl/programs";
import { RenderContext } from "@webgl/core/Renderer";
import Node from "nanogl-node";


const FLOAT_PER_PARTICLE = 4;
const MIN_X = -100;
const MAX_X = 100;

export default class Particles {
  prg: Program;
  cfg: LocalConfig;

  varray: Float32Array;
  vbuffer: GLArrayBuffer;

  time = 0;
  bounds: Bounds;
  maxDistX = 1;
  boundsSize = vec3.create();
  worldScroll = 0;

  node: Node

  speedProgress = 1

  constructor(
    private renderer: Renderer, private count: number, private color: vec3
  ) {
    this.prg = Programs(renderer.gl).get("clouds-particles");

    this.vbuffer = new GLArrayBuffer(renderer.gl);
    this.vbuffer
      .attrib("aPosition", 3, renderer.gl.FLOAT)
      .attrib("aSettings", 1, renderer.gl.FLOAT);

    this.vbuffer.attribPointer(this.prg);

    this.cfg = GLState.get(renderer.gl).config();
    this.cfg
      .enableDepthTest(true)
      .depthMask(false)
      .enableBlend(true)
      .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE);

    this.node = new Node()
  }

  // --START/STOP--

  start() {

    this.time = 0;
    this.worldScroll = 0;
    this.bounds = new Bounds();

    this.varray = new Float32Array(this.count * FLOAT_PER_PARTICLE);
    this.vbuffer.data(this.varray);

    this.addParticles();
  }

  stop(): void {
    this.varray = new Float32Array(this.count * FLOAT_PER_PARTICLE);
    this.vbuffer.data(this.varray);
  }

  // --ADD/REMOVE PARTICLES--

  addParticles() {
    for (let i = 0; i < this.count; i++) {
      const data = [];

      // X, startY (= age at birth), Z
      data[0] = MIN_X + Math.random() * (MAX_X - MIN_X);
      data[1] = -20 + Math.random() * 40;
      data[2] = -20 + Math.random() * 40;
      // this.particlesZ[idx] = data[2];

      // Scale, Opacity, MaxLife, Speed
      data[3] = Math.random() * .66 + .33;

      this.varray.set(data, i * FLOAT_PER_PARTICLE);
    }

    this.vbuffer.data(this.varray);
  }

  // --PRE-RENDER--

  preRender(speedProgress: number) {
    this.speedProgress = speedProgress
    this.time += Time.dt * 0.02 * (1 + speedProgress);
    this.node.updateWorldMatrix()
  }

  // --RENDER--

  render(ctx: RenderContext): void {
    this.prg.use();

    this.prg.uVP(ctx.camera._viewProj);
    this.prg.uWorldMatrix(this.node._wmatrix);
    this.prg.uColor(this.color);
    this.prg.uTime(this.time);
    this.prg.uMaxSize(75 + this.speedProgress * 50);
    this.prg.uMinX(MIN_X);
    this.prg.uMaxX(MAX_X);

    this.cfg.apply();

    this.vbuffer.attribPointer(this.prg);
    this.vbuffer.drawPoints();
  }
}