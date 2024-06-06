import Scene1 from "./Scene1";
import Time from "@webgl/Time";
import Trail from "../Trail/Trail";
import { mat4, quat, vec3 } from "gl-matrix";
import Renderer from "@webgl/Renderer";
import { ISheet } from "@theatre/core";
import Gltf from "nanogl-gltf/lib/Gltf";
import { smoothstep } from "@webgl/math";
import Material from "nanogl-pbr/Material";
import FlowerManager from "./FlowerManager";
import Lighting from "@webgl/engine/Lighting";
import type { Sampler } from "nanogl-pbr/Input";
import Node from "nanogl-gltf/lib/elements/Node";
import { RenderContext } from "@webgl/core/Renderer";
import { BUTTERFLY_OFFSET, ORIGIN } from "./constants";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import { StandardPass } from "nanogl-pbr/StandardPass";
import GltfTypes from "nanogl-gltf/lib/types/GltfTypes";
import GltfResource from "@webgl/resources/GltfResource";
import type { MetalnessSurface } from "nanogl-pbr/PbrSurface";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import AnimationMixer, { AnimationLayer } from "@webgl/engine/AnimationMixer";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";

const path = "butterfly/butterfly3.gltf";

const V3A = vec3.create();
const V3B = vec3.create();
const V3C = vec3.create();

export default class Butterfly {
  public node: Node;
  private gltf: Gltf;
  private subNode: Node;
  private subParent: Node;
  private resource: GltfResource;

  private renderer: Renderer;
  public sheetPerfect: ISheet;
  public sheetSuccess: ISheet;

  public sheetPerfectVariants: ISheet[] = [];

  private flowerManager: FlowerManager;

  private mousePosition = { x: 0, y: 0 } as { x: number; y: number };
  private initialPosition: vec3 = vec3.create();

  // Theatre animations
  private butterFlyAnimCoeff: TheatreFloat;
  private butterflyYawTheatre: TheatreFloat;
  private butterflyAnimPerfect: TheatreFloat;
  private butterflyAnimSuccess: TheatreFloat;
  private butterflyRollTheatre: TheatreFloat;
  private butterflyYawMTheatre: TheatreFloat;
  private butterFlyAnimPerfectS: TheatreFloat;
  private butterflyAnimPerfectM: TheatreFloat;
  private butterflyAnimPerfectL: TheatreFloat;
  private butterflyPitchTheatre: TheatreFloat;
  private butterflyRollMTheatre: TheatreFloat;
  private butterflyRollSTheatre: TheatreFloat;
  private butterflyPitchMTheatre: TheatreFloat;
  private butterflyAnimationGLTFL: TheatreFloat;
  private butterflyAnimationGLTFM: TheatreFloat;
  private butterflyAnimationGLTFS: TheatreFloat;
  private butterflyStraightTheatre: TheatreFloat;
  private butterflyAnimationGLTFBasic: TheatreFloat;
  private butterflyXOffsetValueTheatre: TheatreFloat;
  private butterflyYOffsetValueTheatre: TheatreFloat;
  private butterflyZOffsetValueTheatre: TheatreFloat;
  private butterflyXOffsetValueMTheatre: TheatreFloat;
  private butterflyYOffsetValueMTheatre: TheatreFloat;
  private butterflyZOffsetValueMTheatre: TheatreFloat;
  private butterflyZOffsetValueSTheatre: TheatreFloat;

  // Theatre values
  private butterflyCoeff = { value: 0 };
  private butterflyYValue = { value: 0 };
  private butterflyPerfectS = { value: 0 };
  private butterflyPerfectM = { value: 0 };
  private butterflyPerfectL = { value: 0 };
  private butterflyStraight = { value: 0 };
  private butterflyAnimGLTFL = { value: 0 };
  private butterflyAnimGLTFBasic = { value: 0 };
  private butterflyPitch = { value: 0 };
  private butterflyYaw = { value: 0 };
  private butterflyRoll = { value: 0 };
  private butterflyOffsetX = { value: 0 };
  private butterflyOffsetY = { value: 0 };
  private butterflyOffsetZ = { value: 0 };
  private trailCoeff = { value: 0 };

