import gsap from "gsap";
import Scene1 from "./Scene1";
import Node from "nanogl-node";
import { vec3, vec4 } from "gl-matrix";
import Renderer from "@webgl/Renderer";
import Lighting from "@webgl/engine/Lighting";
import SpotLight from "nanogl-pbr/lighting/SpotLight";
import PointLight from "nanogl-pbr/lighting/PointLight";

/// #if DEBUG
import { Gui } from "@webgl/dev/gui/api";
/// #endif

export default class Scene1Lights {
  private node: Node;

  private spot: SpotLight;
  private point: PointLight;
  private lighting: Lighting;

  private lighten = 1.0;
  private spotFactor = 0.0;
  private pointFactor = 1.0;

  private _tween: gsap.core.Tween;
  private lightSetup: any;

  private moveSmoothing = 0.0025;
  private mousePosition = { x: 0, y: 0 } as { x: number; y: number };
  private initialPositionSpot1: vec3 = vec3.create();
  private initialPositionSpot2: vec3 = vec3.create();

  /// #if DEBUG
  lightFolder: Gui;
  /// #endif

  constructor(
    public readonly renderer: Renderer
  ) {

    this.node = new Node();

    this.point = new PointLight();
    // this.point.radius = 192.93;
    this.point.radius = 50;
    this.point._color.set([1*200, 0.54 * 200, 0.38 * 200]);
    this.point.castShadows = true;
    this.point.shadowmapSize = 512;
    this.point.x = 16;
    this.point.y = 23;
    this.point.z = 32;

    this.point.invalidate();
    this.point.updateWorldMatrix();

    this.node.add(this.point);

    // this.applyPointColor();


    // this.spot = new SpotLight();

    // this.spot.radius = 50;
    // this.spot.outerAngle = 0.5;
    // this.spot.innerAngle = 0.2;
    // this.spot._color.set([45, 45, 45]);
    // this.spot.castShadows = true;
    // this.spot.shadowmapSize = 512;
    // // this.spot.iblShadowing = 1.0;
    // this.spot.x = 16;
    // this.spot.y = 23;
    // this.spot.z = 32;
    // this.spot.rotation.set(
    //   [-0.71, 0, 0, 0.71]
    // );
    // this.spot.invalidate();
    // this.spot.updateWorldMatrix();

    // this.initialPositionSpot1 = vec3.clone(this.spot.position);

    // this.node.add(this.spot);

    // Add object and controller for color

    // const o1 = { power: 100.0, color: "#ff0000" };
    // const f2 = fld.folder("Pointlight");
    // f2.add(this.point, "radius", { min: 0, max: 50 });
    // f2.add(this.point, "x", { min: -40, max: 20 });
    // f2.add(this.point, "y", { min: 0, max: 50 });
    // f2.add(this.point, "z", { min: -30, max: 25 });
    // f2.addColor(o1, "color").onChange((v) => {
    //   const rgb = this.hexToRgb(v.toString());
    //   const rgbNorm = rgb.map((v) => v / 255);
    //   this.point._color.set([o1.power * rgbNorm[0], o1.power * rgbNorm[1], o1.power * rgbNorm[2]]);
    // });
    // f2.add(o1, "power", { min: 0, max: 1000 }).onChange((v) => {
    //   const rgb = this.hexToRgb(o1.color.toString());
    //   const rgbNorm = rgb.map((v) => v / 255);
    //   this.point._color.set([v * rgbNorm[0], v * rgbNorm[1], v * rgbNorm[2]]);
    // });
  }

  start(lighting: Lighting) {
    this.lighting = lighting;

    lighting.lightSetup.add(this.point);

    /// #if DEBUG
    const f = Scene1.guiFolder.folder("Pointlight");
    this.lightFolder = f;
    const o = { power: 105.0, power2: 25.0, color: vec4.create() };
    f.add(this.point, "radius", { min: 0, max: 150 });
    f.add(this.point, "x", { min: -20, max: 20 });
    f.add(this.point, "y", { min: -15, max: 25 });
    f.add(this.point, "z", { min: -100, max: 100 });
    f.addRotation(this.point, "rotation").onChange(() => this.point.invalidate());
    f.addColor(o, "color").onChange((v) => {
      this.point._color.set([v[0]*o.power, v[1]*o.power, v[2]*o.power]);
    });
    f.add(o, "power", { min: 0, max: 300 }).onChange((v) => {
      this.point._color.set([o.color[0]*v, o.color[1]*v, o.color[2]*v]);
    });
    /// #endif

  }

  stop() {
    this.lighting.lightSetup.remove(this.point);
    /// #if DEBUG
    Scene1.guiFolder.clearFolder("Pointlight");
    /// #endif

  }

  async setLight(duration = 2.5, delay = 0) {

    this._tween = gsap.to(this, {
      lighten: 0.075,
      spotFactor: 1.0,
      pointFactor: 0.0,
      duration,
      delay,
      ease: "power2.inOut",
      onUpdate: () => this.onTransitionUpdate()
    });
  }

  onMouseMove = (e: MouseEvent) => {
    this.mousePosition.x = e.clientX;
    this.mousePosition.y = e.clientY;
  };

  preRender(butterflyPosition: vec3) {
    // const xNorm = -(this.mousePosition.x / window.innerWidth - 0.5) * 2;
    // const yNorm = (this.mousePosition.y / window.innerHeight - 0.5) * 2;

    // const amplitudeX = 7.0;
    // const amplitudeY = 0.6;

    // const cameraTargetX = this.initialPositionSpot1[0] + xNorm * amplitudeX;
    // const cameraTargetY = this.initialPositionSpot1[1] + yNorm * amplitudeY;

    // const cameraTargetX2 = -this.initialPositionSpot1[0] + xNorm * amplitudeX;
    // const cameraTargetY2 = this.initialPositionSpot1[1] + yNorm * amplitudeY;

    // this.spot.position[0] += (cameraTargetX - this.spot.position[0]) * this.moveSmoothing * Time.scaledDt;
    // this.spot.position[1] += (cameraTargetY - this.spot.position[1]) * this.moveSmoothing * Time.scaledDt;

    this.point.position[0] = butterflyPosition[0];
    this.point.position[1] = butterflyPosition[1] + 15;
    // this.point.lookAt(butterflyPosition);

    this.point.invalidate();
    this.point.updateWorldMatrix();
  }

  onTransitionUpdate() {
    // this.lighting.ibl.intensity = this.lighten;
    // this.applyPointColor();
  }

  applyPointColor() {
    this.point._color.set([
      this.pointFactor * 100 * 1,
      this.pointFactor * 100 * 0.0,
      this.pointFactor * 100 * 0.0
    ]);
  }

  // Helper function to convert hex color to RGB array
  hexToRgb(hex: string): [number, number, number] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
      : [0, 0, 0];
  }
}