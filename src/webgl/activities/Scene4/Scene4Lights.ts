import Node from "nanogl-node";
import { vec3 } from "gl-matrix";
import Renderer from "@webgl/Renderer";
import Lighting from "@webgl/engine/Lighting";
import LightSetup from "nanogl-pbr/lighting/LightSetup";
import PointLight from "nanogl-pbr/lighting/PointLight";
import Scene4 from "./Scene4";

export default class Scene4Lights {

  node: Node;

  lighting: Lighting;
  // spot: SpotLight;

  point: PointLight;

  lightSetup: LightSetup;
  pointLightColor = { r: 0.9449, g: 0.9202, b: 0.5788 };

  moveSmoothing = 0.0025;
  initialPositionSpot: vec3 = vec3.create();
  power = 1695;

  constructor(
    public readonly renderer: Renderer
  ) {

    this.node = new Node();

    // this.spot = new SpotLight();

    this.point = new PointLight();
    this.point.radius = 423;


    /// #if DEBUG
    const fld = Scene4.guiFolder.folder("Scene 4 - Light");

    const f = fld.folder("PointLight");
    const o = { power: 25.0, power2: 25.0 };
    f.add(this.point, "radius", { min: 0, max: 500 });
    f.add(this.point, "x", { min: -20, max: 20 });
    f.add(this.point, "y", { min: -15, max: 25 });
    f.add(this.point, "z", { min: -50, max: 50 });
    f.add(o, "power", { min: 0, max: 3000 }).onChange((v) => {
      this.point._color.set([v * this.pointLightColor.r, v * this.pointLightColor.g, v * this.pointLightColor.b]);
    });
    /// #endif
  }

  start(lighting: Lighting) {
    this.lighting = lighting;
    lighting.lightSetup.add(this.point);
    vec3.set(this.point.position, -3.91, 5.87, -1.09);
    this.initialPositionSpot = vec3.clone(this.point.position);
    this.point._color.set([this.pointLightColor.r * this.power, this.pointLightColor.g * this.power, this.pointLightColor.b * this.power]);
    this.node.add(this.point);

    this.point.invalidate();
    this.point.updateWorldMatrix();
  }

  stop() {
    this.lighting.lightSetup.remove(this.point);
    this.node.remove(this.point);

  }

  preRender(cranePosition: vec3, speed: number) {
    vec3.copy(this.point.position, cranePosition);
    this.point.position[1] += 20;
    this.point.position[0] += 10;

    const pw = this.power + speed * 1000;
    this.point._color.set([this.pointLightColor.r * pw, this.pointLightColor.g * pw, this.pointLightColor.b * pw]);
    this.point.invalidate();
    this.point.updateWorldMatrix();
  }
}