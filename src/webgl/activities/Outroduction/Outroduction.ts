import gsap from "gsap";
import Time from "@webgl/Time";
import Camera from "nanogl-camera";
import { Subscription } from "xstate";
import { quat, vec3 } from "gl-matrix";
import Renderer from "@webgl/Renderer";
import Gltf from "nanogl-gltf/lib/Gltf";
import Material from "nanogl-pbr/Material";
import Lighting from "@webgl/engine/Lighting";
import AppService from "@/services/AppService";
import Viewport from "@/store/modules/Viewport";
import { toStatePaths } from "xstate/lib/utils";
import Node from "nanogl-gltf/lib/elements/Node";
import AudioManager from "@/core/audio/AudioManager";
import { RenderContext } from "@webgl/core/Renderer";
import { Activity } from "@webgl/activities/Activity";
import GltfResource from "@webgl/resources/GltfResource";
import PerspectiveLens from "nanogl-camera/perspective-lens";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import { mobileOrigamiId } from "@/services/states/AppStateMachine";

const path = "outroduction/outroduction.gltf";

const ANGLE_Y = 0.1;

export default class Outroduction implements Activity {
  gltf: Gltf;

  resource: GltfResource;

  lighting: Lighting;

  focus: number;

  paused = false;

  previousState = "";

  contextOrigamiId: mobileOrigamiId = "noOrigami";

  changeStateSubscription: Subscription;

  cylinder: Node;
  cameraInitialPosition: vec3 = vec3.create();
  cameraLookAt: vec3 = vec3.create();

  mousePosition = { x: 0, y: 0 } as { x: number; y: number };

  touchStartTime = 0;

  cameraTransitionDuration = 1;

  constructor(private renderer: Renderer) {}

  async load(): Promise<any> {
    this.lighting = new Lighting(this.renderer.gl);
    await this.lighting.load();

    const overrides = new MaterialOverrideExtension();

    this.resource = new GltfResource(path, this.renderer.gl, {
      defaultTextureFilter: this.renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [overrides],
    });

    console.log("load outroduction");

    this.gltf = await this.resource.load();

    console.log("loaded outroduction");

    this.gltf.root.add(this.lighting.root);
    this.onLoaded();
  }

  onLoaded(): void {
    /* CAMERA FOV */

    const isDesktop = window.innerWidth >= 1050 || !("ontouchstart" in window);
    let focus = 1.08;
    if (!isDesktop) {
      focus = 0.77;
    }
    (this.renderer.cameras.camera.lens as PerspectiveLens).setVerticalFov(
      focus
    );

    this.setupLighting();
  }

  unload(): void {}

  start(): void {
    this.changeStateSubscription = AppService.state.subscribe(this.changeState);
    console.log("start outroduction");
    /* CAMERA START */
    if (!Viewport.isDesktop) {
      const rootElement = document.documentElement;
      rootElement.classList.add("prevent-select");
    }

    const cam: Camera = this.renderer.cameras.camera;
    vec3.copy(this.cameraInitialPosition, this.gltf.getNode("CameraPos").position);
    vec3.copy(cam.position, this.cameraInitialPosition);
    // vec3.set(cam.position, 1, -10, -2);
    vec3.copy(this.cameraLookAt, this.gltf.getNode("CameraTarget").position);
    cam.lookAt(this.cameraLookAt);
    cam.invalidate();
    cam.updateWorldMatrix();
    cam.updateViewProjectionMatrix(
      this.renderer.viewport.width,
      this.renderer.viewport.height
    );

    this.cylinder = this.gltf.getNode("Cylinder");
    
    // Add event listener mouse move
    window.addEventListener("mousemove", this.onMouseMove);

    // Add event listener pointer
    window.addEventListener("pointerdown", this.onPointerDown);
    window.addEventListener("pointerup", this.onPointerUp);
  }

  stop(): void {
    console.log("stop outroduction");
    this.changeStateSubscription.unsubscribe();
  }

