import Time from "./Time";
import GLView from "./GLView";
import { vec4 } from "gl-matrix";
import Camera from "nanogl-camera";
import Reflect from "./gl/Reflect";
import GameScene from "./GameScene";
import Viewport from "./core/Viewport";
import Pointers from "./core/Pointers";
import Cameras from "./cameras/Cameras";
import { GLContext } from "nanogl/types";
import { IScene } from "./engine/IScene";
import RenderMask from "./core/RenderMask";
import GLState from "nanogl-state/GLState";
import RenderPass from "./core/RenderPass";
import ScreenSize from "./glsl/ScreenSize";
/// #if DEBUG
import { fpsCtrl } from "./dev/gui/tweakpane";
/// #endif
import Capabilities from "./core/Capabilities";
import PostProcess from "./engine/Postprocess";
import { ColorGui } from "./dev/gui/decorators";
import DebugDraw from "./dev/debugDraw/DebugDraw";
import ReflectDistPass from "./glsl/reflect_dist";
import { MainRenderContext } from "./core/Renderer";

export default class Renderer {
  /**
   * the HTMLElemment used to listen user inputs
   */
  ilayer: HTMLElement;

  /**
   * cameras manager
   */
  cameras: Cameras;

  pointers: Pointers;

  @ColorGui({ folder: "General" })
  clearColor = vec4.fromValues(0, 0.25, 0.4, 1);

  postprocess: PostProcess;

  isReflect = false;
  reflect: Reflect
  reflectDistPass: ReflectDistPass;

  /**
   * main backbuffer viewport
   */
  readonly viewport = new Viewport();

  readonly context: MainRenderContext;
  scene: GameScene;

  constructor(readonly glview: GLView) {
    glview.onRender.on(this._onViewRender);

    this.ilayer = glview.canvas;

    DebugDraw.init(glview.gl);

    this.context = new MainRenderContext(this.gl, this.viewport);
    this.pointers = new Pointers(this.ilayer);
    this.cameras = new Cameras(this);

    this.scene = new GameScene(this);

    Capabilities(this.gl).report();
    
    // AssetDatabase.printAssets();
    // console.log(Program.debug);
  }

  createPostProcess() {

    this.postprocess = new PostProcess(this);
  }

  startReflect() {
    if (!this.reflect) {
      this.reflect = new Reflect(this.scene);
      this.reflectDistPass = new ReflectDistPass();
      this.reflectDistPass.mask = RenderMask.REFLECTED;
    }
  }

  get gl(): GLContext {
    return this.glview.gl;
  }

  get camera(): Camera {
    return this.cameras.camera;
  }

  get width(): number {
    return this.glview.width;
  }

  get height(): number {
    return this.glview.height;
  }

  private _onViewRender = (dt: number) => {
    dt;
    Time.enterFrame();
    /// #if DEBUG
    fpsCtrl.begin();
    /// #endif
    this.context.withCamera(this.camera);
    this.viewport.setSize(this.glview.width, this.glview.height);
    this.renderScene(this.scene);
    /// #if DEBUG
    DebugDraw.render(this.context);
    /// #endif
    this.pointers.endFrame();
    /// #if DEBUG
    fpsCtrl.end();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((GLState.get(this.gl).cfgStack as any)._ptr > 0) {
      throw new Error("glstate overflow");
    }
    /// #endif
  };

  private renderScene(scene: IScene) {
    if (!scene || !this.postprocess) return;
    const gl = this.gl;

    this.cameras.preRender();
    scene.preRender();

    this.camera.updateViewProjectionMatrix(
      this.viewport.width,
      this.viewport.height
    );

    scene.rttPass();
    // REFLECT
    // =======

    if (this.isReflect) {

      ScreenSize.setSize(this.glview.width, this.glview.height);

      const camera = this.camera;

      this.reflect.bindAndClear();

      this.reflect.processCamera(camera);
      GLState.get(gl).now(this.reflect.globalCfg);

      scene.render(this.context.withMask(RenderMask.REFLECTED).withPass(RenderPass.REFLECT_DEPTH));
      // this.gallery.render(camera, Masks.REFLECTED, Passes.REFLECT_DEPTH, lerpCam, this.reflect.globalCfg, force)

      this.reflect.blitRenderBuffer();


      this.reflect.restoreCamera(camera);


      this.reflect.processOutput();
    }


    this.postprocess.preRender(this.viewport.width, this.viewport.height);
    this.postprocess.bindColor(this.clearColor);

    this.viewport.setupGl(gl);

    scene.render(this.context.withMask(RenderMask.OPAQUE).withPass(RenderPass.COLOR));
    scene.render(this.context.withMask(RenderMask.BLENDED).withPass(RenderPass.COLOR));

    GLState.get(gl).apply();

    this.postprocess.render();
  }

  dispose() {
    this.pointers.dispose();
  }
}
