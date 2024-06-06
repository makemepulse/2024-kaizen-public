import Scene1 from "./Scene1";
import Time from "@webgl/Time";
import { vec4 } from "gl-matrix";
import Camera from "nanogl-camera";
import Program from "nanogl/program";
import Renderer from "@webgl/Renderer";
import Gltf from "nanogl-gltf/lib/Gltf";
import Material from "nanogl-pbr/Material";
import GLState from "nanogl-state/GLState";
import FlowerManager from "./FlowerManager";
import Lighting from "@webgl/engine/Lighting";
import GLArrayBuffer from "nanogl/arraybuffer";
import ZDepth from "@webgl/glsl/zdepth/ZDepth";
import RenderPass from "@webgl/core/RenderPass";
import Node from "nanogl-gltf/lib/elements/Node";
import Capabilities from "@webgl/core/Capabilities";
import { RenderContext } from "@webgl/core/Renderer";
import { StandardPass } from "nanogl-pbr/StandardPass";
import FlowerChunk from "./chunks/flowers/FlowerChunk";
import { InstancingImpl } from "@webgl/core/Instancing";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";
import Primitive from "nanogl-gltf/lib/elements/Primitive";
import TextureOffset from "./chunks/textureOffset/TextureOffset";
import AmbientAddChunkFog from "@webgl/glsl/ambientAdd/AmbientAddChunkFog";

export default class FlowerInstancing {
  nullList: any[];
  renderer: Renderer;
  instancing: InstancingImpl;

  instanceData: Float32Array;
  instanceBuffer: GLArrayBuffer;

  zDepth: ZDepth;
  instanceChunk: FlowerChunk;
  ambientChunk: AmbientAddChunkFog;

  primitives: Primitive[];

  material: Material;
  materials: Material[] = [];

  root: Node;

  ambientAdd = 1.0
  ambientAddAlpha = 0.35

  move = 0

  zDepthMaxDist = 135.0
  zDepthMinDist = 70.0

  instanceAttributeStride: number;
  instanceRandomOffset: Float32Array;
  instanceRandomOffsetBuffer: GLArrayBuffer;

  instanceRandomRotationFactor: Float32Array;
  instanceRandomRotationFactorBuffer: GLArrayBuffer;

  instanceIsLeftOrRight: Float32Array;
  instanceIsLeftOrRightBuffer: GLArrayBuffer;

  instanceRenderable: Float32Array;
  instanceRenderableBuffer: GLArrayBuffer;

  instanceScaleOffset: Float32Array;
  instanceScaleOffsetBuffer: GLArrayBuffer;

  flowerManager: FlowerManager;
  textureOffset: TextureOffset;

