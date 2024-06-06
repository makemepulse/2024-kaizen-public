
import Program from 'nanogl/program';
import Fbo from 'nanogl/fbo';


import vShader from './shader.vert'
import fShader from './shader.frag'
import Scene from '@/webgl/GameScene';
import { GLContext } from 'nanogl/types';
import LocalConfig from 'nanogl-state/GLConfig'
import Texture2D from 'nanogl/texture-2d';
import GLState from 'nanogl-state/GLState';


export default class Blur {

  setSize(s: number) {
    this.size = s
    this.computeKernel(this.blurKernelA, true, 1 / this.size)
    this.computeKernel(this.blurKernelB, false, 1 / this.size)
    this.blurA_fbo.resize(this.size, this.size)
    this.blurB_fbo.resize(this.size, this.size)
  }


  private size: number;

  gl: GLContext;
  scene: Scene;
  blurSamples: number;
  spread: number;
  blurCfg: LocalConfig;
  blurPrg: Program;
  blurKernelA: Float32Array;
  blurKernelB: Float32Array;
  blurA_fbo: Fbo;
  blurB_fbo: Fbo;
  state: GLState


  constructor(scene: Scene, size: number) {

    const gl = scene.renderer.gl;
    this.gl = gl;
    this.scene = scene;
    this.state = new GLState(this.gl);

    this.blurSamples = 4;
    this.size = size
    this.spread = 1


    this.blurCfg = this.state.config()
      .enableCullface(false)
      .depthMask(false)
      .enableDepthTest(false)

    this.blurPrg = new Program(gl,
      vShader(),
      fShader(),
      '#define NUM_SAMPLES ' + this.blurSamples
    )




    // BLUR STUFF
    // ===========



    this.blurKernelA = new Float32Array(this.blurSamples * 3)
    this.blurKernelB = new Float32Array(this.blurSamples * 3)

    this.computeKernel(this.blurKernelA, true, 1 / this.size)
    this.computeKernel(this.blurKernelB, false, 1 / this.size)

    this.blurA_fbo = this.makeBlurFbo(true)
    this.blurB_fbo = this.makeBlurFbo()


  }








  process(inputTex: Texture2D) {

    const blurPrg = this.blurPrg,
      gl = this.gl;

    // BLUR PASSES
    // =======================

    gl.clearColor(1, 1, 1, 0)
    blurPrg.use()
    blurPrg.uSpread(this.spread)

    const quad = this.scene.quad;
    quad.attribPointer(blurPrg);

    // BLURRING PASS H / A
    // =======================

    this.blurA_fbo.bind();
    gl.clear(gl.COLOR_BUFFER_BIT);

    blurPrg.tInput(inputTex);
    blurPrg.uKernel(this.blurKernelA)

    this.state.push(this.blurCfg)
    quad.render()

    // BLURRING PASS V / B
    // =======================

    this.blurB_fbo.bind();
    gl.clear(gl.COLOR_BUFFER_BIT);

    blurPrg.tInput(this.blurA_fbo.getColor());
    blurPrg.uKernel(this.blurKernelB)

    quad.render()

    this.state.pop()
    this.state.apply()

  }



  clear() {
    this.blurB_fbo.bind();
    this.blurB_fbo.defaultViewport()
    this.gl.clearColor(0, 0, 0, 0)
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }


  getBlurredTex(): Texture2D {
    // if( this.lowquality ) 
    //   return inputTex
    return this.blurB_fbo.getColorTexture()
  }


  getBlurredFbo() {
    // if( this.lowquality ) 
    //   return inputTex
    return this.blurB_fbo
  }



  makeBlurFbo(alpha = false) {
    const gl = this.gl;

    const fbo = new Fbo(gl);
    fbo.bind();
    fbo.attachColor(alpha ? gl.RGBA : gl.RGB, gl.UNSIGNED_BYTE);
    // fbo.attachDepth( true, false, false );
    fbo.resize(this.size, this.size);


    const color = fbo.getColorTexture();
    color.bind()
    color.clamp()
    color.setFilter(true, false, false)

    return fbo;
  }


  computeKernel(kernel: Float32Array, horiz: boolean, dp: number) {

    const dda = horiz ? 0 : 1;
    const ddb = horiz ? 1 : 0;


    const SQRT_PI = Math.sqrt(Math.PI);
    let c = 0;
    for (let sample = 0; sample < this.blurSamples; ++sample) {
      const i = sample * 3;

      const delta = sample - Math.round((this.blurSamples - 1) / 2);
      let density = 4 * delta / this.blurSamples;

      // normal_dens
      density = Math.exp(- density * density / 2.0) / SQRT_PI;
      c += density;

      kernel[i + dda] = delta * dp;
      kernel[i + ddb] = 0;
      kernel[i + 2] = density;
    }

    for (let sample = 0; sample < this.blurSamples; ++sample) {
      kernel[3 * sample + 2] /= c;
    }

  }


}
