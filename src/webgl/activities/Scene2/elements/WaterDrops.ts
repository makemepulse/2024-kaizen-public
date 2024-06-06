import { RenderContext } from "@webgl/core/Renderer";
import ParticlesSystem from "../utils/ParticlesSystem";
import { vec3 } from "gl-matrix";
import Renderer from "@webgl/Renderer";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import Time from "@webgl/Time";
import WaterDropsChunk from "../chunks/water-drops/WaterDropsChunk";
import { Uniform } from "nanogl-pbr/Input";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import { StandardPass } from "nanogl-pbr/StandardPass";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";
import RenderMask from "@webgl/core/RenderMask";

const PATH = "scene2/waterdrop.glb";
const PARTICLES_PER_VFX = 120;
const MAX_SIMULTANEOUS_VFX = 2;

export default class WaterDrops extends ParticlesSystem {

  chunk: WaterDropsChunk;
  activesVFX: boolean[] = [];

  cameraRight: Uniform;
  cameraUp: Uniform;

  constructor(
    renderer: Renderer,
    ambientChunk: AmbientAddChunk,
  ) {
    const overrides = new MaterialOverrideExtension();
    overrides.overridePass("", (ctx, material) => {
      const pass = material.getPass("color").pass as StandardPass<MetalnessSurface>;
      pass.alphaMode.set("BLEND");
      pass.mask = RenderMask.BLENDED;
      pass.glconfig
        .depthMask(false)
        .enableBlend()
        .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA);
      return pass;
    });

    super(renderer, ambientChunk, PATH, PARTICLES_PER_VFX * MAX_SIMULTANEOUS_VFX, overrides);

    this.addChunk(this.chunk = new WaterDropsChunk(), -0.5); // -0.5 to scale vertex before warp
    this.cameraRight = this.chunk.cameraRight.attachUniform();
    this.cameraUp = this.chunk.cameraUp.attachUniform();

    this.chunk.color.attachConstant([1, 1, 1]);

    this.addInstanceAttribute("aInstanceStartPosition", 3, renderer.gl.FLOAT);
    this.addInstanceAttribute("aParams", 3, renderer.gl.FLOAT);

    this.activesVFX = Array.from({ length: MAX_SIMULTANEOUS_VFX }, () => false);
  }

  spawn(position: vec3) {
    if (!this.instanceBuffer) return;

    const vfxID = this.activesVFX.findIndex((v) => v === false);

    if (vfxID === -1) return;

    const offset = vfxID * PARTICLES_PER_VFX * this.dataSizePerInstance;

    for (let i = 0; i < PARTICLES_PER_VFX; i++) {
      // aInstancePosition (X, Y, Z)
      const a = Math.random() * Math.PI * 2
      const rad = 0.1 + Math.random() * 0.1
      this.instanceData[i * this.dataSizePerInstance + offset + 0] = position[0] + Math.sin(a) * rad;
      this.instanceData[i * this.dataSizePerInstance + offset + 1] = position[1];
      this.instanceData[i * this.dataSizePerInstance + offset + 2] = position[2] + Math.cos(a) * rad;

      // aInstanceStartPosition (X, Y, Z)
      this.instanceData[i * this.dataSizePerInstance + offset + 3] = Math.random() * 0.5 - 0.25;
      this.instanceData[i * this.dataSizePerInstance + offset + 4] = Math.random() * 0.5;
      this.instanceData[i * this.dataSizePerInstance + offset + 5] = Math.random() * 0.5 - 0.25;

      // aParams (Age, Force, Rotation)
      this.instanceData[i * this.dataSizePerInstance + offset + 6] = 0;
      this.instanceData[i * this.dataSizePerInstance + offset + 7] = Math.random() * 0.7 + 0.3;
      const r = Math.random() - 0.5;
      this.instanceData[i * this.dataSizePerInstance + offset + 8] = r > 0 ? r + 0.5 : r - 0.5;
    }

    this.instanceBuffer.data(this.instanceData);

    this.activesVFX[vfxID] = true;
    this.active = true;
  }

  render(ctx: RenderContext) {
    if (!this.active) return;

    this.cameraRight.set(ctx.camera._wmatrix[0], ctx.camera._wmatrix[1], ctx.camera._wmatrix[2]);
    this.cameraUp.set(ctx.camera._wmatrix[4], ctx.camera._wmatrix[5], ctx.camera._wmatrix[6]);

    for (let i = 0; i < MAX_SIMULTANEOUS_VFX; i++) {
      if (!this.activesVFX[i]) continue;
      for (let j = 0; j < PARTICLES_PER_VFX; j++) {
        const offset = i * PARTICLES_PER_VFX * this.dataSizePerInstance;
        this.instanceData[j * this.dataSizePerInstance + offset + 6] += Time.scaledDt * 0.0003;
        if (this.instanceData[j * this.dataSizePerInstance + offset + 6] >= 1) this.activesVFX[i] = false;
      }
    }

    this.active = this.activesVFX.some((v) => v === true);

    this.instanceBuffer.data(this.instanceData);

    super.render(ctx);
  }
}