import AppService from "@/services/AppService";
import { RenderContext } from "@webgl/core/Renderer";
import { quat, vec3 } from "gl-matrix";
import Gltf from "nanogl-gltf/lib/Gltf";
import { ISheet, ISheetObject } from "@theatre/core";
import GltfResource from "@webgl/resources/GltfResource";
import Renderer from "@webgl/Renderer";
import MeshRenderer from "nanogl-gltf/lib/renderer/MeshRenderer";
import Node from "nanogl-node";
import UnderwaterFish from "../chunks/underwater-fish/UnderwaterFish";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import { Sampler, Uniform } from "nanogl-pbr/Input";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import Signal from "@/core/Signal";
import Texture2D from "nanogl/texture-2d";
import Time from "@webgl/Time";
import TexCoord from "nanogl-pbr/TexCoord";
import { smoothstep } from "@webgl/math";
import GltfTypes from "nanogl-gltf/lib/types/GltfTypes";
import Camera from "../Camera";
import Scene2 from "../Scene2";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import TextureAddChunk from "@webgl/glsl/textureAdd/TextureAddChunk";

const V3A = vec3.create();
const V3B = vec3.create();

export default class Fish {

  static isSlowMo = false;
  static slowMoFactor = 0.2;

  res: GltfResource;
  gltf: Gltf;
  renderables: MeshRenderer[] = [];

  /**
   * Parent node is used for the infinite "move and rotate" fish animation loop, following a world curve
   *
   * While its child, the gltf node, is used for precise animations, like the little offset on X axis,
   * the little rotation to make the fish wave, and the jump animations (jump and high jump)
   */
  parentNode: Node;
  fishNode: Node;

  position: vec3 = vec3.create();
  rotation: quat = quat.create();
  lookAt: vec3 = vec3.create();
  angle: number;

  worldPosition: vec3 = vec3.create();

  fishXOffset: number;
  fishYRotate: number;

  energyTimeline: TheatreFloat;

  energy = { value: 1, startV: 0 };

  sheetSuccess: ISheet;

  sheetLoop: ISheet;
  sheetLoopObj: ISheetObject<{ easing: number }>;

  // sheetJump: ISheet;
  // sheetJumpObj: ISheetObject<{ height: number, rotationZ: number }>;

  // sheetHighJump: ISheet;
  // sheetHighJumpObj: ISheetObject<{ height: number, rotationX: number, rotationZ: number }>;

  sheetPerfect: ISheet;
  sheetPerfectObj: ISheetObject<{ height: number, rotationX: number, rotationZ: number, superRotateZ: number }>;

  isAnimating = false;
  jumpFactor = 0;
  jumpRandom = 0;

  isSuperJump = 0;

  waterHeight: Uniform;
  waterColor: Uniform;
  deepWaterColor: Uniform;
  deepWaterColorFactor: Uniform;
  viewportSize: Uniform;
  time: Uniform;
  fishNoiseTex: Sampler;
  cameraPos: Uniform;

  enterWater: Signal = new Signal();
  exitWater: Signal = new Signal();



  nextPosition = vec3.create()
  vel = vec3.create()
  velAdd = vec3.create()
  camWorldVecScaled = vec3.create()
  camWorldVec = vec3.create()
  camWorldVecLerp = vec3.create()

  directionChange: number
  avoidLimit: number

  angleCircle = 0
  camVecRand = 0
  camVecRandLerp = 0
  fishY = 0

  animTime = Math.random()

  noiseTex: Texture2D;

  fishRotation = quat.create()
  fishRotationX = quat.create()
  fishRotationZ = quat.create()

  constructor(private renderer: Renderer, ambientChunk: AmbientAddChunk, tileAddChunk: TextureAddChunk) {
    this.noiseTex = this.renderer.scene.texturePool.get("perlinNoise").texture;

    const overrides = new MaterialOverrideExtension();

    const underwater = new UnderwaterFish();
    this.waterHeight = underwater.waterHeight.attachUniform();
    this.waterColor = underwater.waterColor.attachUniform();
    this.deepWaterColor = underwater.deepWaterColor.attachUniform();
    this.deepWaterColorFactor = underwater.deepWaterColorFactor.attachUniform();
    this.viewportSize = underwater.viewportSize.attachUniform();
    this.time = underwater.time.attachUniform();
    this.fishNoiseTex = underwater.noise.attachSampler("tNoise", TexCoord.create("aTexCoord0"));
    this.cameraPos = underwater.cameraPos.attachUniform();

    overrides.overridePass("", (ctx, material) => {
      const pass = material.getPass("color").pass;
      pass.inputs.add(ambientChunk);
      pass.inputs.add(underwater);
      pass.inputs.add(tileAddChunk);
      return pass;
    });
    this.res = new GltfResource("scene2/Fish.gltf", renderer.gl, {
      defaultTextureFilter: renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [overrides],
    });

    this.sheetLoop =
      AppService.state.machine.context.theatreProject.project.sheet(
        "scene2-fish-loop"
      );

    this.parentNode = new Node();

    vec3.set(
      this.velAdd,
      0.3 + Math.random() * 0.4,
      0.0,
      0.3 + Math.random() * 0.4
    );

    vec3.scale(this.velAdd, this.velAdd, (0.025 + Math.random() * 0.005) * 2);

    this.directionChange = (0.003 + Math.random() * 0.005) * 0.1;
    this.avoidLimit = 0.1 + Math.random() * 0.2;
  }

