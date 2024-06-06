import { ISheet } from "@theatre/core";
import Renderer from "@webgl/Renderer";
import Time from "@webgl/Time";
import { RenderContext } from "@webgl/core/Renderer";
import Programs from "@webgl/glsl/programs";
import { clamp } from "@webgl/math";
import { easeInQuad } from "@webgl/math/ease";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import { vec2 } from "gl-matrix";
import Node from "nanogl-node";
import GLState, { LocalConfig } from "nanogl-state/GLState";
import GLArrayBuffer from "nanogl/arraybuffer";
import Program from "nanogl/program";
import Texture2D from "nanogl/texture-2d";
import { t } from "xstate";

const FLOAT_PER_PARTICLE = 10;
const FLOAT_PER_SHOOTING = 6;

const V2 = vec2.create();


export default class Stars {

  prg: Program;
  shootingStarsPrg: Program;

  // Regular stars
  vbuffer: GLArrayBuffer;
  varray: Float32Array;

  // Shooting stars
  vbufferShooting: GLArrayBuffer;
  varrayShooting: Float32Array;

  cfg: LocalConfig;

  node: Node;
  shootingNode: Node;

  _noiseTex: Texture2D

  introSheet: ISheet;
  introTransitionSheet: ISheet;

  alpha = 0;
  globalAlpha = { value: 0 };
  globalAlphaFactor = { value: 1 };
  globalAlphaTheatre: TheatreFloat;
  globalAlphaFactorTheatre: TheatreFloat;

  shootingStarsStarted = false;

  constructor(private renderer: Renderer, private count: number, private shootingCount: number = 2) {
    

    this.node = new Node();
    this.shootingNode = new Node();
  }

  setupProgram() {
    const renderer = this.renderer;
    this.prg = Programs(renderer.gl).get("stars");
    this.shootingStarsPrg = Programs(renderer.gl).get("shooting-stars");

    this._noiseTex = this.renderer.scene.texturePool.get("perlinNoise").texture;

    this.vbuffer = new GLArrayBuffer(this.renderer.gl);
    this.vbufferShooting = new GLArrayBuffer(this.renderer.gl);

    this.vbuffer
      .attrib("aPosition", 3, renderer.gl.FLOAT)
      .attrib("aBaseAlpha", 1, renderer.gl.FLOAT)
      .attrib("aMovement", 4, renderer.gl.FLOAT) // timeOffset, dirX, dirY, speed
      .attrib("aSize", 1, renderer.gl.FLOAT)
      .attrib("aAlpha", 1, renderer.gl.FLOAT);
    this.vbuffer.attribPointer(this.prg);

    this.vbufferShooting = new GLArrayBuffer(this.renderer.gl);
    this.vbufferShooting
      .attrib("aPosition", 3, renderer.gl.FLOAT)
      .attrib("aRotation", 1, renderer.gl.FLOAT)
      .attrib("aParams", 2, renderer.gl.FLOAT); // progress, length
    this.vbufferShooting.attribPointer(this.shootingStarsPrg);

    this.cfg = GLState.get(renderer.gl).config();
    this.cfg
      .enableDepthTest(true)
      .depthMask(false)
      .enableBlend(true)
      .blendFuncSeparate(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA, renderer.gl.ONE, renderer.gl.ONE_MINUS_SRC_ALPHA)
  }

  start() {
    if(!this.prg) this.setupProgram();
    this.varray = new Float32Array(this.count * FLOAT_PER_PARTICLE);
    this.vbuffer.data(this.varray);

    this.varrayShooting = new Float32Array(this.shootingCount * FLOAT_PER_SHOOTING);
    this.vbufferShooting.data(this.varrayShooting);

    this.globalAlphaTheatre = new TheatreFloat(this.globalAlpha, this.introSheet, "starsAlpha");
    this.globalAlphaFactorTheatre = new TheatreFloat(this.globalAlphaFactor, this.introTransitionSheet, "starsAlpha");

    this.addParticles();
    this.addShootingStars();
  }

  stop(): void {
    this.varray = new Float32Array(this.count * FLOAT_PER_PARTICLE);
    this.vbuffer.data(this.varray);

    this.varrayShooting = new Float32Array(this.shootingCount * FLOAT_PER_SHOOTING);
    this.vbufferShooting.data(this.varrayShooting);

    this.globalAlphaTheatre.dispose();
    this.globalAlphaFactorTheatre.dispose();

    this.shootingStarsStarted = false;
  }

  // --ADD/REMOVE PARTICLES--

  getPos() {
    return [
      -2 + Math.random() * 4,
      1.05 - Math.random(),
      3
    ];
  }

  getShootingPos() {
    return [
      -1 + Math.random() * 2,
      1.05 - Math.random(),
      3
    ];
  }