  private endVector: vec3 = vec3.create();
  private originVector: vec3 = vec3.create();
  private lookAtTarget: vec3 = vec3.create();
  private directionVector: vec3 = vec3.create();
  private positionTargetVec: vec3 = vec3.create();
  private positionSubTargetVec: vec3 = vec3.create();
  private butterflyLookAt: vec3 = vec3.create();
  private butterflyPosition: vec3 = vec3.create();
  private butterflyRotation: quat = quat.create();
  private butterflySubLookAt: vec3 = vec3.create();
  private butterflyBarrelRoll: quat = quat.create();
  private butterflySubPosition: vec3 = vec3.create();
  private butterflySubStartPositon: vec3 = vec3.create();

  // Trail
  private trail: Trail
  private trail2: Trail

  private animationMixer: AnimationMixer
  private flyFastAnimation: AnimationLayer;
  private flySlowAnimation: AnimationLayer;
  private accelAnimation: AnimationLayer;

  private trailCoeffSuccess: TheatreFloat;

  private heightValue = 0;

  private u: number;
  private v: number;
  private vChange = 0;
  private uChange = 0;

  private moveSphere = 0.05 + 0.05 * Math.random();
  private scaleSphere = 1 + (Math.random() * 2 - 1) * 2;

  private jumpFactor = 0;
  private xAmplitude = 0;
  private yAmplitude = 0;
  private barrelRandom = 0;
  private rollDirection = 1;

  private nodeM4: mat4 = mat4.create();
  private parentM4: mat4 = mat4.create();
  private subM4: mat4 = mat4.create();

  constructor() { }

  async load(renderer: Renderer, flowerManager: FlowerManager): Promise<any> {

    this.renderer = renderer;

    this.flowerManager = flowerManager;

    const overrides = new MaterialOverrideExtension();

    overrides.overridePass("", (ctx, mat) => {
      const pass = mat.getPass("color").pass as StandardPass<MetalnessSurface>;
      const amb = new AmbientAddChunk();
      amb.ambientAddUniform.set(0.3);
      pass.inputs.add(amb);
      // pass.alphaMode.set("BLEND");
      // pass.mask = RenderMask.BLENDED;
      pass.emissive.attach(pass.surface.baseColor.param as Sampler);
      pass.emissiveFactor.attachConstant(.3);
      pass.surface.roughnessFactor.attachConstant(1);
      pass.surface.metalnessFactor.attachConstant(0);
      // pass.glconfig
      //   .enableBlend()
      //   .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA);
      return null;
    });

    this.resource = new GltfResource(path, this.renderer.gl, {
      defaultTextureFilter: this.renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [overrides],
    });

    this.gltf = await this.resource.load();

    this.node = this.gltf.getNode("Parent");
    this.subParent = this.gltf.getNode("SubParent");
    this.subNode = this.gltf.getNode("SubSubParent");

    const skeleton = this.gltf.getNode("Armature");
    skeleton.rotateX(-Math.PI / 2);

    this.node.setScale(1.5);
    this.node.updateMatrix();
    mat4.copy(this.nodeM4, this.node._matrix);
    this.subParent.updateMatrix();
    mat4.copy(this.parentM4, this.subParent._matrix);
    this.subNode.updateMatrix();
    mat4.copy(this.subM4, this.subNode._matrix);

    this.animationMixer = new AnimationMixer();

    const anim = this.gltf.animations[0];
    this.flyFastAnimation = new AnimationLayer(anim);
    this.flySlowAnimation = new AnimationLayer(anim);
    this.accelAnimation = new AnimationLayer(anim);

    this.flyFastAnimation.range = [0, 50 / 60];
    this.flySlowAnimation.range = [52 / 60, 101 / 60];
    this.accelAnimation.range = [102 / 60, 340 / 60];

    this.animationMixer.addLayer(this.flyFastAnimation);
    this.animationMixer.addLayer(this.flySlowAnimation);
    this.animationMixer.addLayer(this.accelAnimation);

    this.onLoaded();
  }