  constructor(renderer: Renderer, primitives: Primitive[], root: Node, FlowerManager: FlowerManager) {
    this.root = root;
    this.renderer = renderer;
    this.primitives = primitives;
    this.instancing = Capabilities(this.renderer.gl).instancing;

    this.flowerManager = FlowerManager;

    // Get trimmed list depending on extra data flowerRenderable is 0 or 1
    this.nullList = this.flowerManager.nullList;

    // Instancing buffers and data
    this.instanceAttributeStride = 4 * 4;

    this.instanceBuffer = new GLArrayBuffer(this.renderer.gl, null, this.renderer.gl.DYNAMIC_DRAW);

    this.instanceBuffer.attrib("aInstanceMatrix1", 4, this.renderer.gl.FLOAT)
      .attrib("aInstanceMatrix2", 4, this.renderer.gl.FLOAT)
      .attrib("aInstanceMatrix3", 4, this.renderer.gl.FLOAT)
      .attrib("aInstanceMatrix4", 4, this.renderer.gl.FLOAT);

    this.instanceData = new Float32Array(this.nullList.length * this.instanceAttributeStride);
    this.instanceBuffer.data(this.instanceData);

    this.instanceRandomOffset = new Float32Array(this.nullList.length);
    this.instanceRandomOffsetBuffer = new GLArrayBuffer(this.renderer.gl, null, this.renderer.gl.DYNAMIC_DRAW);

    this.instanceIsLeftOrRight = new Float32Array(this.nullList.length);
    this.instanceIsLeftOrRightBuffer = new GLArrayBuffer(this.renderer.gl, null, this.renderer.gl.DYNAMIC_DRAW);

    this.instanceRenderable = new Float32Array(this.nullList.length);
    this.instanceRenderableBuffer = new GLArrayBuffer(this.renderer.gl, null, this.renderer.gl.DYNAMIC_DRAW);

    this.instanceRandomRotationFactor = new Float32Array(this.nullList.length);
    this.instanceRandomRotationFactorBuffer = new GLArrayBuffer(this.renderer.gl, null, this.renderer.gl.DYNAMIC_DRAW);

    this.instanceScaleOffset = new Float32Array(this.nullList.length);
    this.instanceScaleOffsetBuffer = new GLArrayBuffer(this.renderer.gl, null, this.renderer.gl.DYNAMIC_DRAW);

    for (let i = 0; i < this.nullList.length; i++) {
      this.instanceRandomOffset[i] = this.nullList[i].extras.randomOffset;
      this.instanceRandomRotationFactor[i] = this.nullList[i].extras.randomOffsetRotation;

      // Check if the flower is on the left or right of the path
      const flowerXPos = this.nullList[i].position[0];
      const flowerZPos = this.nullList[i].position[2];
      const flowerZPosNormalized = 1-(((flowerZPos + 80) / 160));

      const isLeftOrRight = flowerXPos > this.flowerManager.catmullRom.getPoint(flowerZPosNormalized)[0] ? 1 : -1;
      this.nullList[i].extras.isLeftOrRight = isLeftOrRight;
      this.instanceIsLeftOrRight[i] = this.nullList[i].extras.isLeftOrRight;

      this.instanceRenderable[i] = this.nullList[i].extras.flowerRenderable;
      this.instanceScaleOffset[i] = this.nullList[i].extras.offsetScale;
    }

    this.instanceRandomOffsetBuffer.data(this.instanceRandomOffset);
    this.instanceRandomOffsetBuffer.attrib("aRandomOffset", 1, this.renderer.gl.FLOAT);
    
    this.instanceIsLeftOrRightBuffer.data(this.instanceIsLeftOrRight);
    this.instanceIsLeftOrRightBuffer.attrib("aIsLeftOrRight", 1, this.renderer.gl.FLOAT);

    this.instanceRandomRotationFactorBuffer.data(this.instanceRandomRotationFactor);
    this.instanceRandomRotationFactorBuffer.attrib("aRandomRotationFactor", 1, this.renderer.gl.FLOAT);

    this.instanceRenderableBuffer.data(this.instanceRenderable);
    this.instanceRenderableBuffer.attrib("aRenderable", 1, this.renderer.gl.FLOAT);

    this.instanceScaleOffsetBuffer.data(this.instanceScaleOffset);
    this.instanceScaleOffsetBuffer.attrib("aScaleOffset", 1, this.renderer.gl.FLOAT);

    // Instancing chunks
    this.instanceChunk = new FlowerChunk();
    this.ambientChunk = new AmbientAddChunkFog();
    this.zDepth = new ZDepth();

    this.zDepth.maxDistUniform.set(this.zDepthMaxDist);
    this.zDepth.minDistUniform.set(this.zDepthMinDist);
    this.ambientChunk.maxDistUniform.set(120.0);
    this.ambientChunk.minDistUniform.set(70.0);
    this.ambientChunk.ambientAddUniform.set(this.ambientAdd);

    this.renderer.clearColor = vec4.fromValues(1.0, 0.81, 0.6, 1);

    /// #if DEBUG
    const folder = Scene1.guiFolder.folder("Flower ");
    folder.range(this, "ambientAdd", 0, 4).onChange(() => this.ambientChunk.ambientAddUniform.set(this.ambientAdd));

    const fld = folder.folder("ZDepth ");

    const o1 = { maxDist: 135.0, minDist: 70.0, isFogEnabled: true, alphaMultiplier: 1, bottomFade: 2, topFade: 20};
    fld.add(o1, "maxDist", { min: 0, max: 230 }).onChange((v) => {
      this.zDepth.maxDistUniform.set(v);
      this.ambientChunk.maxDistUniform.set(v);
    });
    fld.add(o1, "minDist", { min: 0, max: 200 }).onChange((v) => {
      this.zDepth.minDistUniform.set(v);
      this.ambientChunk.minDistUniform.set(v);
    });

    fld.add(o1, "isFogEnabled").onChange((v) => {
      this.zDepth.isFogEnabledUniform.set(v ? 1 : 0);
    });

    fld.add(o1, "bottomFade", { min: 0, max: 10 }).onChange((v) => {
      this.zDepth.bottomFadeUniform.set(v);
    });

    fld.add(o1, "topFade", { min: 0, max: 50 }).onChange((v) => {
      this.zDepth.topFadeUniform.set(v);
    });

    const folderWindEffect = folder.folder("Wind Effect");
    const wind = { radius: 50.0, x: 0, y: 13, z: 66 };
    folderWindEffect.range(wind, "radius", 1, 100).setLabel("Radius Wind Effect").onChange(() => {
      this.instanceChunk.uRadiusUniform.set(wind.radius);
    });
    folderWindEffect.add(wind, "x", { min: -50, max: 50 }).onChange(() => {
      this.instanceChunk.uMousePosUniform.set(wind.x, wind.y, wind.z);
    });
    folderWindEffect.add(wind, "y", { min: 0, max: 25 }).onChange(() => {
      this.instanceChunk.uMousePosUniform.set(wind.x, wind.y, wind.z);
    });
    folderWindEffect.add(wind, "z", { min: -80, max: 80 }).onChange(() => {
      this.instanceChunk.uMousePosUniform.set(wind.x, wind.y, wind.z);
    });

    const scaleEffect = folder.folder("Scale Effect");
    const scale = { maxDistScale: 90.0, minDistScale: 190.0 };
    scaleEffect.range(scale, "maxDistScale", 0, 300).onChange(() => {
      this.instanceChunk.maxDistScaleUniform.set(scale.maxDistScale);
    });
    scaleEffect.range(scale, "minDistScale", 0, 300).onChange(() => {
      this.instanceChunk.minDistScaleUniform.set(scale.minDistScale);
    });
    /// #endif
  }

