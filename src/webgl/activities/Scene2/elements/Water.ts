import Renderer from "@webgl/Renderer";
import { RenderContext } from "@webgl/core/Renderer";
import GltfResource from "@webgl/resources/GltfResource";
import Gltf from "nanogl-gltf/lib/Gltf";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import MeshRenderer from "nanogl-gltf/lib/renderer/MeshRenderer";
import Bounds from "nanogl-pbr/Bounds";
import WaterSurface from "../chunks/water-surface/WaterSurface";
import { Uniform } from "nanogl-pbr/Input";
import { vec3 } from "gl-matrix";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";
import { StandardPass } from "nanogl-pbr/StandardPass";
import RenderMask from "@webgl/core/RenderMask";
import BlendAlpha from "../chunks/blend-alpha/BlendAlpha";
import WaterPlane from "./WaterPlane";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import Texture2D from "nanogl/texture-2d";
import Time from "@webgl/Time";
import { ISheet } from "@theatre/core";
import Background from "../utils/Background";
import Scene2 from "../Scene2";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import TextureAddChunk from "@webgl/glsl/textureAdd/TextureAddChunk";

export default class Water {
  res: GltfResource;
  gltf: Gltf;
  bounds: Bounds = new Bounds();

  renderables: MeshRenderer[] = [];

  center: number[] = [];

  waterColor: Uniform;
  time: Uniform;
  // waterNoiseTex: Sampler;

  noiseTex: Texture2D;

  blendThreshold: Uniform;
  blendOpacity: Uniform;
  blendThresholdBase = 1;
  blendOpacityBase = 0.9;

  waterPlanes: WaterPlane[] = [];

  rotationTimeline: TheatreFloat;

  rotation = { value: 1, startV: 0 };

  totalTime = 0;
  sheetSuccess: ISheet;

  constructor(private renderer: Renderer, ambientChunk: AmbientAddChunk, tileAddChunk: TextureAddChunk) {
    this.noiseTex = this.renderer.scene.texturePool.get("perlinNoise").texture;

    const overrides = new MaterialOverrideExtension();


    const blendAlpha = new BlendAlpha();
    this.blendThreshold = blendAlpha.threshold.attachUniform();
    this.blendOpacity = blendAlpha.opacity.attachUniform();

    overrides.overridePass("", (ctx, material) => {
      const surface = new WaterSurface(material);
      this.waterColor = surface.waterColor.attachUniform();
      this.time = surface.time.attachUniform();
      // this.waterNoiseTex = surface.noise.attachSampler("tNoise", TexCoord.create("aTexCoord0"));

      const pass = material.getPass("color").pass as StandardPass<MetalnessSurface>;
      pass.inputs.add(ambientChunk);
      pass.inputs.add(blendAlpha);
      pass.inputs.add(surface);
      // pass.inputs.add(tileAddChunk);
      pass.alphaMode.set("BLEND");
      pass.mask = RenderMask.BLENDED;
      pass.glconfig
        .depthMask(true)
        .enableBlend()
        .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA);
      return pass;
    });

    this.res = new GltfResource("scene2/Water_02.glb", renderer.gl, {
      defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [overrides],
    });
  }

  async load() {
    return this.res.load();
  }

  onLoaded() {
    this.gltf = this.res.gltf;
    this.renderables = this.gltf.renderables;

    this.gltf.root.updateWorldMatrix();

    const b = new Bounds();
    Bounds.transform(
      this.bounds,
      this.gltf.renderables[0].bounds,
      this.gltf.renderables[0].node._wmatrix
    );
    for (const renderable of this.renderables) {
      Bounds.transform(b, renderable.bounds, renderable.node._wmatrix);
      Bounds.union(this.bounds, this.bounds, b);
    }

    this.center = [
      (this.bounds.min[0] + this.bounds.max[0]) / 2,
      (this.bounds.min[1] + this.bounds.max[1]) / 2,
      (this.bounds.min[2] + this.bounds.max[2]) / 2
    ];

    this.waterPlanes.push(new WaterPlane(vec3.fromValues(0, -.1, 0), Math.PI * 2 * Math.random(), 1.3, 0.25, 0.3, 1));
    this.waterPlanes.push(new WaterPlane(vec3.fromValues(0, -.12, 0), Math.PI * 2 * Math.random(), .8, 0.2, 0.5, 1.5));
  }

  start() {
    this.gltf.root.invalidate();
    this.gltf.root.updateWorldMatrix();
    this.waterColor.set(0.48, 0.74, 0.61);
    // this.waterColor.set(1, 0, 0);
    // this.waterNoiseTex.set(this.noiseTex);

    this.rotationTimeline = new TheatreFloat(this.rotation, this.sheetSuccess, "Water Rotation Factor");

    this.rotation.startV = this.rotation.value;

    /// #if DEBUG
    const PARAMS = {
      waterColor: this.waterColor.value,
    };

    const f = Scene2.guiFolder.folder("Water");
    f.addColor(PARAMS, "waterColor").onChange(() => this.waterColor.set(...PARAMS.waterColor));
    f.range(this, "blendThresholdBase", 0, 4);
    f.range(this, "blendOpacityBase", 0, 2);
    /// #endif
  }

  stop() {
    this.rotationTimeline.dispose();
  }

  preRender() {
    const bgAnim = Background.transition.value;
    // this.waterColor.set(0.5439 + bgAnim * 0.2, 0.7375 + bgAnim * 0.2, 0.6826 + bgAnim * 0.2);
  }

  render(ctx: RenderContext) {
    this.totalTime += Time.dt * this.rotation.value;
    this.waterPlanes.sort((a, b) => a.position[1] - b.position[1]).forEach((plane) => {
      this.gltf.root.scale.set(plane.node.scale);
      this.gltf.root.rotation.set(plane.node.rotation);
      this.gltf.root.position.set(plane.node.position);
      this.gltf.root.invalidate();
      this.gltf.root.updateWorldMatrix();
      this.blendThreshold.set(plane.blendThreshold * this.blendThresholdBase);
      this.blendOpacity.set(plane.blendOpacity * this.blendOpacityBase);
      this.time.set(this.totalTime * 0.00001 * plane.rotationSpeed);

      for (const renderable of this.renderables) {
        renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
      }
    });
  }
}