  onLoaded(): void {
    this.u = Math.random();
    this.v = Math.random();
  }

  unload(): void { }

  paneSetup() {
    /// #if DEBUG
    const f = Scene1.guiFolder.folder("Butterfly");
    this.trail.trailChunk.alphaU.set(0.5);
    this.trail2.trailChunk.alphaU.set(0.6);

    const PARAMS = {
      trailLeftColor: this.trail.trailChunk.colorU.value,
      trailRightColor: this.trail2.trailChunk.colorU.value,
      trailLeftAlpha: 0,
      trailRightAlpha: 1,
      trailLeftOffset: this.trail.trailChunk.offsetU.value,
      trailRightOffset2: this.trail2.trailChunk.offsetU.value,
    };

    f.addColor(PARAMS, "trailLeftColor");
    f.addColor(PARAMS, "trailRightColor");
    f.add(PARAMS, "trailLeftAlpha", { min: 0, max: 1 }).onChange((v) => { this.trail.trailChunk.alphaU.set(v); });
    f.add(PARAMS, "trailRightAlpha", { min: 0, max: 1 }).onChange((v) => { this.trail2.trailChunk.alphaU.set(v); });

    this.trail.trailChunk.offsetU.set(0, -2, 20);
    this.trail2.trailChunk.offsetU.set(0, -2, 20);
    /// #endif
  }

  onMouseMove = (e: MouseEvent) => {
    this.mousePosition.x = e.clientX;
    this.mousePosition.y = e.clientY;
  };

