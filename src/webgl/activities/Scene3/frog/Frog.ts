import gsap from "gsap";
import Gltf from "nanogl-gltf/lib/Gltf";
import Node from "nanogl-node";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import { ISheet } from "@theatre/core";
import { quat, vec3 } from "gl-matrix";
import { StandardPass } from "nanogl-pbr/StandardPass";

import lerp from "@/utils/Lerp";
import Time from "@webgl/Time";
import Trail from "@webgl/activities/Trail/Trail";
import Renderer from "@webgl/Renderer";
import RenderMask from "@webgl/core/RenderMask";
import GltfResource from "@webgl/resources/GltfResource";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import TextureAddChunk from "@webgl/glsl/textureAdd/TextureAddChunk";
import TheatreProgress from "@webgl/theatre/TheatreProgress";
import RockManager, { RockElem } from "@webgl/activities/Scene3/river-elems/RockManager";
import AnimationMixer, { AnimationLayer } from "@webgl/engine/AnimationMixer";
import { clamp } from "@webgl/math";
import { JUMP_STEPS } from "@webgl/activities/Scene3/constants";
import { RenderContext } from "@webgl/core/Renderer";

const FULL_CIRCLE = Math.PI * 2;
const VISION_TARGET = vec3.fromValues(0, 0, -10);

export default class Frog {
  node: Node;
  gltf: Gltf;
  gltfRes: GltfResource;
  tileTexChunk: TextureAddChunk;

  trail: Trail;
  trailNode: Node;
  skelRootNode: Node

  isJumping = false;
  isRotating = false;
  jumpAmount = 0;

  nextRock: RockElem = null;
  currentRock: RockElem = null;
  rockTargetYSuccess = 0;
  rockTargetYPerfect = 0;

  rockYSuccess: TheatreProgress;
  rockYPerfect: TheatreProgress;
  frogBarrelPerfect: TheatreProgress;
  frogPositionPerfect: TheatreProgress;
  frogJumpAnimPerfect: TheatreProgress;

  dummy: Node;
  direction = 0;
  startPosition = vec3.create();
  startRotation = quat.create();
  targetPosition = vec3.create();
  rotateDirection = 0;
  barrelRotationStart = 0;
  barrelRotationTarget = 0;
  barrelRotationCurrent = 0;

  animationMixer: AnimationMixer;
  idleAnimation: AnimationLayer;
  jumpAnimation: AnimationLayer;
  moveLeftAnimation: AnimationLayer;
  moveRightAnimation: AnimationLayer;

  constructor(
    private renderer: Renderer, private root: Node, private rockManager: RockManager,
    private ambientChunk: AmbientAddChunk, private sheetSuccess: ISheet,
    private sheetPerfect: ISheet
  ) {
    this.node = new Node();
    this.root.add(this.node);

    this.dummy = new Node();
    this.trailNode = new Node();

    this.tileTexChunk = new TextureAddChunk(this.renderer);
    this.tileTexChunk.textureRepeatU.set(0.00001);
    this.tileTexChunk.textureOpacityU.set(0.5);

    const materialOverride = new MaterialOverrideExtension();
    materialOverride.overridePass("", (ctx, material) => {
      const pass = material.getPass("color").pass as StandardPass;
      pass.inputs.add(this.ambientChunk);
      pass.inputs.add(this.tileTexChunk);

      pass.mask = RenderMask.BLENDED;
      pass.glconfig
        .enableBlend()
        .blendFunc(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA);
      return null;
    });

    this.gltfRes = new GltfResource("scene3/frog.gltf", this.renderer.gl, {
      defaultTextureFilter: this.renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [materialOverride],
    });
  }

  // --GETTERS--

  get childNode(): Node {
    return this.gltf.root;
  }

  // --LOAD--

  async load() {
    return this.gltfRes.load();
  }

  onLoaded() {
    this.gltf = this.gltfRes.gltf;
    this.node.add(this.childNode);
    this.skelRootNode = this.gltf.getNode("root");

    this.createAnimationMixer();
  }

  createAnimationMixer() {
    this.animationMixer = new AnimationMixer();

    const anim = this.gltf.animations[0];
    this.jumpAnimation = new AnimationLayer(anim);
    this.idleAnimation = new AnimationLayer(anim);
    this.moveLeftAnimation = new AnimationLayer(anim);
    this.moveRightAnimation = new AnimationLayer(anim);

    this.jumpAnimation.range = [0/30, 47/30];
    this.idleAnimation.range = [48/30, 347/30];
    this.moveLeftAnimation.range = [348/30, 362/30];
    this.moveRightAnimation.range = [365/30, 385/30];

    this.animationMixer.addLayer(this.idleAnimation);
    this.animationMixer.addLayer(this.jumpAnimation);
    this.animationMixer.addLayer(this.moveLeftAnimation);
    this.animationMixer.addLayer(this.moveRightAnimation);
  }

