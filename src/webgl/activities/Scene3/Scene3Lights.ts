import Node from "nanogl-node";
import PointLight from "nanogl-pbr/lighting/PointLight";
import PunctualLight from "nanogl-pbr/lighting/PunctualLight";

import Scene3 from "@webgl/activities/Scene3/Scene3";
import Renderer from "@webgl/Renderer";
import Lighting from "@webgl/engine/Lighting";

const SCENE_COLOR = { r: 255, g: 210, b: 140 };
const SCENE_POWER = 0.3;

export default class Scene3Lights {
  node: Node;
  dummy: Node;

  scenePoint: PointLight;
  sceneLighting: Lighting;

  constructor(
    public readonly renderer: Renderer
  ) {
    this.node = new Node();
    this.dummy = new Node();

    // SCENE POINT LIGHT
    this.scenePoint = new PointLight();
    this.scenePoint.radius = 100;
    this.scenePoint.castShadows = false;
    this.scenePoint.position.set([5, 10, -5]);
    this.updateScenePoint();
    this.updateColor(this.scenePoint, SCENE_COLOR, SCENE_POWER);

    /// #if DEBUG
    const fld = Scene3.guiFolder.folder("Light");

    const scenef = fld.folder("Scene Point");
    const sceneo = { power: SCENE_POWER, color: SCENE_COLOR };
    scenef.add(this.scenePoint, "radius", { min: 0, max: 150 });
    scenef.add(this.scenePoint, "x", { min: -20, max: 20 }).onChange(() => this.updateScenePoint());
    scenef.add(this.scenePoint, "y", { min: -10, max: 20 }).onChange(() => this.updateScenePoint());
    scenef.add(this.scenePoint, "z", { min: -20, max: 20 }).onChange(() => this.updateScenePoint());
    scenef.add(sceneo, "power", { min: 0, max: 2 }).onChange(() => this.updateColor(this.scenePoint, sceneo.color, sceneo.power));
    scenef.add(sceneo, "color").onChange(() => this.updateColor(this.scenePoint, sceneo.color, sceneo.power));
    /// #endif
  }

  // --START/STOP--

  start(sceneLighting: Lighting) {
    this.sceneLighting = sceneLighting;
    sceneLighting.lightSetup.add(this.scenePoint);
    this.node.add(this.scenePoint);
  }

  stop() {
    this.sceneLighting.lightSetup.remove(this.scenePoint);
    this.node.remove(this.scenePoint);
  }

  // --COLOR UPDATES--

  updateColor = (light: PunctualLight, color: { r: number, g: number, b: number }, power: number) => {
    light._color.set(
      [color.r * power, color.g * power, color.b * power]
    );
  }

  // --NODE UPDATES--

  updateScenePoint() {
    this.scenePoint.invalidate();
    this.scenePoint.updateWorldMatrix();
  }
}