  async load() {
    return this.res.load();
  }

  onLoaded() {
    this.gltf = this.res.gltf;
    this.renderables = this.gltf.renderables;

    this.gltf.root.setScale(0.02);

    this.parentNode.add(this.gltf.root);

    this.fishNode = this.gltf.getElementByName(GltfTypes.NODE, "skeleton_root");

    // this.sheetJumpObj = this.sheetJump.object("Fish", { height: 0, rotationZ: 0 });
  }

  start(waterHeight: number) {
    this.sheetLoop.sequence.play({ iterationCount: Infinity });

    this.waterHeight.set(waterHeight + 0.1);
    this.waterColor.set(0.4898, 0.7324, 0.6046);
    this.deepWaterColor.set(0.69, 0.86, 0.84);
    this.deepWaterColorFactor.set(0.95);
    this.fishNoiseTex.set(this.noiseTex);
    this.viewportSize.set(this.renderer.viewport.height, this.renderer.viewport.width);
    this.cameraPos.set(...Camera.node.position);

    // this.setCamScaleVec();

    this.camVecRandLerp = this.camVecRand = 0.3;
    this.invalidate();

    vec3.copy(this.camWorldVecLerp, this.camWorldVecScaled);


    this.sheetLoopObj = this.sheetLoop.object("Fish", { easing: 0 });
    this.sheetPerfectObj = this.sheetPerfect.object("Fish", { height: 0, rotationX: 0, rotationZ: 0, superRotateZ: 0 });
    this.energyTimeline = new TheatreFloat(this.energy, this.sheetSuccess, "Fish Energy");

    this.energy.startV = this.energy.value;

    /// #if DEBUG
    const PARAMS = {
      waterHeight: this.waterHeight.value[0],
      waterColor: this.waterColor.value,
      deepWaterColor: this.deepWaterColor.value,
      deepWaterColorFactor: this.deepWaterColorFactor.value[0],
    };

    const f = Scene2.guiFolder.folder("Fish");
    f.range(PARAMS, "waterHeight", -1, 1).onChange(() => this.waterHeight.set(PARAMS.waterHeight));
    f.addColor(PARAMS, "waterColor").onChange(() => this.waterColor.set(...PARAMS.waterColor));
    f.addColor(PARAMS, "deepWaterColor").onChange(() => this.deepWaterColor.set(...PARAMS.deepWaterColor));
    f.range(PARAMS, "deepWaterColorFactor", 0, 10).onChange(() => this.deepWaterColorFactor.set(PARAMS.deepWaterColorFactor));
    /// #endif
  }

  stop() {
    if (this.sheetLoopObj) this.sheetLoop.detachObject("Fish");
    if (this.sheetPerfectObj) this.sheetPerfect?.detachObject("Fish");
    this.energyTimeline.dispose();
  }

  invalidate() {
    this.parentNode.invalidate();
    this.parentNode.updateWorldMatrix();

    this.gltf.root.invalidate();
    this.gltf.root.updateWorldMatrix();
  }

  async jump(holdingPercent: number) {
    this.jumpFactor = Math.min(holdingPercent, 0.8);
    this.jumpRandom = 0.75 + Math.random() * 0.25;

    this.isSuperJump = 0;

    if (holdingPercent > 0.99) {
      // DO SOUND
      this.isSuperJump = 1;
      await this.sheetPerfect.sequence.play({ range: [0, 0.406] });
      Fish.isSlowMo = true;
      // gsap.fromTo(Fish, { slowMoFactor: 1 }, { slowMoFactor: 0.3, duration: 0.1 });
      await this.sheetPerfect.sequence.play({ range: [0.406, 0.6], rate: 0.8 });
      await this.sheetPerfect.sequence.play({ range: [0.6, 0.7], rate: 0.5 });
      await this.sheetPerfect.sequence.play({ range: [0.7, 1.05], rate: 0.2 });
      await this.sheetPerfect.sequence.play({ range: [1.05, 1.1], rate: 0.5 });
      await this.sheetPerfect.sequence.play({ range: [1.1, 1.2], rate: 0.8 });
      // gsap.to(Fish, { slowMoFactor: 1, duration: 0.1 });
      Fish.isSlowMo = false;
      await this.sheetPerfect.sequence.play({ range: [1.2, 2.55] });
    } else {
      await this.sheetPerfect.sequence.play();
    }
  }

