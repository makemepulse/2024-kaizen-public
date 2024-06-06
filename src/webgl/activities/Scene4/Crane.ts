import Renderer from "@webgl/Renderer";
import { RenderContext } from "@webgl/core/Renderer";
import Lighting from "@webgl/engine/Lighting";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import GltfResource from "@webgl/resources/GltfResource";
import { mat4, quat, vec3 } from "gl-matrix";
import Gltf from "nanogl-gltf/lib/Gltf";
import Node from "nanogl-gltf/lib/elements/Node";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import GltfTypes from "nanogl-gltf/lib/types/GltfTypes";
import Material from "nanogl-pbr/Material";
import Trail from "../Trail/Trail";
import { clamp, mix, smoothstep } from "@webgl/math";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import { ISheet } from "@theatre/core";
import Time from "@webgl/Time";
import AnimationMixer from "@webgl/engine/AnimationMixer";
import { AnimationLayer } from "@webgl/engine/AnimationMixer";
import TextureAddChunk from "@webgl/glsl/textureAdd/TextureAddChunk";
import { StandardPass } from "nanogl-pbr/StandardPass";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";
import RenderMask from "@webgl/core/RenderMask";
import Scene4 from "./Scene4";

const V3_A = vec3.create();
const V3_B = vec3.create();

const ANIM_RANGE_FLY: [number, number] = [0, 56 / 60]
const ANIM_RANGE_ACCEL: [number, number] = [57 / 60, 117 / 60]

export const MAX_SPEED = 9;

export default class Crane {


  public sheetPerfect: ISheet
  public id: number

  jumpFactor = 0
  xAddRandom = 0
  yAddRandom = 0
  barrelRandom = 0
  forwardOffset = 0

  res: GltfResource;
  gltf: Gltf;

  craneNodePosition: vec3
  craneNode: Node
  trailNode: Node
  trailNodeLeft: Node
  trailNodeRight: Node
  trailscrollNode: Node
  craneStartPosition: vec3 = vec3.create();
  trailStartPosition: vec3 = vec3.create();
  trailNodeX: number;
  roll = { value: 0 }
  yNode = { value: 0 }
  xNode = { value: 0 }
  zNode = { value: 0 }
  yAdd: TheatreFloat
  xAdd: TheatreFloat
  zAdd: TheatreFloat
  barrelRoll: TheatreFloat

  destPoint: vec3 = vec3.create()
  vel: vec3 = vec3.create()

  u: number;
  v: number;
  vChange = 0;
  uChange = 0;

  moveSphere = 0.05 + 0.05 * Math.random()
  scaleSphere = 10 + (Math.random() * 2 - 1) * 2

  rotX = 0;
  targetRotX = 0;
  craneQuat: quat = quat.create()
  craneStartQuat: quat = quat.create()
  rollQuat: quat = quat.create()
  rollQuatLerp: quat = quat.create()

  pitchQuat: quat = quat.create()
  pitchQuatLerp: quat = quat.create()

  speed = 1

  trails: Trail[];

  cTexAddChunk: TextureAddChunk


  animationMixer: AnimationMixer
  flyAnimation: AnimationLayer
  accelAnimation: AnimationLayer

  animTime = Math.random()



  constructor(path: string, private renderer: Renderer, ambientChunk: AmbientAddChunk, tileAddChunk: TextureAddChunk, private hasTrail: boolean, private trailColor: vec3 = vec3.create()) {
    this.cTexAddChunk = new TextureAddChunk(renderer);
    this.cTexAddChunk.textureOpacityU.set(0.6)
    this.cTexAddChunk.textureRepeatU.set(0.1)
    // this.cTexAddChunk.backgroundInfluenceU.set(0.9)
    this.cTexAddChunk.textureLuminosityU.set(1)
    const materialOverride = new MaterialOverrideExtension();
    materialOverride.overridePass("", (ctx, mat) => {

      const pass = mat.getPass("color").pass as StandardPass<MetalnessSurface>;
      mat.getPass("color").pass.inputs.add(ambientChunk);
      // mat.getPass("color").pass.inputs.add(this.cTexAddChunk);

      // pass.alphaMode.set("OPAQUE");
      pass.mask = RenderMask.OPAQUE;
      pass.glconfig
        .enableBlend(false)
        .enableCullface(false)
        .depthMask(true)
      // mat.glconfig.enableCullface(false)
      // mat.glconfig.enableDepthTest(true)
      // mat.glconfig.depthMask(true)
      pass.surface.metalnessFactor.attachConstant(0.75);
      pass.surface.roughnessFactor.attachConstant(1);
      return null;
    });
    this.res = new GltfResource(path, renderer.gl, {
      defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [materialOverride],
    });

    /// #if DEBUG
    const f = Scene4.guiFolder.folder("Trail");
    f.addColor(this, "trailColor");
    /// #endif
  }

  async load() {
    return this.res.load();
  }

