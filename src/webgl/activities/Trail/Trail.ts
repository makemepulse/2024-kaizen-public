import Renderer from "@webgl/Renderer";
import { RenderContext } from "@webgl/core/Renderer";
import { default as BaseMaterial } from "nanogl-pbr/Material";
import UnlitPass from "nanogl-pbr/UnlitPass";
import MeshRenderer from "nanogl-gltf/lib/renderer/MeshRenderer";
import Node from "nanogl-node";
import GLState from "nanogl-state/GLState";
import Camera from "nanogl-camera";
import Program from "nanogl/program";
import Primitive from "nanogl-gltf/lib/elements/Primitive";
import { vec3 } from "gl-matrix";
import Gltf from "nanogl-gltf/lib/Gltf";
import TrailChunk from "@webgl/glsl/trail/TrailChunk";
import Texture from "nanogl/texture";
import Time from "@webgl/Time";
import RenderMask from "@webgl/core/RenderMask";

/// #if DEBUG
import gui from "@webgl/dev/gui";
/// #endif

const TRAIL_SIZE = 200;
const V3_A = vec3.create();

export type TrailOpts = {
  color?: [number, number, number],
  thickness?: number,
  trailDistance?: number,
  offset?: [number, number, number],
  drawImageFrameElapsed?: number
  speedThreshold?: number
  mixBorder?: number
}

export default class Trail {
  active = false

  private _followNode: Node;

  private _gltfMaterial: BaseMaterial;
  private _node: Node;

  private _trailChunk: TrailChunk;

  private _trailBuffer: number[] = [];
  private _trailPositions: number[] = [];
  private _trailPositionsCopy: number[] = [];

  private _countImages = 0;

  private _offset: vec3
  private _followSave: vec3 = vec3.create()
  private _followLerp: vec3 = vec3.create()

  private _bufferSize = 20;

  private _prg: Program

  _drawImageFrameElapsed = 12


  constructor(private _renderer: Renderer, private _mesh: MeshRenderer, private noiseTex: Texture, public index: number, private opts: TrailOpts = {}) {

    this._node = new Node();
    this._drawImageFrameElapsed = 5 + Math.round(Math.random() * 3);
    this._bufferSize = opts.trailDistance + Math.round(Math.random() * opts.trailDistance);
    this._gltfMaterial = new BaseMaterial(this._renderer.gl, "trailMat" + index);
    const pass = new UnlitPass("color");
    pass.alphaMode.set("BLEND");
    pass.mask = RenderMask.BLENDED;

    this._gltfMaterial.mask = RenderMask.BLENDED;
    pass.glconfig.enableBlend();
    pass.glconfig.blendFunc(this._renderer.gl.SRC_ALPHA, this._renderer.gl.ONE_MINUS_SRC_ALPHA);
    pass.glconfig.depthMask(false)
    pass.glconfig.enableDepthTest(false)
    pass.mask = Gltf.getRenderConfig().blendedMask;

    this._gltfMaterial.addPass(pass);

    this._trailChunk = new TrailChunk(this.noiseTex);
    const passInstance = this._gltfMaterial.getPass("color");
    passInstance.pass.inputs.add(this._trailChunk);
    this._prg = passInstance.getProgram();

  }

  get trailChunk() {
    return this._trailChunk;
  }

  async load(): Promise<any> { }

  setActive(followNode: Node, opts: TrailOpts = {}) {
    const dftOpts: TrailOpts = {
      color: [1, 1, 1],
      thickness: 0.02,
      trailDistance: 20,
      offset: [0.07, 0.07, 0.07],
      drawImageFrameElapsed: 12,
      speedThreshold: 0.03,
      mixBorder: 1
    };

    if (!opts.color) opts.color = dftOpts.color;
    if (!opts.thickness) opts.thickness = dftOpts.thickness;
    if (!opts.trailDistance && opts.trailDistance !== 0) opts.trailDistance = dftOpts.trailDistance;
    if (!opts.offset) opts.offset = dftOpts.offset;
    if (!opts.drawImageFrameElapsed) opts.drawImageFrameElapsed = dftOpts.drawImageFrameElapsed;
    if (!opts.speedThreshold) opts.speedThreshold = dftOpts.speedThreshold;
    if (!opts.mixBorder && opts.mixBorder !== 0) opts.mixBorder = dftOpts.mixBorder;

    this._drawImageFrameElapsed = opts.drawImageFrameElapsed === 1 ? 1 : opts.drawImageFrameElapsed + Math.round(Math.random() * 3);

    this.opts = opts;

    this._bufferSize = opts.trailDistance + Math.round(Math.random() * opts.trailDistance);

    this._offset = vec3.create();
    vec3.set(this._offset,
      (Math.random() * 2 - 1) * this.opts.offset[0],
      (Math.random() * 2 - 1) * this.opts.offset[1],
      (Math.random() * 2 - 1) * this.opts.offset[2]);

    this._followNode = followNode;
    followNode.updateWorldMatrix();
    for (let i = 0; i < TRAIL_SIZE; i++) {
      this._trailPositions[i * 3 + 0] = followNode.position[0];
      this._trailPositions[i * 3 + 1] = followNode.position[1];
      this._trailPositions[i * 3 + 2] = followNode.position[2];
      if (i < this._bufferSize) {
        this._trailBuffer[i * 3 + 0] = followNode.position[0];
        this._trailBuffer[i * 3 + 1] = followNode.position[1];
        this._trailBuffer[i * 3 + 2] = followNode.position[2];
      }
    }
    this._trailPositionsCopy = [...this._trailPositions];

    vec3.copy(this._followSave, followNode.position);
    vec3.copy(this._followLerp, followNode.position);

    this._trailChunk.colorU.set(opts.color[0], opts.color[1], opts.color[2]);
    this._trailChunk.thicknessV = opts.thickness + Math.random() * opts.thickness;
    this._trailChunk.thicknessU.set(this._trailChunk.thicknessV);
    this._trailChunk.speedThresholdU.set(opts.speedThreshold);
    this._trailChunk.mixBorderU.set(opts.mixBorder);

    /// #if DEBUG
    const f = gui.folder("Trail");
    f.range(this, "_drawImageFrameElapsed", 0, 30).onChange(() => this._drawImageFrameElapsed = Math.round(this._drawImageFrameElapsed));
    f.range(this._trailChunk, "thicknessV", 0.1, 3, { label: "thickness" }).onChange(() => this._trailChunk.thicknessU.set(this._trailChunk.thicknessV));
    /// #endif

    this.active = true;
  }