  setCamScaleVec(energy: number) {
    vec3.set(this.camWorldVec, Camera.node._wmatrix[12], 0, Camera.node._wmatrix[14]);
    this.camVecRandLerp = this.camVecRand;
    this.camVecRandLerp += Math.sin(this.angleCircle) * 0.02 * smoothstep(0.7, 1.0, energy);
    const angle = Math.atan2(this.camWorldVec[2], this.camWorldVec[0]);
    const x = Math.cos(angle) * (Camera.CAM_DISTANCE) * 2;
    const z = Math.sin(angle) * (Camera.CAM_DISTANCE) * 2;
    this.fishY = Math.sin(-this.angleCircle) * 0.5 * smoothstep(0.2, 1.0, energy);
    vec3.set(this.camWorldVecScaled, x, this.fishY, z);
    vec3.scale(this.camWorldVecScaled, this.camWorldVecScaled, this.camVecRandLerp);

  }

  preRender(isIntroPlaying = false, isOutroPlaying = false) {
    const swimAnim = this.gltf.animations[0];
    this.animTime += Time.stableDt / 50 * (Fish.isSlowMo ? 0.5 : (1 + this.energy.value * 2));
    swimAnim.evaluate(this.animTime % swimAnim.duration);

    const energy = this.energy.value;
    this.setCamScaleVec(energy);
    this.angleCircle += 0.05 * (Fish.isSlowMo ? Fish.slowMoFactor : 1);

    this.time.set(Time.scaledTime * 0.0001);

    const nextHeight = (this.sheetPerfectObj.value.height) * this.jumpFactor * this.jumpRandom - 0.5;

    if (nextHeight > this.waterHeight.value[0] && this.gltf.root.position[1] <= this.waterHeight.value[0]) {
      this.exitWater.emit({});
    }

    if (nextHeight < this.waterHeight.value[0] && this.gltf.root.position[1] >= this.waterHeight.value[0]) {
      this.enterWater.emit({});
    }

    // Position when fish is not on hold
    const r = 1.5 + Math.sin(Time.scaledTime * 0.0001);
    const angle = Math.atan2(this.renderer.camera._wmatrix[14], this.renderer.camera._wmatrix[12]);
    vec3.set(V3B, Math.cos(angle) * 8 + Math.cos(this.animTime * 0.4) * r,
      this.camWorldVec[1],
      Math.sin(angle) * 8 + Math.sin(this.animTime * 0.4) * r);
    vec3.lerp(this.nextPosition, this.nextPosition, V3B, 0.1);

    //Blending both
    const mEnergy = smoothstep(0, 1, energy);
    vec3.lerp(this.camWorldVecLerp, this.camWorldVecLerp, this.camWorldVecScaled, 1);
    vec3.lerp(this.nextPosition, this.nextPosition, this.camWorldVecLerp, (isIntroPlaying) ? 0 : mEnergy);
    // vec3.lerp(this.nextPosition, this.nextPosition, this.camWorldVecLerp, 1);

    //Look at from current position to next
    vec3.sub(V3B, this.nextPosition, this.parentNode.position);
    vec3.normalize(V3B, V3B);
    vec3.add(V3A, this.parentNode.position, V3B);

    this.parentNode.lookAt(V3A);
    quat.rotateY(this.parentNode.rotation, this.parentNode.rotation, -Math.PI / 2);

    vec3.copy(this.parentNode.position, this.nextPosition);

    this.gltf.root.position[1] = nextHeight;

    vec3.set(this.worldPosition, this.gltf.root._wmatrix[12], this.gltf.root._wmatrix[13], this.gltf.root._wmatrix[14]);
    vec3.copy(this.position, this.parentNode.position);
    // this.worldPosition[1] += Math.max(0, nextHeight);


    // Slightly rotate the fish on the Y axis and move it on the X axis
    this.fishYRotate = Math.sin(this.sheetLoopObj.value.easing * Math.PI * 2 * 20) * 0.2;
    quat.identity(this.fishRotation);
    quat.identity(this.fishRotationX);
    quat.identity(this.fishRotationZ);
    quat.rotateY(this.fishRotation, this.fishRotation, this.fishYRotate - Math.PI / 2);
    quat.rotateZ(this.fishRotationZ, this.fishRotationZ, this.sheetPerfectObj.value.rotationZ * this.jumpFactor * 3 * this.jumpRandom * Math.PI * 2 + this.sheetPerfectObj.value.superRotateZ * Math.PI * 2 * this.isSuperJump);
    quat.rotateX(this.fishRotationX, this.fishRotationX, this.sheetPerfectObj.value.rotationX * Math.PI * 2);
    // quat.rotateZ(this.fishRotation, this.fishRotation, this.sheetPerfectObj.value.rotationZ * this.jumpFactor * this.jumpRandom * Math.PI * 2);

    this.fishNode.rotation.set(this.fishRotation);
    quat.mul(this.fishNode.rotation, this.fishNode.rotation, this.fishRotationX);
    quat.mul(this.fishNode.rotation, this.fishNode.rotation, this.fishRotationZ);

    this.fishNode.invalidate();
    this.invalidate();


    this.deepWaterColorFactor.set(0.95 + (1 - energy) * 10.55);
  }

  render(ctx: RenderContext) {
    this.cameraPos.set(...Camera.node.position);

    for (const renderable of this.gltf.renderables) {
      renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
    }
  }
}