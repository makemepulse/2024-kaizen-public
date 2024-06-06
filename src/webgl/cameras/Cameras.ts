
import { createDevCamera, createOrbitCamera } from "@webgl/dev/cameras";
import gui from "@webgl/dev/gui";
import { Control } from "@webgl/dev/gui/api";

import { DEG2RAD } from "@webgl/math";
import Renderer from "@webgl/Renderer";
import { mat4 } from "gl-matrix";
import Camera from "nanogl-camera";
import PerspectiveLens from "nanogl-camera/perspective-lens";

import CameraManager from "./CameraManager";
import Node from "nanogl-node";


export type CameraName = "main" | "dev" | string


export default class Cameras {

  private _managers = new Map<CameraName, CameraManager<PerspectiveLens>>()

  private _current: CameraManager<PerspectiveLens>;

  constructor(readonly renderer: Renderer) {
    const mainManager = new CameraManager(Cameras.makeDefaultCamera());
    this.registerCamera(mainManager, "main");

    const orbitCamera = createOrbitCamera(renderer);
    this.registerCamera(orbitCamera, "orbit");


    /// #if DEBUG
    /** enable debug cameras */
    const devCamera = createDevCamera(renderer);
    this.registerCamera(devCamera, "dev");

    if (localStorage.getItem("devcam_state")) {
      const state = JSON.parse(localStorage.getItem("devcam_state"));
      devCamera.camera.setMatrix(state.matrix);
      devCamera.camera.lens.fov = state.fov;
      devCamera.camera.lens.near = state.near;
      devCamera.camera.lens.far = state.far;
    }

    // this.registerCamera( createBlenderCamera(renderer), '' )
    this._gui();
    this.use("main");

    /// #else
    this.use("main");
    /// #endif

  }

  /**
   * the active camera
   */
  get camera(): Camera<PerspectiveLens> {
    return this._current.camera;
  }

  get mainCamera(): Camera<PerspectiveLens> {
    return this._managers.get("main").camera;
  }

  get current(): CameraManager {
    return this._current;
  }

  use(name: CameraName): void {
    this._current?.stop();
    console.assert(this._managers.has(name), `camera manager ${name} doesn't exist`);
    this._current = this._managers.get(name);
    this._current?.start();

    /// #if DEBUG
    this._updateCurrentGui();
    /// #endif
  }


  registerCamera(manager: CameraManager<PerspectiveLens>, name: CameraName): void {
    console.assert(!this._managers.has(name), `camera manager ${name} already registered`);
    this._managers.set(name, manager);
    // this.renderer.scene.root.add( manager.camera )
  }


  preRender(): void {
    this.current.preRender();
    this.camera.updateWorldMatrix();
  }


  static makeDefaultCamera(): Camera<PerspectiveLens> {
    // const camera = Camera.makePerspectiveCamera()
    const camera = new Camera(new PerspectiveLens());
    camera.lens.setAutoFov(35.0 * DEG2RAD); //80
    camera.lens.near = .1;
    camera.lens.far = 2000;

    const n = new Node();
    n.add(camera);


    camera.setMatrix(new Float32Array(
      [0.7726250290870667, -1.4619167210128126e-8, -0.6348624229431152, 0, -0.03074836730957, 0.9988264441490173, -0.037420663982629776, 0, 0.6341174244880676, 0.048433128744363785, 0.7717183828353882, 0, 5.253443717956543, 1.3910399675369263, 6.792383193969727, 1]
    ) as mat4);

    return camera;
  }






  /// #if DEBUG
  private _gui() {
    const g = gui.folder("Cameras");
    const names = Array.from(this._managers.keys());
    g.radios<CameraName>("camera", names).onChange(name => this.use(name));
    g.btn("log matrix", () => console.log(Array.from(this.camera._matrix)));
    g.btn("log position", () => console.log(Array.from(this.camera._wposition)));
    g.btn("place devcam to main", () => {
      this._managers.get("dev").camera.setMatrix(this.mainCamera._matrix);
    }).setHint("Move dev camera to main camera position");
    g.btns({
      "store": () => {
        const camera = this._managers.get("dev").camera;
        localStorage.setItem("devcam_state", this.serializeCamera(camera));
      },
      "clear": () => {
        localStorage.removeItem("devcam_state");
      }
    }, "devcam state");
  }

  private _cguiCtrls: Control<unknown>[] = []

  private _updateCurrentGui() {
    const g = gui.folder("Cameras");
    this._cguiCtrls.forEach(c => c.remove());
    this._cguiCtrls.length = 0;
    this._cguiCtrls.push(g.range(this.camera.lens, "near", .1, 50));
    this._cguiCtrls.push(g.range(this.camera.lens, "far", 10, 2000));
    this._cguiCtrls.push(g.range(this.camera.lens, "fov", .05, Math.PI * .9));
  }


  serializeCamera(camera: Camera<PerspectiveLens>): string {
    return JSON.stringify({
      matrix: Array.from(camera._matrix),
      fov: camera.lens.fov,
      near: camera.lens.near,
      far: camera.lens.far,
    });
  }


  /// #endif

}