  setupMaterial(gltf: Gltf, lighting: Lighting) {
    for (const primitive of this.primitives) {
      this.material = primitive.material.createMaterialForPrimitive(gltf, null, primitive);
      const pass = this.material.getPass(RenderPass.COLOR).pass as StandardPass<MetalnessSurface>;

      this.textureOffset = new TextureOffset(pass);
      pass.inputs._chunks.unshift(this.textureOffset);
      pass.inputs.invalidateList();
      this.material.getPass("color").pass.inputs.add(this.textureOffset);

      this.material.inputs.add(this.instanceChunk);
      
      this.material.getPass("color").pass.inputs.add(this.zDepth);
      this.material.getPass("color").pass.inputs.add(this.ambientChunk);

      pass.glconfig
        .depthMask(true);
      this.materials.push(this.material);
      // lighting.setupMaterial(this.material);
    }
  }

  preRender(cam: Camera): void {
    this.flowerManager.preRender(this.renderer);
    this.instanceChunk.uTimeUniform.set(Time.scaledTime);
    this.zDepth.zDepthCameraPos.set(cam._wposition[0], cam._wposition[1], cam._wposition[2]);
    this.ambientChunk.cameraPosUniform.set(cam._wposition[0], cam._wposition[1], cam._wposition[2]);
    this.instanceChunk.cameraPosUniform.set(cam._wposition[0], cam._wposition[1], cam._wposition[2]);
  }

