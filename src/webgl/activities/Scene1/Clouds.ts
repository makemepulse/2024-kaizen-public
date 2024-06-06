import Scene1 from "./Scene1";
import Time from "@webgl/Time";
import Camera from "nanogl-camera";
import Renderer from "@webgl/Renderer";
import { ISheet } from "@theatre/core";
import Gltf from "nanogl-gltf/lib/Gltf";
import Node from "nanogl-gltf/lib/elements/Node";
import CloudChunk from "./chunks/clouds/CloudChunk";
import { RenderContext } from "@webgl/core/Renderer";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import { StandardPass } from "nanogl-pbr/StandardPass";
import GltfResource from "@webgl/resources/GltfResource";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";

const path = "scene1/clouds.gltf";

export default class Clouds {
  private node: Node;
  private gltf: Gltf;
  private resource: GltfResource;

  private time = 0;
  private cloudBaseSpeed = 0.4;

  private renderer: Renderer;
  private cloudChunk: CloudChunk;

  private cloudsProgress = { value: 0 };
  private cloudsProgressCoeff: TheatreFloat;

  private cloudsOpacity = { value: 0.0 };
  private cloudsOpacityIntroTheatre: TheatreFloat;
  private cloudsOpacityOutroTheatre: TheatreFloat;

  constructor(private sheetPerfect: ISheet, private sheetSuccess: ISheet, private sheetIntro: ISheet, private sheetOutro: ISheet) {
  }

  overrideColor(pass: StandardPass) {
    if (pass.inputs._chunks.findIndex(c => c instanceof CloudChunk) === -1) {
      this.cloudChunk = new CloudChunk(pass);
      pass.inputs._chunks.unshift(this.cloudChunk);
      pass.inputs.invalidateList();
    }
  }

  async load(renderer: Renderer): Promise<any> {

    this.renderer = renderer;

    const overrides = new MaterialOverrideExtension();

    overrides.overridePass("Clouds", (ctx, mat) => {
      const pass = mat.getPass("color").pass;
      const amb = new AmbientAddChunk();
      amb.ambientAddUniform.set(1.0);
      this.overrideColor(pass as StandardPass);
      pass.inputs.add(amb);
      return null;
    });

    this.resource = new GltfResource(path, this.renderer.gl, {
      defaultTextureFilter: this.renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [overrides],
    });

    this.gltf = await this.resource.load();

    this.node = this.gltf.getNode("Clouds");

    this.onLoaded();
  }

  paneSetup() {
    /// #if DEBUG
    const f = Scene1.guiFolder.folder("Clouds");
    const PARAMS = {
      cloudColorSlow: this.cloudChunk.cloudColorSlowUniform.value,
      cloudColorFast: this.cloudChunk.cloudColorFastUniform.value,
      xPosition: 0,
      yPosition: 0,
      zPosition: 0,
      maxDist: 700.0,
      minDist: 550.0,
      isFogEnabled: true,
      upDownFade: 60.0,
    };

    f.addColor(PARAMS, "cloudColorSlow");
    f.addColor(PARAMS, "cloudColorFast");
    f.add(PARAMS, "xPosition", { min: -50, max: 50 }).onChange((v) => { this.node.position[0] = v; });
    f.add(PARAMS, "yPosition", { min: -100, max: 50 }).onChange((v) => { this.node.position[1] = v; });
    f.add(PARAMS, "zPosition", { min: -100, max: 100 }).onChange((v) => { this.node.position[2] = v; });
    f.add(PARAMS, "isFogEnabled").onChange((v) => { this.cloudChunk.isFogEnabledUniform.set(v ? 1 : 0); });
    f.add(PARAMS, "maxDist", { min: 0, max: 1200 }).onChange((v) => { this.cloudChunk.maxDistUniform.set(v); });
    f.add(PARAMS, "minDist", { min: 0, max: 1200 }).onChange((v) => { this.cloudChunk.minDistUniform.set(v); });
    f.add(PARAMS, "upDownFade", { min: 0, max: 200 }).onChange((v) => { this.cloudChunk.cloudUpDownFadeUniform.set(v); });
    /// #endif
  }

  onLoaded(): void {
    /// #if DEBUG
    this.paneSetup();
    /// #endif
  }

  start() {
    this.cloudsProgressCoeff = new TheatreFloat(this.cloudsProgress, this.sheetSuccess, "CloudsProgressCoeff");
    this.cloudsOpacityOutroTheatre = new TheatreFloat(this.cloudsOpacity, this.sheetOutro, "clouds opacity");
    this.cloudsOpacityIntroTheatre = new TheatreFloat(this.cloudsOpacity, this.sheetIntro, "clouds opacity");

    this.node.position[0] = 0;
    this.node.position[1] = -51;
    this.node.position[2] = 100;

    this.cloudChunk.maxDistUniform.set(700);
    this.cloudChunk.minDistUniform.set(550);

    this.node.invalidate();
    this.node.updateWorldMatrix();
  }

  stop() {
    this.cloudsProgressCoeff?.dispose();
    this.cloudsOpacityIntroTheatre?.dispose();
    this.cloudsOpacityOutroTheatre?.dispose();
  }

  preRender(cam: Camera): void {
    const dt = Time.scaledDt / 10000 * this.cloudBaseSpeed;
    this.time += dt + dt * this.cloudsProgress.value * 4;
    this.cloudChunk.timeUniform.set(this.time);
    this.cloudChunk.progressUniform.set(this.cloudsProgress.value);
    this.cloudChunk.opacityUniform.set(this.cloudsOpacity.value);
    this.cloudChunk.zDepthCameraPos.set(cam._wposition[0], cam._wposition[1], cam._wposition[2]);

    this.node.invalidate();
    this.node.updateWorldMatrix();
  }

  render(ctx: RenderContext): void {
    this.node.invalidate();
    this.node.updateWorldMatrix();

    for (const renderable of this.gltf.renderables) {
      renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
    }
  }
}