  onLoaded() {
    this.gltf = this.res.gltf;
    this.gltf.root.invalidate();
    this.gltf.root.updateWorldMatrix();
    this.craneNodePosition = vec3.create()
    this.craneNode = new Node()
    const skeletonNode = new Node()
    skeletonNode.setScale(0.06)
    skeletonNode.rotateY(Math.PI / 2)
    skeletonNode.add(this.gltf.getElementByName(GltfTypes.NODE, "root"));
    this.craneNode.add(skeletonNode)
    this.gltf.root.add(this.craneNode);
    vec3.copy(this.craneNodePosition, this.craneNode.position);
    this.trailNode = this.gltf.getElementByName(GltfTypes.NODE, "Feather.Top.Tail.002_end");
    this.trailNodeLeft = this.gltf.getElementByName(GltfTypes.NODE, "Arm.003.l_end");
    this.trailNodeRight = this.gltf.getElementByName(GltfTypes.NODE, "Arm.003.r_end");
    // this.trailscrollNode = this.gltf.getElementByName(GltfTypes.NODE, "scroll");
    vec3.copy(this.craneStartPosition, this.craneNode.position);
    vec3.copy(this.destPoint, this.craneNode.position);
    vec3.copy(this.trailStartPosition, this.trailNode.position);
    quat.copy(this.craneQuat, this.craneNode.rotation);
    quat.copy(this.craneStartQuat, this.craneNode.rotation);
    this.trailNodeX = 0;
    vec3.set(this.vel, 1.0, 0.0, 0.0);
    this.u = Math.random();
    this.v = Math.random();


    this.animationMixer = new AnimationMixer();

    const anim = this.gltf.animations[0];
    this.flyAnimation = new AnimationLayer(anim);
    this.accelAnimation = new AnimationLayer(anim);

    this.flyAnimation.range = ANIM_RANGE_FLY;
    this.accelAnimation.range = ANIM_RANGE_ACCEL;

    this.animationMixer.addLayer(this.flyAnimation);
    this.animationMixer.addLayer(this.accelAnimation);

  }

  start(
  ) {
    this.barrelRoll = new TheatreFloat(this.roll, this.sheetPerfect, `barrel roll ${this.id}`)
    this.xAdd = new TheatreFloat(this.xNode, this.sheetPerfect, `x add ${this.id}`)
    this.yAdd = new TheatreFloat(this.yNode, this.sheetPerfect, `y add ${this.id}`)
    this.zAdd = new TheatreFloat(this.zNode, this.sheetPerfect, `z add ${this.id}`)

    this.createTrails();
    this.renderer.scene.trailManager.renderAbove = true;
  }

  stop() {
    this.barrelRoll.dispose()
    this.yAdd.dispose()
    this.xAdd.dispose()
    this.zAdd.dispose()
    this.renderer.scene.trailManager.removeAll();
    this.renderer.scene.trailManager.renderAbove = false;

  }

