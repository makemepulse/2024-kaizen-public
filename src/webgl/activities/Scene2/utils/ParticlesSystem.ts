import { RenderContext } from "@webgl/core/Renderer";
import Gltf from "nanogl-gltf/lib/Gltf";
import Renderer from "@webgl/Renderer";
import Node from "nanogl-node";
import GltfResource from "@webgl/resources/GltfResource";
import Primitive from "nanogl-gltf/lib/elements/Primitive";
import { InstancingImpl } from "@webgl/core/Instancing";
import Capabilities from "@webgl/core/Capabilities";
import Program from "nanogl/program";
import GLArrayBuffer from "nanogl/arraybuffer";
import MeshRenderer from "nanogl-gltf/lib/renderer/MeshRenderer";
import Material from "nanogl-pbr/Material";
import GLState from "nanogl-state/GLState";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import RenderPass from "@webgl/core/RenderPass";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";

type InstanceAttribute = {
  name: string,
  size: number,
  type: number
}

type ChunkByPass = {
  chunk: Chunk,
  order: number,
  pass: RenderPass | null
}

export default class ParticlesSystem {
  res: GltfResource;
  gltf: Gltf;

  node: Node;
  renderables: MeshRenderer[] = [];
  primitives: Primitive[] = [];
  materials: Material[] = [];

  instancing: InstancingImpl;
  instanceData: Float32Array;
  instanceBuffer: GLArrayBuffer;

  private instanceAttributes: InstanceAttribute[] = [];
  protected dataSizePerInstance = 0;
  private chunks: ChunkByPass[] = [];

  active = false;

  constructor(
    private renderer: Renderer,
    ambientChunk: AmbientAddChunk,
    path: string,
    public count = 100,
    overrides: MaterialOverrideExtension = new MaterialOverrideExtension()
  ) {
    this.node = new Node();
    this.instancing = Capabilities(this.renderer.gl).instancing;

    this.res = new GltfResource(path, renderer.gl, {
      defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [overrides]
    });

    this.addChunk(new ParticlesChunk());
    this.addChunk(ambientChunk, -1, RenderPass.COLOR);

    this.addInstanceAttribute("aInstancePosition", 3, renderer.gl.FLOAT);
  }

  /**
   * Add a chunk to the instance's materials, call it before load.
   * By default, ParticlesChunk (adding aInstancePosition) and AmbientAddChunk are added.
   * @param chunk Chunk to add
   * @param order Order of the chunk, lower is first (please dont use numbers under -1, as it's used for AmbientAddChunk)
   * @param pass If the chunk is for a specific pass
   */
  addChunk(chunk: Chunk, order?: number, pass?: RenderPass) {
    const nextOrder = this.chunks.length ? this.chunks.reduce((max, c) => Math.max(max, c.order), 0) + 1 : 0;
    this.chunks.push({ chunk, order: (order !== undefined) ? order : nextOrder, pass });
  }

  /**
   * Add an instance attribute to the instance's materials, call it before load.
   * By default, the aInstancePosition vec3 is added.
   */
  addInstanceAttribute(name: string, size: number, type: number) {
    this.instanceAttributes.push({ name, size, type });
    this.dataSizePerInstance += size;
  }

  setupBuffer() {
    this.instanceData = new Float32Array(this.count * this.dataSizePerInstance);
    this.instanceBuffer = new GLArrayBuffer(
      this.renderer.gl,
      this.instanceData,
      this.renderer.gl.DYNAMIC_DRAW
    );
    for (const instanceAttribute of this.instanceAttributes) {
      this.instanceBuffer.attrib(instanceAttribute.name, instanceAttribute.size, instanceAttribute.type);
    }
  }

  async load() {
    return this.res.load();
  }

  onLoaded() {
    this.gltf = this.res.gltf;
    this.renderables = this.gltf.renderables;

    for (const renderable of this.renderables) {
      for (const primitive of renderable.mesh.primitives) {
        const material = primitive.material.createMaterialForPrimitive(this.gltf, null, primitive);

        for (const chunk of this.chunks.sort((a, b) => a.order - b.order)) {
          if (chunk.pass) {
            material.getPass(chunk.pass)?.pass.inputs.add(chunk.chunk);
          } else {
            material.inputs.add(chunk.chunk);
          }
        }
        
        this.primitives.push(primitive);
        this.materials.push(material);
      }
    }

    this.setupBuffer();
  }

  dispose(): void {
    this.instanceBuffer.dispose();
    this.active = false;
  }

  invalidate() {
    this.node.invalidate();
    this.node.updateWorldMatrix();
  }

  render(ctx: RenderContext): void {
    if (!this.primitives.length || !this.active) return;

    this.invalidate();

    const gl = this.renderer.gl;
    const glstate = GLState.get(gl);

    for (let i = 0; i < this.primitives.length; i++) {
      const primitive = this.primitives[i];
      const mat = this.materials[i];

      if (!mat.hasPass(ctx.pass) || (mat.mask & ctx.mask) === 0) return;

      const passInstance = mat.getPass(ctx.pass);

      if ((passInstance.pass.mask & ctx.mask) === 0) return;

      passInstance.prepare(this.node, ctx.camera);
      glstate.push(passInstance.pass.glconfig);
      mat.glconfig && glstate.push(mat.glconfig);
      ctx.glConfig && glstate.push(ctx.glConfig);

      glstate.apply();

      this.drawCall(passInstance.getProgram(), primitive);

      glstate.pop();
      mat.glconfig && glstate.pop();
      ctx.glConfig && glstate.pop();
    }
  }

  drawCall(prg: Program, sub: Primitive) {
    sub.bindVao(prg);

    this.instanceBuffer.attribPointer(prg);
    for (const instanceAttribute of this.instanceAttributes) {
      this.instancing.vertexAttribDivisor(prg[instanceAttribute.name](), 1);
    }

    this.instancing.drawElementsInstanced(
      this.renderer.gl.TRIANGLES,
      sub.indices.count,
      sub.indexBuffer.type,
      0,
      this.count
    );

    for (const instanceAttribute of this.instanceAttributes) {
      this.instancing.vertexAttribDivisor(prg[instanceAttribute.name](), 0);
    }
    sub.unbindVao();
  }
}


class ParticlesChunk extends Chunk {

  constructor() {
    super(true, false);
  }

  protected _genCode(slots: ChunksSlots): void {

    slots.add("pv", /*glsl*/`
    IN vec3 aInstancePosition;
    `);
    slots.add("vertex_warp", /*glsl*/`
    vertex.position += aInstancePosition;
    `);
  }
}