  addParticles() {
    for (let i = 0; i < this.count; i++) {
      const data = [];
      const pos = this.getPos();
      V2.set([-1 + Math.random() * 0.7, 1 - Math.random() * 0.5]);
      vec2.normalize(V2, V2);

      // X, Y, Z
      data[0] = pos[0];
      data[1] = pos[1];
      data[2] = pos[2];

      // data[3] = Math.random() * .66 + .33; // base opacity
      data[3] = Math.random() * 0.66 + 0.33; // base opacity
      data[9] = 0; // current alpha

      data[4] = Math.random() * 10000; // time offset

      data[5] = V2[0]; // dir x
      data[6] = V2[1]; // dir y

      data[7] = 0.00025 + 0.0001 * Math.random(); // Movement speed

      data[8] = Math.random() * 40; // size

      this.varray.set(data, i * FLOAT_PER_PARTICLE);
    }

    this.vbuffer.data(this.varray);
  }

  addShootingStars(starToUpdate?: number) {
    const needsUpdate = starToUpdate !== undefined;
    for (let i = needsUpdate ? starToUpdate : 0; i < (needsUpdate ? starToUpdate + 1 :this.shootingCount); i++) {
      const data = [];
      const pos = this.getShootingPos();

      // x, y, z
      data[0] = pos[0];
      data[1] = pos[1];
      data[2] = pos[2];
      // rotation
      data[3] = Math.random() * (2 * Math.PI);
      // data[3] = 0;
      // progress
      data[4] = Math.random() * -5;
      // visible length
      data[5] = 0.25 + 0.1 * (Math.random() - 0.5) * 2;

      this.varrayShooting.set(data, i * FLOAT_PER_SHOOTING);
    }



    this.vbufferShooting.data(this.varrayShooting);
  }

  updateStars() {
    this.alpha = this.globalAlpha.value * this.globalAlphaFactor.value;

    for (let i = 0; i < this.count; i++) {
      const idx = i * FLOAT_PER_PARTICLE;

      // Reset when too far
      if((this.varray[idx] < -2) || (this.varray[idx + 1] > 1.2)) {
        const pos = this.getPos();
        // x, y , z
        this.varray[idx] = pos[0];
        this.varray[idx + 1] = pos[1];
        this.varray[idx + 2] = pos[2];
        this.varray[idx + 3] = Math.random() * 0.66 + 0.33; // opacity
        this.varray[idx + 9] = 0; // opacity
      }


      // const offset = this.varray[idx + 4];
      const offset = 0;
      const dir = [this.varray[idx + 5], this.varray[idx + 6]];
      // const time = Time.time + offset;
      const speed = this.varray[idx + 7];

      //Update position
      // this.varray[idx] += dir[0] * speed - Math.sin(this.varray[idx + 1] + offset) * 0.01;
      this.varray[idx] += dir[0] * speed;
      this.varray[idx + 1] += dir[1] * speed;

      let alpha = Math.min(this.varray[idx + 9] + 0.01, this.varray[idx + 3]); // stars fade in on reset
      if(this.alpha < 1) {
        const relativePos = Math.max(i / this.count, 0.001); //avoid division by 0
        const progressAlpha = clamp(easeInQuad(this.alpha) / relativePos, 0, 1);

        alpha = clamp(alpha * progressAlpha, 0, 1);
      }
      this.varray[idx + 9] = alpha; // Update opacity
    }

    this.vbuffer.data(this.varray);
  }

  updateShootingStars() {
    if(this.alpha < 0.25 && !this.shootingStarsStarted) return;
    this.shootingStarsStarted = true;

    for (let i = 0; i < this.shootingCount; i++) {
      const idx = i * FLOAT_PER_SHOOTING;
      const trailLength = this.varrayShooting[idx + 5];

      if(this.varrayShooting[idx + 4] > 1 + trailLength) {
        this.addShootingStars(i);
      }
      
      this.varrayShooting[idx + 4] += 0.005;
      // this.varrayShooting[idx + 4] = 0.5;

      
    }
    this.vbufferShooting.data(this.varrayShooting);
  }

  preRender() {
    this.node.updateWorldMatrix();
    this.shootingNode.updateWorldMatrix();
    this.updateStars();
    this.updateShootingStars();
  }

  renderStars(ctx: RenderContext) {
    this.prg.use();
    // this.cfg.apply();

    this.prg.uWorldMatrix(this.node._wmatrix);
    this.prg.uVP(ctx.camera._viewProj);
    this.prg.uNoise(this._noiseTex);
    this.prg.uTime(Time.time);
    this.prg.uGlobalAlpha(this.alpha);

    this.vbuffer.attribPointer(this.prg);
    this.vbuffer.drawPoints();
  }

  renderShootingStars(ctx: RenderContext) {
    this.shootingStarsPrg.use();
    this.shootingStarsPrg.uWorldMatrix(this.shootingNode._wmatrix);
    this.shootingStarsPrg.uVP(ctx.camera._viewProj);
    this.shootingStarsPrg.uGlobalAlpha(this.alpha);
    this.shootingStarsPrg.uNoise(this._noiseTex);
    this.shootingStarsPrg.uTime(Time.time);

    this.vbufferShooting.attribPointer(this.shootingStarsPrg);
    this.vbufferShooting.drawPoints();
  }

  render(ctx: RenderContext) {
    this.renderStars(ctx);
    this.renderShootingStars(ctx);
  }
}