  createTrails() {
    this.trails = [];
    if (!this.hasTrail) return;
    this.trails.push(this.renderer.scene.trailManager.addTrail(this.trailNode,
      {
        color: [1, 1, 1],
        trailDistance: 0,
        offset: [0, 0, 0],
        thickness: 0.8,
        drawImageFrameElapsed: 1,
        mixBorder: 1
      }));
    this.trails.push(this.renderer.scene.trailManager.addTrail(this.trailNodeLeft,
      {
        color: [1, 1, 1],
        trailDistance: 0,
        offset: [1, 1, 0],
        thickness: 0.8,
        drawImageFrameElapsed: 1,
        mixBorder: 1
      }));
    this.trails.push(this.renderer.scene.trailManager.addTrail(this.trailNodeRight,
      {
        color: [1, 1, 1],
        trailDistance: 0,
        offset: [1, 1, 0],
        thickness: 0.8,
        drawImageFrameElapsed: 1,
        mixBorder: 1
      }));

    // this.trails[0].trailChunk.offsetU.set(4, 4, 0);
    // this.trails[1].trailChunk.offsetU.set(4, 4, 0);
    // this.trails[2].trailChunk.offsetU.set(4, 4, 0);

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

  release(holdPercent = 1, dir = false) {
    this.jumpFactor = holdPercent;

    const r = Math.random();
    const barrelFactor = (Math.random() > 0.5 ? 1 : -1) * Math.ceil((r * 1.2) * Math.max(this.jumpFactor, 0.4));
    this.barrelRandom = barrelFactor * (Math.PI * 2);
    if (r < 0.1) this.barrelRandom = 0
    this.xAddRandom = -Math.random() * this.jumpFactor * 15;
    this.yAddRandom = (Math.random() * 2 - 1) * this.jumpFactor * 15;

    if (holdPercent > 0.95) {
      this.barrelRandom = (dir ? -1 : 1) * (Math.PI * 2);
      this.xAddRandom = 0//this.jumpFactor * 30;
      this.yAddRandom = 0//this.jumpFactor * 30;

    }
  }


  updateAnimation() {
    // const coord = this.renderer.pointers.primary.coord.viewport
    const x = smoothstep(MAX_SPEED - 0.5, MAX_SPEED, this.speed) * smoothstep(0.1, 0.3, this.v) * (1 - Math.abs(this.xNode.value));

    this.flyAnimation.weight = 1 - x;
    this.accelAnimation.weight = x;

    const t = this.animTime;
    this.flyAnimation.time = t;
    this.accelAnimation.time = t;

    this.animationMixer.evaluate();

  }

  preRender() {
    const anim = this.gltf.animations[0];
    this.animTime += Time.scaledDt / 1000 * clamp(this.speed * 0.2, 1, 2);
    anim.evaluate(this.animTime % anim.duration);

    this.cTexAddChunk.timeU.set(Time.time);


    this.updateAnimation()

    this.movePointOnSphere(V3_A, this.u, this.v);

    this.v = (Math.sin(this.vChange) + 1) * 0.5;
    this.u = (Math.sin(this.uChange) + 1) * 0.5;
    this.vChange += (0.01 + Math.random() * 0.05) * (this.moveSphere + smoothstep(6.5, 7, this.speed) * 0.05) * Math.min(3, this.speed);
    this.uChange += (0.01 + Math.random() * 0.05) * (this.moveSphere + smoothstep(6.5, 7, this.speed) * 0.05) * Math.min(3, this.speed);

    vec3.scale(V3_A, V3_A, this.scaleSphere);

    V3_A[1] += this.yNode.value * this.yAddRandom;
    V3_A[2] += this.xNode.value * this.xAddRandom;
    V3_A[0] += this.zNode.value * 60 * (1 - this.jumpFactor);

    vec3.add(V3_B, this.craneStartPosition, V3_A);

    vec3.copy(this.destPoint, V3_B);
    vec3.copy(V3_B, this.craneNodePosition);
    vec3.lerp(this.craneNodePosition, this.craneNodePosition, this.destPoint, 0.1);

    this.trailNodeX -= 0.05 + 0.15 * this.speed;

    const diff = V3_B[2] - this.craneNodePosition[2];
    const diffRad = clamp(-diff * Math.PI / 180 * 400, -0.6, 0.6);

    quat.identity(this.rollQuat);
    quat.rotateX(this.rollQuat, this.rollQuat, diffRad);
    quat.slerp(this.rollQuatLerp, this.rollQuatLerp, this.rollQuat, 0.1);

    const diffY = V3_B[1] - this.craneNodePosition[1];
    const diffPtichRad = clamp(-diffY * Math.PI / 180 * 50, -0.15, 0.15);

    quat.identity(this.pitchQuat);
    quat.rotateZ(this.pitchQuat, this.pitchQuat, diffPtichRad);
    quat.slerp(this.pitchQuatLerp, this.pitchQuatLerp, this.pitchQuat, 0.1);

    quat.copy(this.craneQuat, this.craneStartQuat);
    quat.rotateX(this.craneQuat, this.craneQuat, this.roll.value * this.barrelRandom);
    quat.mul(this.craneQuat, this.craneQuat, this.pitchQuatLerp);
    quat.mul(this.craneQuat, this.craneQuat, this.rollQuatLerp);
  }

  movePointOnSphere(out: vec3, u: number, v: number) {
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    out[0] = Math.sin(phi) * Math.cos(theta);
    out[1] = Math.sin(phi) * Math.sin(theta);
    out[2] = Math.cos(phi);
  }

  render(ctx: RenderContext): void {
    vec3.copy(this.craneNode.position, this.craneNodePosition);
    quat.copy(this.craneNode.rotation, this.craneQuat);
    if (this.id !== 0) this.craneNode.position[1] += this.id % 2 === 0 ? 10 : -10;
    this.craneNode.invalidate();
    this.craneNode.updateWorldMatrix();
    // this.trailNode.invalidate();
    // this.trailNode.updateWorldMatrix();
    // this.trailNodeLeft.invalidate();
    // this.trailNodeLeft.updateWorldMatrix();
    // this.trailNodeRight.invalidate();
    // this.trailNodeRight.updateWorldMatrix();
    this.gltf.root.invalidate();
    this.gltf.root.updateWorldMatrix();

    const speedEnd = smoothstep(MAX_SPEED - 2.5, MAX_SPEED, this.speed);
    const speedStart = smoothstep(6.5, 7.5, this.speed);
    // this.trails[0].trailChunk.colorU.set(
    //   clamp(r * 1.6, 0, 1),
    //   clamp(g * 1.6, 0, 1),
    //   clamp(b * 1.6, 0, 1));
    // this.trails[1].trailChunk.colorU.set(r, g, b);
    // this.trails[2].trailChunk.colorU.set(r, g, b);
    for (const trail of this.trails) {
      trail.trailChunk.alphaU.set(speedStart * 0.25 + speedEnd * 0.5);
      trail.trailChunk.thicknessU.set(1 + 1 * speedEnd);
      trail.trailChunk.colorU.set(this.trailColor[0], this.trailColor[1], this.trailColor[2]);
      // trail.trailChunk.alphaU.set(1);
      // trail.trailChunk.thicknessU.set(10);
    }

    for (const renderable of this.gltf.renderables) {
      renderable.render(this.renderer.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
    }
  }
}