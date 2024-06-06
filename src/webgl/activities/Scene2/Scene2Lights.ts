import Node from "nanogl-node";
import { quat, vec3 } from "gl-matrix";
import Renderer from "@webgl/Renderer";
import Lighting from "@webgl/engine/Lighting";
import SpotLight from "nanogl-pbr/lighting/SpotLight";
import LightSetup from "nanogl-pbr/lighting/LightSetup";
import PointLight from "nanogl-pbr/lighting/PointLight";
import Scene2 from "./Scene2";
import { ISheet } from "@theatre/core";
import TheatreFloat from "@webgl/theatre/TheatreFloat";

const V3_A = vec3.create();

export default class Scene2Lights {

  node: Node;

  sceneLighting: Lighting;
  // waterLighting: Lighting;
  spot: SpotLight;
  pointLight: PointLight;
  pointLightColor = { r: 0.9449, g: 0.9202, b: 0.5788 };

  lightSetup: LightSetup;

  moveSmoothing = 0.0025;
  initialPositionSpot: vec3 = vec3.create();

  powerTimeline: TheatreFloat;

  power = { value: 1, startV: 0 };

  sheetSuccess: ISheet;

  constructor(
    public readonly renderer: Renderer
  ) {

    this.node = new Node();

    this.spot = new SpotLight();

    this.spot.radius = 61.96;
    this.spot.outerAngle = 0.85;
    this.spot.innerAngle = 0;
    this.spot._color.set([0.9449, 0.9202, 0.5788]);
    // this.spot.castShadows = true;
    // this.spot.shadowmapSize = 2048;
    this.spot.y = 5;
    this.spot.z = -2.17;
    // this.spot.rotateX(-Math.PI / 2);
    quat.set(this.spot.rotation, -0.85, 0.26, 0.31, 0.32);


    // this.pointLight = new PointLight();
    // this.pointLight.radius = 6;
    // this.pointLight.castShadows = false;
    // this.pointLight._color.set([43, 255, 178]);
    // this.pointLight.position.set([0, 5, 0]);
    // this.pointLight.rotateX(-Math.PI / 2);
    // this.pointLight.invalidate();
    // this.pointLight.updateWorldMatrix();

    this.initialPositionSpot = vec3.clone(this.spot.position);

    const o = { power: 10, power2: 25.0 };
    this.spot._color.set([this.pointLightColor.g * o.power, this.pointLightColor.g * o.power, this.pointLightColor.b * o.power]);
    /// #if DEBUG
    const fld = Scene2.guiFolder.folder("Scene 2 - Light");

    const f = fld.folder("Spotlight");
    f.add(this.spot, "outerAngle", { min: 0, max: Math.PI });
    f.add(this.spot, "innerAngle", { min: 0, max: Math.PI });
    f.add(this.spot, "radius", { min: 0, max: 150 });
    f.add(this.spot, "x", { min: -20, max: 20 });
    f.add(this.spot, "y", { min: -15, max: 100 });
    f.add(this.spot, "z", { min: -20, max: 20 });
    // f.addRotation(this.spot, "rotation").onChange(() => {
    //   this.spot.invalidate()
    //   this.spot.updateWorldMatrix()
    // });
    f.add(o, "power", { min: 0, max: 50 }).onChange((v) => {
      this.spot._color.set([this.pointLightColor.g * v, this.pointLightColor.g * v, this.pointLightColor.b * v]);
    });

    // const f2 = fld.folder("Pointlight");
    // f2.add(this.pointLight, "radius", { min: 0, max: 10 });
    // const watero = { power: 0, color: { r: 43, g: 255, b: 178 } };
    // f2.add(watero, "power", { min: 0, max: 2 }).onChange(() => this.setColor(this.pointLight._color, watero.color, watero.power));
    // f2.add(watero, "color").onChange(() => this.setColor(this.pointLight._color, watero.color, watero.power));
    /// #endif
  }

  setColor(colorParam: Float32Array, color: { r: number, g: number, b: number }, power: number) {
    colorParam.set([color.r * power, color.g * power, color.b * power]);
  }

  start(sceneLighting: Lighting) {
    this.sceneLighting = sceneLighting;
    // this.waterLighting = waterLighting;

    sceneLighting.lightSetup.add(this.spot);
    // waterLighting.lightSetup.add(this.pointLight);

    this.node.add(this.spot);
    // this.node.add(this.pointLight);

    this.powerTimeline = new TheatreFloat(this.power, this.sheetSuccess, "Pointlight Power");

    this.power.startV = this.power.value;
  }

  stop() {
    this.sceneLighting.lightSetup.remove(this.spot);
    // this.waterLighting.lightSetup.remove(this.pointLight);

    this.node.remove(this.spot);
    // this.node.remove(this.pointLight);

    this.powerTimeline.dispose();
  }


  preRender(fishPosition: vec3) {
    this.renderer.camera.updateWorldMatrix()
    this.spot.x = this.renderer.camera._wmatrix[12];
    this.spot.y = this.renderer.camera._wmatrix[13];
    this.spot.z = this.renderer.camera._wmatrix[14];
    this.spot.invalidate();
    this.spot.updateWorldMatrix();
    // vec3.sub(V3_A, this.renderer.camera.position, fishPosition);
    // vec3.normalize(V3_A, V3_A);
    // V3_A[2] = 0.4;
    // vec3.add(V3_A, V3_A, this.spot.position);
    vec3.set(V3_A, 0, 0, 0);
    this.spot.lookAt(fishPosition);
    this.spot.invalidate();
    this.spot.updateWorldMatrix();

    // this.spot.invalidate();
    // this.spot.updateWorldMatrix();

    this.setColor(this.spot._color, this.pointLightColor, this.power.value);

    // this.pointLight.invalidate();
    // this.pointLight.updateWorldMatrix();
    // DebugDraw.drawSpotLight(this.spot);
  }
}