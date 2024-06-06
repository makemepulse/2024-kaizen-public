import { GLContext } from "nanogl/types";
import Camera from "nanogl-camera";
import GLConfig from "nanogl-state/GLConfig";
import RenderMask from "./RenderMask";
import RenderPass from "./RenderPass";
import Viewport from "./Viewport";


// export default interface IRenderer {
//   readonly gl : GLContext
//   readonly camera : Camera
//   readonly width : number
//   readonly height : number
  
// }


export interface RenderContext {
  readonly gl       : GLContext
  readonly viewport : Viewport
  readonly camera   : Camera
  readonly mask     : RenderMask
  readonly pass     : RenderPass
  readonly glConfig?: GLConfig
}


export class MainRenderContext implements RenderContext {

  public get gl(): GLContext {
    return this._gl;
  }

  public get viewport(): Viewport {
    return this._viewport;
  }

  public get camera(): Camera {
    return this._camera;
  }

  public get mask(): RenderMask {
    return this._mask;
  }

  public get pass(): RenderPass {
    return this._pass;
  }

  public get glConfig(): GLConfig {
    return this._glConfig;
  }
  

  constructor(
    private _gl: GLContext, 
    private _viewport: Viewport, 
    private _camera: Camera = null, 
    private _mask: RenderMask = 0x1FFFFFFF, 
    private _pass: RenderPass = RenderPass.COLOR, 
    private _glConfig?: GLConfig) {}


  withMask(mask: RenderMask): this {
    this._mask = mask;
    return this
  }

  withPass(pass: RenderPass): this {
    this._pass = pass;
    return this
  }

  withConfig(glConfig: GLConfig): this {
    this._glConfig = glConfig;
    return this
  }

  withCamera(camera: Camera): this {
    this._camera = camera;
    return this
  }

  withViewport(viewport: Viewport): this {
    this._viewport = viewport;
    return this
  }
  
}