  render(ctx: RenderContext): void {
    //Instancing
    let count = 0;
    for (const nullInstance of this.nullList) {
      const mat = nullInstance._matrix;
      this.instanceData.set([mat[0], mat[1], mat[2], mat[3]], count * this.instanceAttributeStride + 0);
      this.instanceData.set([mat[4], mat[5], mat[6], mat[7]], count * this.instanceAttributeStride + 4);
      this.instanceData.set([mat[8], mat[9], mat[10], mat[11]], count * this.instanceAttributeStride + 8);
      this.instanceData.set([mat[12], mat[13], mat[14], mat[15]], count * this.instanceAttributeStride + 12);

      this.instanceScaleOffset[count] = nullInstance.extras.offsetScale;
      this.instanceRandomOffset[count] = nullInstance.extras.randomOffset;
      this.instanceRenderable[count] = nullInstance.extras.flowerRenderable;
      this.instanceIsLeftOrRight[count] = nullInstance.extras.isLeftOrRight;
      this.instanceRandomRotationFactor[count] = nullInstance.extras.randomOffsetRotation;
      count++;
    }

    this.instanceBuffer.data(this.instanceData);
    this.instanceRenderableBuffer.data(this.instanceRenderable);
    this.instanceScaleOffsetBuffer.data(this.instanceScaleOffset);
    this.instanceRandomOffsetBuffer.data(this.instanceRandomOffset);
    this.instanceIsLeftOrRightBuffer.data(this.instanceIsLeftOrRight);
    this.instanceRandomRotationFactorBuffer.data(this.instanceRandomRotationFactor);

    const gl = this.renderer.gl;
    const glstate = GLState.get(gl);

    for (let i = 0; i < this.primitives.length; i++) {
      const primitive = this.primitives[i];
      const mat = this.materials[i];

      if (!mat.hasPass(ctx.pass) || (mat.mask & ctx.mask) === 0) return;

      const passInstance = mat.getPass(ctx.pass);

      if ((passInstance.pass.mask & ctx.mask) === 0) return;

      passInstance.prepare(this.root, ctx.camera);
      glstate.push(passInstance.pass.glconfig);
      mat.glconfig && glstate.push(mat.glconfig);
      ctx.glConfig && glstate.push(ctx.glConfig);

      glstate.apply();

      this.drawCall(ctx.camera, passInstance.getProgram(), primitive);

      glstate.pop();
      this.material.glconfig && glstate.pop();
      ctx.glConfig && glstate.pop();
    }
  }

  drawCall(camera: Camera, prg: Program, sub: Primitive) {
    sub.bindVao(prg);
    this.instanceBuffer.attribPointer(prg);
    this.instancing.vertexAttribDivisor(prg.aInstanceMatrix1(), 1);
    this.instancing.vertexAttribDivisor(prg.aInstanceMatrix2(), 1);
    this.instancing.vertexAttribDivisor(prg.aInstanceMatrix3(), 1);
    this.instancing.vertexAttribDivisor(prg.aInstanceMatrix4(), 1);

    this.instanceRenderableBuffer.attribPointer(prg);
    this.instanceRandomOffsetBuffer.attribPointer(prg);
    this.instanceIsLeftOrRightBuffer.attribPointer(prg);
    this.instanceRandomRotationFactorBuffer.attribPointer(prg);
    this.instanceScaleOffsetBuffer.attribPointer(prg);
    this.instancing.vertexAttribDivisor(prg.aRenderable(), 1);
    this.instancing.vertexAttribDivisor(prg.aRandomOffset(), 1);
    this.instancing.vertexAttribDivisor(prg.aIsLeftOrRight(), 1);
    this.instancing.vertexAttribDivisor(prg.aRandomRotationFactor(), 1);
    this.instancing.vertexAttribDivisor(prg.aScaleOffset(), 1);

    this.instancing.drawElementsInstanced(
      this.renderer.gl.TRIANGLES,
      sub.indices.count,
      sub.indexBuffer.type,
      0,
      this.nullList.length
    );
    sub.unbindVao();
  }
}