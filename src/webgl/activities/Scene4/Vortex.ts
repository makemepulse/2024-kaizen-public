import Renderer from "@webgl/Renderer";
import { RenderContext } from "@webgl/core/Renderer";
import Lighting from "@webgl/engine/Lighting";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import GltfResource from "@webgl/resources/GltfResource";
import Gltf from "nanogl-gltf/lib/Gltf";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import Material from "nanogl-pbr/Material";
import CloudsChunk from "./clouds/CloudsChunk";
import Time from "@webgl/Time";
import Texture2D from "nanogl/texture-2d";
import { vec3 } from "gl-matrix";
import TextureAddChunk from "@webgl/glsl/textureAdd/TextureAddChunk";
import { StandardPass } from "nanogl-pbr/StandardPass";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";
import { smoothstep } from "@webgl/math";

export default class Vortex {
  res: GltfResource;
  gltf: Gltf;

  speed = 1;
  cloudsOpacity = 1


  private _noiseTex: Texture2D

  private _cloudsChunks: CloudsChunk[];

  private _startScales: vec3[]

  constructor(path: string, private renderer: Renderer, ambientChunk: AmbientAddChunk, tileAddChunk: TextureAddChunk) {
    const materialOverride = new MaterialOverrideExtension();
    this._cloudsChunks = [];
    this._startScales = [];

    // materialOverride.overridePass("Material.008", (ctx, mat) => {
    //   return null;
    // });
    materialOverride.overridePass("", (ctx, mat) => {
      const cloudsChunk = new CloudsChunk(mat, this._noiseTex);
      const pass = mat.getPass("color").pass as StandardPass<MetalnessSurface>;
      pass.inputs.add(cloudsChunk);
      this._cloudsChunks.push(cloudsChunk);
      pass.inputs.add(ambientChunk);
      pass.glconfig.depthMask(true)
      // mat.glconfig.enableCullface(false)
      // mat.getPass("color").pass.inputs.add(tileAddChunk);
      return null;
    });
    this.res = new GltfResource(path, renderer.gl, {
      defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [materialOverride],
    });
    this._noiseTex = renderer.scene.texturePool.get("fractalNoise").texture;
  }

  async load() {
    return this.res.load();
  }

  onLoaded() {
    this.gltf = this.res.gltf;
    this.gltf.root.invalidate();
    this.gltf.root.updateWorldMatrix();

    for (const renderable of this.gltf.renderables) {
      const v = vec3.create();
      vec3.copy(v, renderable.node.scale);
      this._startScales.push(v);
    }
  }

  setupLighting(lighting: Lighting) {
    const materials = [] as Material[];
    const matRends = this.gltf.renderables;
    for (const renderable of matRends) {
      for (const mat of renderable.materials) {
        if (materials.indexOf(mat) === -1) {
          materials.push(mat);
        }
      }
    }
    for (const material of materials) {
      lighting.setupMaterial(material);
    }
  }

  preRender() {
    for (const chunk of this._cloudsChunks) {
      chunk.cloudScroll -= Time.scaledDt * chunk.speedRatio * Math.max(1.5, this.speed);
      chunk.opacityU.set(this.cloudsOpacity);
      chunk.speedScaleU.set(smoothstep(2, 9, this.speed));
    }
  }

  render(ctx: RenderContext): void {
    for (const chunk of this._cloudsChunks) {
      chunk.speedU.set(chunk.cloudScroll);
    }

    for (const [index, renderable] of this.gltf.renderables.entries()) {
      vec3.copy(renderable.node.scale, this._startScales[index]);
      renderable.node.scale[1] = this._startScales[index][1] * this.speed;
      renderable.node.invalidate();
    }
    for (const renderable of this.gltf.renderables) {
      renderable.render(this.renderer.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
    }

    // super.render(ctx);
  }
}