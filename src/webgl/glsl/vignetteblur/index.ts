import Program from 'nanogl/program'
import Fbo from 'nanogl/fbo'
import PixelFormats from 'nanogl-pf'

import prcFrag from './blur.frag'
import prcVert from '../main.vert'
import fragPreCode from './vignette_blur_pre.frag'
import fragCode from './vignette_blur.frag'
import BaseEffect from 'nanogl-post/effects/base-effect'
import { MsaaFbo } from '@webgl/core/MsaaFbo'

const TEX_SIZE = 128

class VignetteBlur extends BaseEffect {
  public enabled = true

  blurTargets: Array<Fbo>
  size: number
  blurSamples: number
  vignetteSize: number
  vignetteStart: number
  effectStrength: number
  blurKernel: Float32Array
  prcPrg: Program
  _fragPreCode: string
  _fragCode: string
  constructor(blurSize: number, vignetteStart: number, vignetteSize: number) {
    super()
    this.effectStrength = 0
    this.size = blurSize
    this.vignetteSize = vignetteSize
    this.vignetteStart = vignetteStart
    this.blurTargets = []
    this.blurSamples = 0
    this.blurKernel = null
    this.prcPrg = null
    this._fragPreCode = fragPreCode()
    this._fragCode = fragCode()
  }

  init() {
    const gl = this.post.gl
    const maxFuniforms = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS)
    const pf = PixelFormats.getInstance(gl)
    const configs = [pf.RGB16F, pf.RGBA16F, pf.RGB32F, pf.RGBA32F, pf.RGB8]
    const cfg = pf.getRenderableFormat(configs)

    for (let i = 0; i < 2; ++i) {
      this.blurTargets[i] = new Fbo(gl)
      this.blurTargets[i].bind()
      this.blurTargets[i].attachColor(cfg.format, cfg.type, cfg.internal)
      this.blurTargets[i].resize(TEX_SIZE, TEX_SIZE)
      const color = this.blurTargets[i].getColor(0);
      (color as any).setFilter(true, false, false);
      (color as any).clamp();
    }

    for (this.blurSamples = 16; this.blurSamples + 16 >= maxFuniforms;) {
      this.blurSamples /= 2
    }

    this.blurKernel = new Float32Array(this.blurSamples * 4)
    let defs = '\n'
    defs += 'precision highp float;\n'
    defs += `#define BLUR_SAMPLES ${this.blurSamples} \n`
    this.prcPrg = new Program(gl)
    this.prcPrg.compile(
      prcVert({
        precode: '',
        code: '',
      }),
      prcFrag(),
      defs
    )
  }

  resize() { }

  release() {
    if (this.prcPrg !== null) this.prcPrg.dispose()
    this.prcPrg = null

    for (let i = 0; i < 2; ++i) {
      this.blurTargets[i].dispose()
    }
    this.blurTargets = []
  }

  genCode(precode: string[], code: string[]): void {
    precode.push(this._fragPreCode)
    code.push(this._fragCode)
  }

  preRender() {
    if (!this.enabled) return;
    const prg = this.prcPrg
    const post = this.post

    this.computeKernel()

    this.blurTargets[0].bind()
    this.blurTargets[0].defaultViewport()
    this.blurTargets[0].clear()
    prg.use()
    prg.tInput(post.mainColor)
    prg.uKernel(this.blurKernel)
    post.fillScreen(prg)

    this.transposeKernel()

    this.blurTargets[1].bind()
    this.blurTargets[1].defaultViewport()
    this.blurTargets[1].clear()
    prg.tInput(this.blurTargets[0].getColor(0))
    prg.uKernel(this.blurKernel)
    post.fillScreen(prg)
  }

  setupProgram(prg: Program) {
    if (!this.enabled) return;
    prg.tBlur(this.blurTargets[1].getColor(0))
    prg.uStrength(this.vignetteSize)
    prg.uEffect(this.effectStrength)
    prg.uStart(this.vignetteStart)
    prg.uRatio(this.post.renderWidth / this.post.renderHeight)
  }

  computeKernel() {
    const kernel = this.blurKernel
    const SQRT_PI = Math.sqrt(Math.PI)

    let c = 0

    for (let sample = 0; sample < this.blurSamples; ++sample) {
      const i = sample * 4
      const delta = (2 * sample) / (this.blurSamples - 1) - 1
      let density = 4.0 * delta
      density = Math.exp((-density * density) / 2.0) / SQRT_PI
      c += density
      kernel[i + 0] = delta * this.size
      kernel[i + 1] = 0
      kernel[i + 2] = density
      kernel[i + 3] = 0
    }

    for (let sample = 0; sample < this.blurSamples; ++sample) {
      kernel[4 * sample + 2] /= c
    }
  }

  transposeKernel() {
    const kernel = this.blurKernel
    const ratio = this.post.renderWidth / this.post.renderHeight
    for (let sample = 0; sample < this.blurSamples; ++sample) {
      const i = sample << 2
      kernel[i + 1] = kernel[i] * ratio
      kernel[i] = 0
    }
  }
}

export default VignetteBlur
