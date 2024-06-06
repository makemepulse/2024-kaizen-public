import { Expo, Quart, gsap } from "gsap";
import Renderer from "@webgl/Renderer";
import { RenderContext } from "@webgl/core/Renderer";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import GltfResource from "@webgl/resources/GltfResource";
import { quat, vec3 } from "gl-matrix";
import Gltf from "nanogl-gltf/lib/Gltf";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import Node from "nanogl-node";
import { StandardPass } from "nanogl-pbr/StandardPass";
import { Uniform } from "nanogl-pbr/Input";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";

const NB_NODES = 3;

export default class Splashes {
  res: GltfResource;
  gltf: Gltf;

  time = 0

  positionStart = vec3.create()
  positionEnd = vec3.create()

  nodeStart: Node[]
  nodeEnd: Node[]
  timeLinesStart: GSAPTimeline[]
  timeLinesEnd: GSAPTimeline[]

  alphaUniform: Uniform;

  opacityStart: number[]
  opacityEnd: number[]

  timeStart = 0
  timeEnd = 0

  renderStart = false
  renderEnd = false

  constructor(private renderer: Renderer, ambientAdd: AmbientAddChunk) {
    const overrides = new MaterialOverrideExtension();

    // this.rippleChunk = new RipplesChunk();
    overrides.overridePass("", (ctx, material) => {
      const pass = material.getPass("color").pass as StandardPass<MetalnessSurface>;
      pass.inputs.add(ambientAdd);
      pass.surface.metalnessFactor.attachConstant(0);
      pass.surface.roughnessFactor.attachConstant(1);
      // pass.surface.baseColorFactor.attachConstant([0, 0, 0]);
      // pass.surface.baseColor.attachConstant([1, 1, 1]);
      this.alphaUniform = pass.alphaFactor.attachUniform();

      return pass;
    });

    this.res = new GltfResource("scene2/splash.glb", renderer.gl, {
      defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [overrides],
    });

    this.nodeStart = [];
    this.opacityStart = [];
    this.timeLinesStart = [];
    for (let i = 0; i < NB_NODES; i++) {
      this.nodeStart[i] = new Node()
      this.opacityStart[i] = 0

      this.timeLinesStart.push(this.makeTimeline(this.nodeStart[i], i, true));

    }

    this.nodeEnd = [];
    this.opacityEnd = [];
    this.timeLinesEnd = [];
    for (let i = 0; i < NB_NODES; i++) {
      this.nodeEnd[i] = new Node()
      this.opacityEnd[i] = 0
      this.timeLinesEnd.push(this.makeTimeline(this.nodeEnd[i], i, false));

    }

  }

  async load() {
    return Promise.all([this.res.load()]);
  }

  onLoaded() {
    this.gltf = this.res.gltf;
  }

  start() {

  }

  stop() {

  }

  async spawnStart(position: vec3) {
    this.renderStart = true;
    await this.spawn(this.nodeStart, position, true);
    this.renderStart = false;
  }

  async spawnEnd(position: vec3) {
    this.renderEnd = true;
    await this.spawn(this.nodeEnd, position, false);
    this.renderEnd = false;
  }

  spawn(node: Node[], fishPosition: vec3, isStart = false) {
    const promises = []
    for (const [i, n] of node.entries()) {
      vec3.copy(n.position, fishPosition);
      n.invalidate();
      n.updateWorldMatrix();
      if (isStart) promises.push(this.timeLinesStart[i].play(0));
      else promises.push(this.timeLinesEnd[i].play(0))
    }

    return Promise.all(promises);
  }

  makeTimeline(node: Node, i: number, isStart = false) {

    const timeline = gsap.timeline();
    const scaley = { s: 0.3, xz: 1, opacity: 1, r: 0 };
    timeline.fromTo(scaley, { s: 0.1, xz: 0.25 + i * 0.1, opacity: 1, r: i * 0.2 }, {
      s: 0.4 + i * 0.2, xz: 2 - i * 0.15, opacity: 0, r: Math.PI * 0.3 + i * 0.2, duration: 4, ease: Expo.easeOut, delay: i * 0.025, onUpdate: () => {
        node.scale[1] = scaley.s;
        node.scale[0] = scaley.xz;
        node.scale[2] = scaley.xz;
        quat.identity(node.rotation);
        quat.rotateY(node.rotation, node.rotation, scaley.r);
        if (isStart) this.opacityStart[i] = scaley.opacity
        else this.opacityEnd[i] = scaley.opacity;
        node.invalidate();
        node.updateWorldMatrix();
      }
    });

    return timeline
  }

  preRender() {
  }

  render(ctx: RenderContext) {
    if (this.renderStart) {
      for (const [i, n] of this.nodeStart.entries()) {
        vec3.copy(this.gltf.root.position, n.position);
        vec3.copy(this.gltf.root.scale, n.scale);
        quat.copy(this.gltf.root.rotation, n.rotation)
        this.gltf.root.invalidate();
        this.gltf.root.updateWorldMatrix();
        this.alphaUniform.set(this.opacityStart[i])
        for (const renderable of this.gltf.renderables) {
          renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
        }
      }
    }
    if (this.renderEnd) {
      for (const [i, n] of this.nodeEnd.entries()) {
        vec3.copy(this.gltf.root.position, n.position);
        vec3.copy(this.gltf.root.scale, n.scale);
        quat.copy(this.gltf.root.rotation, n.rotation)
        this.gltf.root.invalidate();
        this.gltf.root.updateWorldMatrix();
        this.alphaUniform.set(this.opacityEnd[i])
        for (const renderable of this.gltf.renderables) {
          renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
        }
      }
    }
  }
}