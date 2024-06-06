


/// #if DEBUG
import gui from '@/webgl/dev/gui'
/// #endif

import Config from 'nanogl-state/GLConfig'
import Blur from '../glsl/blur'
import { mat4 } from 'gl-matrix'
import Scene from '@/webgl/GameScene';
import Plane from '@/webgl/math/Plane';
import Camera from 'nanogl-camera';
import { MsaaFbo } from "@/webgl/gl/MsaaFbo";
import GameScene from '@webgl/GameScene';
import PerspectiveLens from 'nanogl-camera/perspective-lens';
// import { Pane } from 'tweakpane';


const M4A = mat4.create();
const M4B = mat4.create();



const SUBSCALE = .5;

export default class Reflect {

  private size: number;

  viewprojCopy: mat4;
  scene: GameScene;
  plane: Plane;
  blur: Blur;
  globalCfg: Config;
  fbo: MsaaFbo;

  cameraDisto = -1;

  msaa = false;

  groundHeight = -0.13

  setQuality(size: number, aa: boolean) {
    if (size !== this.size) {
      this.size = size;
      this.blur.setSize(size);
      this.fbo.setSize(size, size)
    }

    if (aa !== this.msaa) {
      this.msaa = aa;
      if (this.fbo._useMsaa !== aa) {
        this.allocateFbo()
      }
    }
  }

  constructor(scene: GameScene, plane?: Plane) {


    this.viewprojCopy = mat4.create()
    this.scene = scene;
    this.plane = plane;

    this.size = 1024;
    this.blur = new Blur(scene, this.size * SUBSCALE)
    this.blur.spread = 14

    this.globalCfg = new Config()
    // .frontFace(scene.renderer.gl.CW)


    this.allocateFbo()

    /// #if DEBUG
    gui.folder("Reflect").range(this, 'groundHeight', -1, 1)
    gui.folder("Reflect").range(this, 'cameraDisto', -1.3, 1)
    gui.folder("Reflect").range(this.blur, 'spread', 0.1, 20)
    /// #endif

  }


  allocateFbo() {
    const gl = this.scene.renderer.gl;

    const fbo = new MsaaFbo(gl, this.msaa ? 16 : 0);
    fbo.setSize(this.size, this.size);

    const color = fbo.getColorTexture()
    color.bind()
    color.clamp()
    color.setFilter(true, false, false)

    this.fbo = fbo;

  }


  blitRenderBuffer() {
    this.fbo.blitMsaa();
  }


  bindAndClear() {
    const gl = this.scene.renderer.gl;
    // console.log(  this.scene.renderer.width, this.scene.renderer.height );
    // this.fbo.resize( nextPOT(w), nextPOT(h) );
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo.renderFbo.fbo);
    //this.fbo.renderFbo.bind();
    gl.viewport(0, 0, this.size, this.size);
    gl.clearColor(1, 1, 1, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  }


  processOutput() {
    this.scene.renderer.gl.viewport(0, 0, this.size * SUBSCALE, this.size * SUBSCALE);
    this.blur.process(this.fbo.getColorTexture())
  }

  getRawOutput() {
    return this.fbo.getColorTexture();
  }

  getOutput() {
    return this.blur.getBlurredTex()
    // return this.fbo.getColorTexture();
  }

  getOutputFbo() {
    return this.blur.getBlurredFbo()
  }


  clear() {
    this.blur.clear()
  }


  processCamera(cam: Camera) {

    // const vp = getViewport(cam, this.scene)

    // const sw = this.size / this.scene.glview.width
    // const sh = this.size / this.scene.glview.height

    // const relativeVP = {
    //   x: vp.x*sw,
    //   y: vp.x*sh,
    //   width: vp.width*sw,
    //   height: vp.height*sh,

    this.scene.renderer.gl.viewport(0, 0, this.size, this.size);

    this.viewprojCopy.set(cam._viewProj);

    mat4.identity(M4A)
    M4A[5] = this.cameraDisto
    M4A[13] = 2 * this.groundHeight

    mat4.multiply(M4B, M4A, cam._wmatrix);
    mat4.invert(M4B, M4B);

    mat4.multiply(cam._viewProj, cam.lens.getProjection(), M4B);

  }

  restoreCamera(cam: Camera) {
    cam._viewProj.set(this.viewprojCopy);
  }

}