  setInactive() {
    this.active = false;
    this._followNode = null;
    this._trailPositions = this._trailBuffer = this._trailPositionsCopy = [];
    const passInstance = this._gltfMaterial.getPass("color");
    passInstance.pass.inputs.remove(this._trailChunk);
  }

  syncWithObject() {
    if (!this._followNode || !this.active) return;
    this._followNode.updateWorldMatrix();

    const position = vec3.fromValues(this._followNode._wmatrix[12], this._followNode._wmatrix[13], this._followNode._wmatrix[14]);

    for (let i = 0; i < TRAIL_SIZE; i++) {
      this._trailPositions[i * 3 + 0] = position[0];
      this._trailPositions[i * 3 + 1] = position[1];
      this._trailPositions[i * 3 + 2] = position[2];
      if (i < this._bufferSize) {
        this._trailBuffer[i * 3 + 0] = position[0];
        this._trailBuffer[i * 3 + 1] = position[1];
        this._trailBuffer[i * 3 + 2] = position[2];
      }
    }
    vec3.copy(this._followSave, position);
    vec3.copy(this._followLerp, position);
    this._trailPositionsCopy = [...this._trailPositions];

  }

  preRender() {
    if (!this.active) return;

    vec3.set(this._followSave, this._followNode._wmatrix[12], this._followNode._wmatrix[13], this._followNode._wmatrix[14]);

    vec3.lerp(this._followLerp, this._followLerp, this._followSave, 0.2);

    // if (
    //   Math.abs(this._followSave[0] - this._followNode.position[0]) > 0.0001 ||
    //   Math.abs(this._followSave[1] - this._followNode.position[1]) > 0.0001 ||
    //   Math.abs(this._followSave[2] - this._followNode.position[2]) > 0.0001) {

    this._trailBuffer.pop();
    this._trailBuffer.pop();
    this._trailBuffer.pop();

    this._trailBuffer.unshift(this._followLerp[2] + this._offset[0] + Math.cos(Time.scaledTime * 0.005) * 0.01);
    this._trailBuffer.unshift(this._followLerp[1] + this._offset[1] + Math.sin(Time.scaledTime * 0.005) * 0.01);
    this._trailBuffer.unshift(this._followLerp[0] + this._offset[2] + Math.sin(Time.scaledTime * 0.005) * 0.01);

    // }

    const dist = vec3.distance(this._followNode.position, V3_A);


    // vec3.copy(this._followSave, this._followNode.position);

    const z = this._trailPositions.pop();
    const y = this._trailPositions.pop();
    const x = this._trailPositions.pop();
    vec3.set(V3_A, x, y, z);

    this._trailPositions.unshift(this._trailBuffer[this._trailBuffer.length - 3 + 2]);
    this._trailPositions.unshift(this._trailBuffer[this._trailBuffer.length - 3 + 1]);
    this._trailPositions.unshift(this._trailBuffer[this._trailBuffer.length - 3 + 0]);

    if (this._drawImageFrameElapsed <= 1 || this._countImages % this._drawImageFrameElapsed === 0) {
      this._trailChunk.speedU.set(dist);
      this._trailChunk.timeV += Time.scaledDt * 0.002;
      this._trailChunk.timeU.set(this._trailChunk.timeV);
      this._trailPositionsCopy = [...this._trailPositions];
    }
    this._countImages++;

  }

  render(ctx: RenderContext) {
    if (!this.active) return;
    const gl = this._renderer.gl;
    const primitives = this._mesh.mesh.primitives;
    const glstate = GLState.get(gl);

    for (let i = 0; i < primitives.length; i++) {

      const primitive = primitives[i];

      const mat = this._gltfMaterial;
      if (!mat.hasPass(ctx.pass) || (mat.mask & ctx.mask) === 0 || ctx.mask === 1) continue;
      const passInstance = mat.getPass(ctx.pass);

      if ((passInstance.pass.mask & ctx.mask) === 0) continue;

      passInstance.prepare(this._node, ctx.camera);

      glstate.push(passInstance.pass.glconfig);
      mat.glconfig && glstate.push(mat.glconfig);
      ctx.glConfig && glstate.push(ctx.glConfig);

      glstate.apply();

      // render
      // ----------
      this.drawCall(ctx.camera, passInstance.getProgram(), primitive);

      glstate.pop();
      mat.glconfig && glstate.pop();
      ctx.glConfig && glstate.pop();
    }
  }

  drawCall(camera: Camera, prg: Program, sub: Primitive) {
    if (prg.trailPosition) prg.trailPosition(this._trailPositionsCopy);

    if (prg.uViewMatrix) prg.uViewMatrix(this._renderer.camera.lens.getProjection());
    sub.bindVao(prg);
    sub.render();
    sub.unbindVao();

  }
}