  setupLighting(lighting: Lighting) {
    lighting.lightSetup.prepare(this.renderer.gl);
    const materials = [] as Material[];
    for (const renderable of this.gltf.renderables) {
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

  start() {
    this.endVector = vec3.create();
    this.originVector = vec3.create();
    this.lookAtTarget = vec3.create();
    this.directionVector = vec3.create();
    this.positionTargetVec = vec3.create();
    this.positionSubTargetVec = vec3.create();
    this.butterflyLookAt = vec3.create();
    this.butterflyPosition = vec3.create();
    this.butterflyRotation = quat.create();
    this.butterflySubLookAt = vec3.create();
    this.butterflyBarrelRoll = quat.create();
    this.butterflySubPosition = vec3.create();
    this.butterflySubStartPositon = vec3.create();
    this.node.setMatrix(this.nodeM4);
    this.node.updateMatrix();
    this.subParent.setMatrix(this.parentM4);
    this.subParent.updateMatrix();
    this.subNode.setMatrix(this.subM4);
    this.subNode.updateMatrix();


    this.createTrails();
    this.renderer.scene.trailManager.renderAbove = true;
    this.butterflyYValue.value = this.node.position[1];
    this.node.position[2] = ORIGIN + BUTTERFLY_OFFSET;

    vec3.copy(this.butterflyPosition, this.node.position);
    vec3.copy(this.butterflySubPosition, this.subParent.position);
    vec3.copy(this.butterflySubLookAt, this.node.position);
    vec3.copy(this.butterflyLookAt, vec3.fromValues(this.flowerManager.xPostButterflyLookAt, this.node.position[1], this.node.position[2] - 2));

    // Theatre animations
    this.trailCoeffSuccess = new TheatreFloat(this.trailCoeff, this.sheetSuccess, "Trail Coeff");
    this.butterflyAnimPerfect = new TheatreFloat(this.butterflyYValue, this.sheetPerfect, "Butterfly");
    this.butterflyAnimSuccess = new TheatreFloat(this.butterflyYValue, this.sheetSuccess, "Butterfly");
    this.butterFlyAnimCoeff = new TheatreFloat(this.butterflyCoeff, this.sheetSuccess, "ButterflyCoeff");
    this.butterflyYawTheatre = new TheatreFloat(this.butterflyYaw, this.sheetPerfectVariants[2], "ButterflyYaw");
    this.butterflyYawMTheatre = new TheatreFloat(this.butterflyYaw, this.sheetPerfectVariants[1], "ButterflyYaw");
    this.butterflyRollTheatre = new TheatreFloat(this.butterflyRoll, this.sheetPerfectVariants[2], "ButterflyRoll");
    this.butterflyRollMTheatre = new TheatreFloat(this.butterflyRoll, this.sheetPerfectVariants[1], "ButterflyRoll");
    this.butterflyRollSTheatre = new TheatreFloat(this.butterflyRoll, this.sheetPerfectVariants[0], "ButterflyRoll");
    this.butterflyStraightTheatre = new TheatreFloat(this.butterflyStraight, this.sheetSuccess, "ButterflyStraight");
    this.butterflyPitchTheatre = new TheatreFloat(this.butterflyPitch, this.sheetPerfectVariants[2], "ButterflyPitch");
    this.butterflyPitchMTheatre = new TheatreFloat(this.butterflyPitch, this.sheetPerfectVariants[1], "ButterflyPitch");
    this.butterflyAnimationGLTFL = new TheatreFloat(this.butterflyAnimGLTFL, this.sheetPerfectVariants[2], "ButterflyGLTF");
    this.butterflyAnimationGLTFM = new TheatreFloat(this.butterflyAnimGLTFL, this.sheetPerfectVariants[1], "ButterflyGLTF");
    this.butterflyAnimationGLTFS = new TheatreFloat(this.butterflyAnimGLTFL, this.sheetPerfectVariants[0], "ButterflyGLTF");
    this.butterflyAnimationGLTFBasic = new TheatreFloat(this.butterflyAnimGLTFBasic, this.sheetSuccess, "ButterflyGLTFBasic");
    this.butterFlyAnimPerfectS = new TheatreFloat(this.butterflyPerfectS, this.sheetPerfectVariants[0], "Butterfly Perfect S");
    this.butterflyAnimPerfectM = new TheatreFloat(this.butterflyPerfectM, this.sheetPerfectVariants[1], "Butterfly Perfect M");
    this.butterflyAnimPerfectL = new TheatreFloat(this.butterflyPerfectL, this.sheetPerfectVariants[2], "Butterfly Perfect L");
    this.butterflyXOffsetValueTheatre = new TheatreFloat(this.butterflyOffsetX, this.sheetPerfectVariants[2], "ButterflyXOffset");
    this.butterflyYOffsetValueTheatre = new TheatreFloat(this.butterflyOffsetY, this.sheetPerfectVariants[2], "ButterflyYOffset");
    this.butterflyZOffsetValueTheatre = new TheatreFloat(this.butterflyOffsetZ, this.sheetPerfectVariants[2], "ButterflyZOffset");
    this.butterflyXOffsetValueMTheatre = new TheatreFloat(this.butterflyOffsetX, this.sheetPerfectVariants[1], "ButterflyXOffset");
    this.butterflyYOffsetValueMTheatre = new TheatreFloat(this.butterflyOffsetY, this.sheetPerfectVariants[1], "ButterflyYOffset");
    this.butterflyZOffsetValueMTheatre = new TheatreFloat(this.butterflyOffsetZ, this.sheetPerfectVariants[1], "ButterflyZOffset");
    this.butterflyZOffsetValueSTheatre = new TheatreFloat(this.butterflyOffsetZ, this.sheetPerfectVariants[0], "ButterflyZOffset");

    vec3.copy(this.initialPosition, this.node.position);
    this.node.invalidate();
    this.node.updateWorldMatrix();

    /// #if DEBUG
    this.paneSetup();
    /// #endif
  }

  stop() {
    this.trailCoeffSuccess?.dispose();
    this.butterFlyAnimCoeff?.dispose();
    this.butterflyYawTheatre?.dispose();
    this.butterflyAnimPerfect?.dispose();
    this.butterflyAnimSuccess?.dispose();
    this.butterflyRollTheatre?.dispose();
    this.butterflyYawMTheatre?.dispose();
    this.butterFlyAnimPerfectS?.dispose();
    this.butterflyAnimPerfectM?.dispose();
    this.butterflyAnimPerfectL?.dispose();
    this.butterflyPitchTheatre?.dispose();
    this.butterflyRollMTheatre?.dispose();
    this.butterflyRollSTheatre?.dispose();
    this.butterflyPitchMTheatre?.dispose();
    this.butterflyAnimationGLTFL?.dispose();
    this.butterflyAnimationGLTFM?.dispose();
    this.butterflyAnimationGLTFS?.dispose();
    this.butterflyStraightTheatre?.dispose();
    this.butterflyAnimationGLTFBasic?.dispose();
    this.butterflyYOffsetValueTheatre?.dispose();
    this.butterflyZOffsetValueTheatre?.dispose();
    this.butterflyXOffsetValueTheatre?.dispose();
    this.butterflyXOffsetValueMTheatre?.dispose();
    this.butterflyYOffsetValueMTheatre?.dispose();
    this.butterflyZOffsetValueMTheatre?.dispose();
    this.butterflyZOffsetValueSTheatre?.dispose();
    this.renderer.scene.trailManager.removeAll();
    this.renderer.scene.trailManager.renderAbove = false;
  }

  release(holdPercent = 1) {
    this.jumpFactor = holdPercent;
    this.barrelRandom = 1;
    this.xAmplitude = (Math.random() * 1) + 0.75;
    this.yAmplitude = (Math.random() * 0.5) + 0.75;
    this.rollDirection = Math.floor(Math.random() * 2) === 0 ? -1 : 1;
  }

  createTrails() {
    this.trail = this.renderer.scene.trailManager.addTrail(this.gltf.getElementByName(GltfTypes.NODE, "trail1"),
      {
        color: [1.000, 0.97, 0.91],
        trailDistance: 3,
        offset: [0, 0, 0],
        thickness: 2,
        drawImageFrameElapsed: 1,
        mixBorder: 1
      });

    this.trail2 = this.renderer.scene.trailManager.addTrail(this.gltf.getElementByName(GltfTypes.NODE, "trail2"),
      {
        color: [1.000, 0.97, 0.91],
        trailDistance: 3,
        offset: [0, 0, 0],
        thickness: 2,
        drawImageFrameElapsed: 1,
        mixBorder: 1
      });

    this.trail.trailChunk.alphaU.set(0.5);
    this.trail2.trailChunk.alphaU.set(0.5);

    this.trail.trailChunk.offsetU.set(0, -2, 20);
    this.trail2.trailChunk.offsetU.set(0, -2, 20);
  }

  updateAnimation() {
    const x = this.butterflyAnimGLTFL.value + this.butterflyAnimGLTFBasic.value;

    this.flyFastAnimation.weight = 1 - x * 0.3;
    this.flySlowAnimation.weight = 0;
    this.accelAnimation.weight = x;

    const t = (Time.time / 1000);
    this.flyFastAnimation.time = t;
    this.flySlowAnimation.time = t;
    this.accelAnimation.time = t;

    this.animationMixer.evaluate();
  }

  preRender(): void {
    // Update GLTF animations
    this.updateAnimation();

    // Add randomness to the butterfly movement
    this.movePointOnSphere(V3B, this.u, this.v);

    this.v = (Math.sin(this.vChange) + 1) * 0.5;
    this.u = (Math.sin(this.uChange) + 1) * 0.5;
    this.vChange += (0.1 + Math.random() * 0.5) * (this.moveSphere + smoothstep(6.5, 7, this.flowerManager.speed.value) * 0.5) * Math.min(3, this.flowerManager.speed.value);
    this.uChange += (0.1 + Math.random() * 0.5) * (this.moveSphere + smoothstep(6.5, 7, this.flowerManager.speed.value) * 0.5) * Math.min(3, this.flowerManager.speed.value);
    vec3.scale(V3B, V3B, this.scaleSphere);

    vec3.add(V3C, this.butterflySubStartPositon, V3B);

    vec3.set(this.positionSubTargetVec, V3C[0] + this.butterflyOffsetX.value * this.xAmplitude * this.rollDirection, V3C[1] + this.butterflyOffsetY.value * this.yAmplitude, V3C[2] * 0.1 + this.butterflyOffsetZ.value);
    vec3.lerp(this.butterflySubPosition, this.butterflySubPosition, this.positionSubTargetVec, 0.002 * Time.scaledDt);
    this.subParent.position.set(this.butterflySubPosition);

    this.subParent.invalidate();
    this.subParent.updateWorldMatrix();

    // Lerp position
    vec3.copy(this.originVector, this.node.position);
    this.heightValue = this.butterflyYValue.value + this.butterflyPerfectS.value + this.butterflyPerfectM.value + this.butterflyPerfectL.value;
    vec3.set(this.positionTargetVec, this.flowerManager.xPosButterfly * (1 - this.butterflyStraight.value), this.heightValue, this.node.position[2]);
    vec3.lerp(this.butterflyPosition, this.butterflyPosition, this.positionTargetVec, 0.002 * Time.scaledDt);
    this.node.position.set(this.butterflyPosition);

    vec3.set(this.endVector, this.node.position[0], this.node.position[1], this.node.position[2]);

    vec3.sub(this.directionVector, this.endVector, this.originVector);
    vec3.normalize(V3A, this.directionVector);

    // Lerp look at
    // const lookAtTarget = vec3.fromValues(this.flowerManager.xPostButterflyLookAt * (1 - this.butterflyStraight.value), this.butterflyYValue.value + chaos, this.node.position[2] - 2);
    vec3.set(this.lookAtTarget, this.flowerManager.xPostButterflyLookAt * (1 - this.butterflyStraight.value), this.node.position[1] + 1, this.node.position[2] - 5);
    this.butterflyLookAt[1] = this.node.position[1] + 1; // Force up and down look at 
    vec3.lerp(this.butterflyLookAt, this.butterflyLookAt, this.lookAtTarget, 0.002 * Time.scaledDt);
    this.node.lookAt(this.butterflyLookAt);

    // Compute roll angle
    quat.identity(this.butterflyRotation);
    quat.rotateX(this.butterflyRotation, this.butterflyRotation, this.butterflyPitch.value * Math.PI / 180);
    quat.rotateY(this.butterflyRotation, this.butterflyRotation, this.butterflyYaw.value * Math.PI / 180);
    quat.rotateZ(this.butterflyRotation, this.butterflyRotation, this.butterflyRoll.value * this.barrelRandom * Math.PI / 180 * this.rollDirection);
    quat.rotateZ(this.butterflyRotation, this.butterflyRotation, this.node.position[0] * 4 * Math.PI / 180 * (this.butterflyCoeff.value + 0.5));
    quat.slerp(this.subNode.rotation, this.subNode.rotation, this.butterflyRotation, 0.02 * Time.scaledDt);

    this.subNode.invalidate();
    this.subNode.updateWorldMatrix();

    this.node.invalidate();
    this.node.updateWorldMatrix();

    // Update trails
    this.trail.trailChunk.alphaU.set(0 + this.trailCoeff.value);
    this.trail2.trailChunk.alphaU.set(0 + this.trailCoeff.value);

    this.trail.trailChunk.offsetU.set(0, -2, 8 + 120 * this.trailCoeff.value);
    this.trail2.trailChunk.offsetU.set(0, -2, 8 + 120 * this.trailCoeff.value);

    this.trail.trailChunk.thicknessU.set(1.8 * this.trailCoeff.value);
    this.trail2.trailChunk.thicknessU.set(1.8 * this.trailCoeff.value);
  }

  movePointOnSphere(out: vec3, u: number, v: number) {
    const theta = 2 * Math.PI * u;
    const phi = Math.acos(2 * v - 1);
    out[0] = Math.sin(phi) * Math.cos(theta);
    out[1] = Math.sin(phi) * Math.sin(theta);
    out[2] = Math.cos(phi);
  }

  render(ctx: RenderContext): void {
    this.node.invalidate();
    this.node.updateWorldMatrix();

    for (const renderable of this.gltf.renderables) {
      renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
    }
  }
}