  changeState = async (state: any) => {

    if (this.contextOrigamiId === state.context.mobileOrigamiId) return;
    else this.contextOrigamiId = state.context.mobileOrigamiId;
    if(state.matches("outroduction.mobile.origamis")) {
      if(state.context.mobileOrigamiId == "papillon"){
        this.tweenCamera(this.gltf.getNode("CameraPos1").position, this.gltf.getNode("Cube").position, this.cameraTransitionDuration, 0.58);
      }
      if(state.context.mobileOrigamiId == "carpe"){
        this.tweenCamera(this.gltf.getNode("CameraPos2").position, this.gltf.getNode("Cone").position, this.cameraTransitionDuration, 0.90);
      }
      if(state.context.mobileOrigamiId == "grenouille"){
        this.tweenCamera(this.gltf.getNode("CameraPos3").position, this.gltf.getNode("Torus").position, this.cameraTransitionDuration, 0.45);
      }
      if(state.context.mobileOrigamiId == "grue"){
        this.tweenCamera(this.gltf.getNode("CameraPos4").position, this.gltf.getNode("Icosphere").position, this.cameraTransitionDuration, 0.70);
      }
    } 
    if (this.previousState === toStatePaths(state.value)[0].join(".")) return;
    else this.previousState = toStatePaths(state.value)[0].join(".");
    
    console.log("change state " + this.previousState);

    if(state.matches("outroduction.mobile.carousel")) {
      this.tweenCamera(this.gltf.getNode("CameraPos").position, this.gltf.getNode("CameraTarget").position, this.cameraTransitionDuration);
    }
  };

  onMouseMove = (e: MouseEvent) => {
    this.mousePosition.x = e.clientX;
    this.mousePosition.y = e.clientY;
  };

  onPointerDown = (e: PointerEvent) => {
    this.touchStartTime = Time.scaledTime;
  };

  onPointerUp = (e: PointerEvent) => {
    if(!this.previousState.match("scene1.interacting.idle")) return;
    const duration = Time.scaledTime - this.touchStartTime;
    if(duration > 1000 && duration < 2500) {
      AppService.state.send("PERFECT_INTERACTION");
    }
    else{
      AppService.state.send("SUCCESS_INTERACTION");
    }
  };

  tweenCamera(targetPosition: vec3, targetLookAt: vec3, duration: number, fov = 1.08) {
    const tween = gsap.timeline();
    tween.to(this.renderer.cameras.camera.position, {
      duration: duration,
      0: targetPosition[0],
      1: targetPosition[1],
      2: targetPosition[2],
      ease: "power2.out",
      onComplete: () => {
        vec3.copy(this.cameraInitialPosition, targetPosition);
      }
    });

    const lookAtTarget = this.cameraLookAt;
    const lookAtTween = gsap.timeline();

    lookAtTween.to(lookAtTarget, {
      duration: duration,
      0: targetLookAt[0],
      1: targetLookAt[1],
      2: targetLookAt[2],
      ease: "power2.out",
      onComplete: () => {
        vec3.copy(this.cameraLookAt, targetLookAt);
      }
    });


    //tween camera fov
    const cameraFovTween = gsap.timeline();
    const cameraFovObject = { fov: (this.renderer.cameras.camera.lens as PerspectiveLens).fov };

    if(cameraFovObject.fov !== fov){
      cameraFovTween.to(cameraFovObject, {
        duration: duration,
        fov: fov,
        ease: "power2.out",
        onUpdate: () => {
          (this.renderer.cameras.camera.lens as PerspectiveLens).setVerticalFov(cameraFovObject.fov);
        }
      });
    }
  }

  setupLighting() {
    this.lighting.lightSetup.prepare(this.renderer.gl);
    const materials = [] as Material[];
    for (const renderable of this.gltf.renderables) {
      for (const mat of renderable.materials) {
        if (materials.indexOf(mat) === -1) {
          materials.push(mat);
        }
      }
    }
    for (const material of materials) {
      this.lighting.setupMaterial(material);
    }
  }

  preRender(): void {
    const cam: Camera = this.renderer.cameras.camera;

    cam.lookAt(this.cameraLookAt);
    cam.invalidate();
    cam.updateWorldMatrix();
  }

  rttPass(): void {
    this.lighting.lightSetup.prepare(this.renderer.gl);
    this.lighting.renderLightmaps((ctx: RenderContext) => {
      this.render(ctx);
    });
  }

  render(ctx: RenderContext): void {
    // quat.identity(this.gltf.root.rotation);
    // quat.rotateY(this.gltf.root.rotation, this.gltf.root.rotation, ANGLE_Y);

    // Rotate Cylinder
    quat.identity(this.cylinder.rotation);
    quat.rotateY(this.cylinder.rotation, this.cylinder.rotation, ANGLE_Y);
    // ANGLE_Y += 0.000035 * Time.scaledDt;

    this.cylinder.invalidate();
    this.cylinder.updateWorldMatrix();

    this.gltf.root.invalidate();
    this.gltf.root.updateWorldMatrix();

    for (const renderable of this.gltf.renderables) {
      renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
    }
  }
}
