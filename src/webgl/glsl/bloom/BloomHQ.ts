import BaseEffect from "nanogl-post/effects/base-effect";
import Fbo from "nanogl/fbo";
import PixelFormats, { FormatDesc } from 'nanogl-pf'
import Program from "nanogl/program";
import { isWebgl2 } from "nanogl/types";



import glsl_compositing_pre from './compositing_pre.frag'
import glsl_compositing from './compositing.frag'

import glsl_blurH from './blurH.frag'
import glsl_blurV from './blurV.frag'
import glsl_prefilter from './prefilter.frag'
import glsl_upsample from './upsample.frag'
import glsl_vert from './vert.glsl'



const MAX_MIP = 12
export default class BloomHQ extends BaseEffect {

  color: Float32Array;

  private _bloomParams: Float32Array;

  private _downFbos: Fbo[] = []
  private _upFbos: Fbo[] = []

  private hdrFormat: FormatDesc;
  blurHPrg: Program;
  blurVPrg: Program;
  upsmplPrg: Program;
  prefilterPrg: Program;
  private _isInit: boolean;

  constructor() {
    super();
    this.color = new Float32Array([1, 1, 1])
    this._bloomParams = new Float32Array(4)
    this.scatter = .7;
    this.clamp = 100
    this.threshold = .9
  }

  set scatter(v: number) { this._bloomParams[0] = v }
  get scatter() { return this._bloomParams[0] }

  set clamp(v: number) { this._bloomParams[1] = v }
  get clamp() { return this._bloomParams[1] }

  set threshold(v: number) { this._bloomParams[2] = v; this._bloomParams[3] = v * .5 }
  get threshold() { return this._bloomParams[2] }

  _buildPrograms() {
    throw new Error("Method not implemented.");
  }


  init(): void {
    if (this._isInit) return;
    this._isInit = true;
    const gl = this.post.gl;
    const pf = PixelFormats.getInstance(gl);

    const configs = [
      // pf.A2B10G10R10,
      pf.RGB16F,
      pf.RGBA16F,
      pf.RGB32F,
      pf.RGBA32F,
      pf.RGB8
    ];

    this.hdrFormat = pf.getRenderableFormat(configs);


    const version = isWebgl2(gl) ? '300 es' : '100'
    const defs = `#version ${version}`;

    this.blurHPrg = new Program(gl);
    this.blurHPrg.compile(glsl_vert(), glsl_blurH(), defs)
    this.blurHPrg.use();

    this.blurVPrg = new Program(gl);
    this.blurVPrg.compile(glsl_vert(), glsl_blurV(), defs)
    this.blurVPrg.use();

    this.prefilterPrg = new Program(gl);
    this.prefilterPrg.compile(glsl_vert(), glsl_prefilter(), defs)
    this.prefilterPrg.use();

    this.upsmplPrg = new Program(gl);
    this.upsmplPrg.compile(glsl_vert(), glsl_upsample(), defs)
    this.upsmplPrg.use();
  }

  release(): void {

  }

  genCode(precode: string[], code: string[]) {
    precode.push(glsl_compositing_pre())
    code.push(glsl_compositing())
  }

  setupProgram(prg: Program): void {
    const c = this.color;

    prg.uBloomColor(
      c[0],
      c[1],
      c[2]
    );

    // prg.tBloom(this._downFbos[4].getColorTexture());
    prg.tBloom(this._upFbos[0].getColorTexture());
  }

  resize(w: number, h: number): void {

    this.releaseFbos();

    let tw = this.post.renderWidth >> 1
    let th = this.post.renderHeight >> 1

    const maxSize = Math.max(tw, th);
    const iterations = Math.floor(Math.log2(maxSize) - 1);
    const mipCount = Math.max(1, Math.min(MAX_MIP, iterations));


    this._downFbos[0] = this.createFbo(tw, th)
    this._upFbos[0] = this.createFbo(tw, th)

    for (let i = 1; i < mipCount; i++) {
      tw = Math.max(1, tw >> 1);
      th = Math.max(1, th >> 1);

      this._downFbos[i] = this.createFbo(tw, th)
      this._upFbos[i] = this.createFbo(tw, th)
    }


  }

  preRender(): void {

    const tw = this.post.renderWidth >> 1
    const th = this.post.renderHeight >> 1

    const maxSize = Math.max(tw, th);
    const iterations = Math.floor(Math.log2(maxSize) - 1);
    const mipCount = Math.max(1, Math.min(MAX_MIP, iterations));


    let lastDown = this._downFbos[0]


    this.prefilterPrg.use()
    this.prefilterPrg.tInput(this.post.mainColor)
    this.prefilterPrg.uParams(this._bloomParams)

    lastDown.bind()
    lastDown.defaultViewport();
    this.post.fillScreen(this.prefilterPrg);

    // const gl = this.post.gl
    // gl.clearColor(1, 1, 0, 1)
    // gl.clear( gl.COLOR_BUFFER_BIT)

    // return;
    for (let i = 1; i < mipCount; i++) {
      const mipDown: Fbo = this._downFbos[i]
      const mipUp: Fbo = this._upFbos[i]

      this.blurHPass(lastDown, mipUp);
      this.blurVPass(mipUp, mipDown);

      lastDown = mipDown
    }
    // return;

    this.upsmplPrg.use();
    this.upsmplPrg.uParams(this._bloomParams)
    for (let i = mipCount - 2; i >= 0; i--) {
      const lowMip = (i == mipCount - 2) ? this._downFbos[i + 1] : this._upFbos[i + 1];
      const highMip = this._downFbos[i];
      const dest = this._upFbos[i];

      dest.bind();
      dest.defaultViewport();

      this.upsmplPrg.tInput(highMip.getColorTexture())
      this.upsmplPrg.tInputLowMip(lowMip.getColorTexture())
      this.upsmplPrg.uParams(this._bloomParams)

      this.post.fillScreen(this.upsmplPrg);
    }
  }


  blurHPass(src: Fbo, dest: Fbo) {
    const prg = this.blurHPrg;

    dest.bind();
    dest.defaultViewport();

    prg.use();
    prg.tInput(src.getColorTexture());
    prg.uTexelSize(1 / src.width, 1 / src.height);

    this.post.fillScreen(prg);
  }

  blurVPass(src: Fbo, dest: Fbo) {
    const prg = this.blurVPrg;

    dest.bind();
    dest.defaultViewport();

    prg.use();
    prg.tInput(src.getColorTexture());
    prg.uTexelSize(1 / src.width, 1 / src.height);

    this.post.fillScreen(prg);
  }

  createFbo(tw: number, th: number): Fbo {
    const fbo = new Fbo(this.post.gl)

    fbo.attachColor(this.hdrFormat.format, this.hdrFormat.type, this.hdrFormat.internal);
    fbo.resize(tw, th);

    const color = fbo.getColorTexture()
    color.bind()
    color.setFilter(true, false, false);
    color.clamp();

    return fbo;
  }



  releaseFbos() {
    for (const fbo of this._downFbos) {
      fbo.dispose();
    }
    for (const fbo of this._upFbos) {
      fbo.dispose();
    }
    this._downFbos.length = 0;
    this._upFbos.length = 0;

  }
}