  // --START/STOP--

  start() {
    this.rockYSuccess = new TheatreProgress(0, this.updateRockTargetYSuccess, this.sheetSuccess, "Rocks / Start Rock Y");
    this.rockYPerfect = new TheatreProgress(1, this.updateRockTargetYPerfect, this.sheetPerfect, "Rocks / Start Rock Y");
    this.frogJumpAnimPerfect = new TheatreProgress(0, this.updateJumpAnimPerfect, this.sheetPerfect, "Frog / Jump");
    this.frogPositionPerfect = new TheatreProgress(0, this.updatePositionPerfect, this.sheetPerfect, "Frog / Position");
    this.frogBarrelPerfect = new TheatreProgress(0, this.updateBarrelPerfect, this.sheetPerfect, "Frog / Barrel");

    this.isJumping = false;
    this.currentRock = null;
    this.nextRock = null;
    this.direction = 0;
    this.rotateDirection = 0;
    this.rockTargetYSuccess = 0;
    this.rockTargetYPerfect = 0;
    this.barrelRotationStart = 0;
    this.barrelRotationTarget = 0;
    this.barrelRotationCurrent = 0;

    this.jumpAnimation.weight = 0;
    this.moveLeftAnimation.weight = 0;
    this.moveRightAnimation.weight = 0;
    this.idleAnimation.weight = 1;

    quat.identity(this.childNode.rotation);
    this.childNode.rotateY(Math.PI);
    this.childNode.setScale(0.5);
    this.childNode.invalidate();
    this.node.invalidate();
    this.node.updateWorldMatrix();

    this.trailNode.z = 0.8;
    this.childNode.add(this.trailNode);

    this.trail = this.renderer.scene.trailManager.addTrail(this.trailNode,
      {
        color: [220 / 255, 246 / 255, 246 / 255],
        trailDistance: 1,
        offset: [0, 0, 0],
        thickness: 0.8,
        drawImageFrameElapsed: 1,
        mixBorder: 0
      });
    this.trail.trailChunk.alphaU.set(0.9);
    this.trail?.trailChunk.thicknessU.set(0);
    this.renderer.scene.trailManager.renderAbove = true;
  }

  stop() {
    this.rockYSuccess.dispose();
    this.rockYPerfect.dispose();
    this.frogBarrelPerfect.dispose();
    this.frogJumpAnimPerfect.dispose();
    this.frogPositionPerfect.dispose();
    this.renderer.scene.trailManager.removeAll();
    this.renderer.scene.trailManager.renderAbove = false;
  }

  // --INITIAL ROCK--

  setInitialRock(rock: RockElem) {
    this.currentRock = rock;
    this.nextRock = rock;

    vec3.copy(this.node.position, rock.frogPosition || [0, 0, 0]);

    this.dummy.position[0] = this.node.position[0];
    this.dummy.lookAt(VISION_TARGET);
    quat.copy(this.node.rotation, this.dummy.rotation);

    this.node.invalidate();
    this.node.updateWorldMatrix();
  }

  // --PREPARE ANIM--

  getNextRock(amount: number): RockElem {
    const currentIndex = this.rockManager.mainRocks.indexOf(this.currentRock);
    const indexAdd = amount < JUMP_STEPS[1]
      ? 1 : amount < JUMP_STEPS[2]
        ? 2
        : 5 + Math.floor(Math.random() * 2);
    const nextIndex = Math.min(
      currentIndex + indexAdd + Math.floor(Math.random()),
      this.rockManager.mainRocks.length - 1
    );

    return this.rockManager.mainRocks[nextIndex];
  }

  prepareJump(amount: number) {
    this.jumpAmount = amount;

    this.trail.syncWithObject();

    vec3.copy(this.startPosition, this.node.position);

    this.nextRock = this.getNextRock(amount);

    if (!this.nextRock) return;

    vec3.copy(this.targetPosition, this.nextRock.frogPosition || [0, 0, 0]);
    this.direction = Math.sign(this.startPosition[0] - this.targetPosition[0]) || 1;

    // prepare barrel rotation target

    this.barrelRotationStart = this.barrelRotationCurrent;
    const addZ = amount < JUMP_STEPS[2] ? 0 : FULL_CIRCLE * this.direction;
    this.barrelRotationTarget = Math.round((this.barrelRotationCurrent + addZ) / FULL_CIRCLE) * FULL_CIRCLE;
  }

  jumpEnded() {
    this.currentRock = this.nextRock;
    this.rockTargetYPerfect = 0;
    this.doStraff();
  }

