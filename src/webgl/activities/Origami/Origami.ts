import { vec3 } from "gl-matrix";
import Camera from "nanogl-camera";
import Renderer from "@webgl/Renderer";
import Gltf from "nanogl-gltf/lib/Gltf";
import { RenderContext } from "@webgl/core/Renderer";
import { Activity } from "@webgl/activities/Activity";
import GltfResource from "@webgl/resources/GltfResource";
import PerspectiveLens from "nanogl-camera/perspective-lens";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import Lighting from "@webgl/engine/Lighting";
import { toStatePaths } from "xstate/lib/utils";
import Viewport from "@/store/modules/Viewport";
import { OrigamiId } from "@/services/models/OrigamiModel";

const path = "origami1/origami1.gltf";

export default class Origami implements Activity {
  gltf: Gltf;

  resource: GltfResource;

  lighting: Lighting;

  focus: number;

  paused = false;

  previousState = "";

  constructor(private renderer: Renderer, public id: OrigamiId) { }

  async load(): Promise<any> {
    console.log("load origami " + this.id);
    this.lighting = new Lighting(this.renderer.gl);
    await this.lighting.load();

    const overrides = new MaterialOverrideExtension();

    this.resource = new GltfResource(path, this.renderer.gl, {
      defaultTextureFilter: this.renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [overrides],
    });

    this.gltf = await this.resource.load();

    this.gltf.root.add(this.lighting.root);
    this.onLoaded();
  }

  onLoaded(): void {

    /* CAMERA FOV */

    const isDesktop = window.innerWidth >= 1050 || !("ontouchstart" in window);
    let focus = 1.34;
    if (!isDesktop) {
      focus = 0.77;
    }
    (this.renderer.cameras.camera.lens as PerspectiveLens).setVerticalFov(
      focus
    );


  }

  unload(): void { }

  start(): void {
    console.log("start origami " + this.id);
    /* CAMERA START */
    if (!Viewport.isDesktop) {
      const rootElement = document.documentElement;
      rootElement.classList.add("prevent-select");
    }

    this.renderer.postprocess.enabled = false;

    const cam: Camera = this.renderer.cameras.camera;
    const cameraTarget = this.gltf.getNode("Camera").position;
    vec3.copy(cam.position, cameraTarget);
    // vec3.set(cam.position, 1, -10, -2);
    cam.lookAt(this.gltf.getNode("Cube").position);
    cam.invalidate();
    cam.updateWorldMatrix();
    cam.updateViewProjectionMatrix(
      this.renderer.viewport.width,
      this.renderer.viewport.height
    );

  }

  stop(): void {

    this.renderer.postprocess.enabled = true;
    console.log("stop origami " + this.id);
  }

  _onVisibilityChange = () => {
    if (document.visibilityState === "visible" && this.previousState !== "origami1.idle.paused") {
      this.paused = false;
    } else {
      this.paused = true;
    }
  }

  changeState = async (state: any) => {
    if (this.previousState === toStatePaths(state.value)[0].join(".")) return;
    else this.previousState = toStatePaths(state.value)[0].join(".");

    if (state.matches("origami1.idle")) {
      if (state.matches("origami1.idle.paused")) {
        this.paused = true;
      }
      else {
        this.paused = false;
      }
    }
  }

  preRender(): void {
    
  }

  rttPass(): void {

  }

  render(ctx: RenderContext): void {
    this.gltf.root.invalidate();
    this.gltf.root.updateWorldMatrix();

    for (const renderable of this.gltf.renderables) {
      renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
    }
  }
}