  // --ANIM--

  // ::ROCK Y::

  updateRockTargetYSuccess = (progress: number) => {
    this.rockTargetYSuccess = -progress * 0.5;
  }

  updateRockTargetYPerfect = (progress: number) => {
    this.rockTargetYPerfect = progress * 0.5;
  }

  updateRockY() {
    if (!this.currentRock) return;

    const rockNode = this.currentRock.renderableNodes[0];
    const y = Math.min(this.rockTargetYSuccess + this.rockTargetYPerfect, 0) / rockNode._wmatrix[5];

    rockNode.y = lerp(rockNode.y, y, this.isJumping ? 0.1 : 0.01);
    rockNode.invalidate();
    rockNode.updateWorldMatrix();

    this.childNode.y = rockNode._wposition[1];
    this.childNode.invalidate();
  }

  // ::POSITION::

  updatePositionPerfect = (progress: number) => {
    const thinknessFactor = this.jumpAmount < JUMP_STEPS[2] ? 0 : 1;
    this.trail?.trailChunk.thicknessU.set(clamp(1 - (progress * 3 - 2), 0, 1) * 0.8 * thinknessFactor);

    vec3.lerp(this.node.position, this.startPosition, this.targetPosition, progress);
    this.node.position[1] += Math.sin(progress * Math.PI) * 2;

    this.node.invalidate();
  }

  // ::BARREL::

  updateBarrelPerfect = (progress: number) => {
    this.barrelRotationCurrent = lerp(this.barrelRotationStart, this.barrelRotationTarget, progress);
  }

  applyBarrelRotation(){
    quat.identity(this.skelRootNode.rotation);
    this.skelRootNode.rotateZ(this.barrelRotationCurrent);
  }

  // ::STRAFF::

  doStraff() {
    this.isRotating = true;
    this.rotateDirection = this.direction;

    quat.copy(this.startRotation, this.node.rotation);
    this.dummy.position[0] = this.node.position[0];
    this.dummy.lookAt(VISION_TARGET);

    const tl = gsap.timeline({ onComplete: () => {
      this.isRotating = false;
    }});
    const progress = { rotation: 0, anim: 0 };

    tl.to(progress, {
      rotation: 1,
      duration: 1,
      ease: "power1.inOut",
      onUpdate: () => {
        this.updateRotationStraff(progress.rotation);
      }
    }, "0");
    tl.to(progress, {
      anim: 1,
      duration: 1,
      ease: "linear",
      onUpdate: () => {
        this.updateAnimStraff(progress.anim);
      }
    }, "0");
  }

  updateRotationStraff = (progress: number) => {
    quat.lerp(this.node.rotation, this.startRotation, this.dummy.rotation, progress);
    this.node.invalidate();
  }

  updateAnimStraff = (progress: number) => {
    this.moveLeftAnimation.time = progress * this.moveLeftAnimation.duration;
    this.moveRightAnimation.time = progress * this.moveRightAnimation.duration;
  }

  // ::JUMP::

  updateJumpAnimPerfect = (progress: number) => {
    this.jumpAnimation.time = progress * this.jumpAnimation.duration;
  }

  // ::ANIMATION MIX::

  updateAnimation() {
    const isJumpAnim = this.isJumping;
    const isStraffAnim = this.isRotating && !this.isJumping;
    const isIdleAnim = !isJumpAnim && !isStraffAnim;

    // jump anim
    this.jumpAnimation.weight = lerp(
      this.jumpAnimation.weight,
      isJumpAnim ? 1 : 0,
      0.1
    );
    // idle anim
    this.idleAnimation.weight = lerp(
      this.idleAnimation.weight,
      isIdleAnim ? 1 : 0,
      0.1
    );
    // straff anim
    const moveAnim = this.rotateDirection > 0 ? this.moveRightAnimation : this.moveLeftAnimation;
    const otherMoveAnim = this.rotateDirection > 0 ? this.moveLeftAnimation : this.moveRightAnimation;
    moveAnim.weight = lerp(
      moveAnim.weight,
      isStraffAnim ? 1 : 0,
      0.1
    );
    otherMoveAnim.weight = 0;

    // idle time
    const t = (Time.time/1000);
    this.idleAnimation.time = t;

    // evaluate
    this.animationMixer.evaluate();
  }

  // --RENDER--

  preRender(isJumping: boolean) {
    this.isJumping = isJumping;
    this.tileTexChunk.timeU.set(Time.time);
    this.updateRockY();
    this.updateAnimation();
    this.applyBarrelRotation();
    this.node.updateWorldMatrix();
  }

  render(ctx: RenderContext): void {
    for (const renderable of this.gltf.renderables) {
      renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
    }
  }
}
