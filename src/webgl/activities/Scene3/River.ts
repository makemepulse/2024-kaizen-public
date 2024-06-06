import Node from "nanogl-node";
import Camera from "nanogl-camera";
import Material from "nanogl-pbr/Material";
import Texture2D from "nanogl/texture-2d";
import MeshRenderer from "nanogl-gltf/lib/renderer/MeshRenderer";
import PerspectiveLens from "nanogl-camera/perspective-lens";
import { ISheet } from "@theatre/core";
import { quat, vec3 } from "gl-matrix";

import Fog from "@webgl/activities/Scene3/chunks/fog/Fog";
import Frog from "@webgl/activities/Scene3/frog/Frog";
import lerp from "@/utils/Lerp";
import Time from "@webgl/Time";
import Water from "@webgl/activities/Scene3/water/Water";
import Lighting from "@webgl/engine/Lighting";
import Renderer from "@webgl/Renderer";
import Viewport from "@/store/modules/Viewport";
import Particles from "@webgl/activities/Scene3/decor/Particles";
import RenderPass from "@webgl/core/RenderPass";
import CloudManager from "@webgl/activities/Scene3/decor/CloudManager";
import LilypadManager from "@webgl/activities/Scene3/river-elems/LilypadManager";
import AmbientAddChunk from "@webgl/glsl/ambientAdd/AmbientAddChunk";
import TheatreProgress from "@webgl/theatre/TheatreProgress";
import RiverElemsManager from "@webgl/activities/Scene3/river-elems/RiverElemsManager";
import RockManager, { RockElem } from "@webgl/activities/Scene3/river-elems/RockManager";
import TheatreTransformTransition, { vec3Data } from "@webgl/theatre/TheatreTransformTransition";
import { JUMP_STEPS } from "@webgl/activities/Scene3/constants";
import { RenderContext } from "@webgl/core/Renderer";
import { mix, smoothstep } from "@webgl/math";
import { INTRO_LOOK_AT, INTRO_POSITION } from "@webgl/activities/Scene3/constants";
import { INTRO_LOOK_AT as OUTRO_LOOK_AT, INTRO_POSITION as OUTRO_POSITION } from "@webgl/activities/Scene4/constants";
import { DEFAULT_TEXTURE_LUMINOSITY, DOWN_TEXTURE_LUMINOSITY } from "@webgl/glsl/texutrepass";

const TARGET_BASE_FOV = 1.5;

export default class River {
  noiseTex: Texture2D;

  frog: Frog;
  water: Water;
  particles: Particles;
  rockManager: RockManager;
  cloudManager: CloudManager;
  lilypadManager: LilypadManager;
  riverElemsManager: RiverElemsManager;

  isJumping = false;
  speedProgress = 1;

  addFov = 0;
  initFov = 0;
  baseFov = 0;
  baseFovDist = 0;
  cameraLookAt = vec3.create();
  cameraWrapper: Node;
  cameraTiltJump = vec3.create();
  cameraTiltHold = vec3.create();
  fovPerfectTarget = 0;
  cameraShakeAmount = 0;
  cameraShakeFactor = 1;
  cameraRotationMouse = vec3.create();
  camRotationPerfectTarget = vec3.create();

  root = new Node();
  rootLerpPos = vec3.create();
  rootStartPos = vec3.create();
  rootTargetPos = vec3.create();
  rootCurrentPos = vec3.create();
  rootLerpFactor = 1;

  rootAnimPerfect: TheatreProgress;
  cameraFovSuccess: TheatreProgress;
  cameraFovPerfect: TheatreProgress;
  riverSpeedSuccess: TheatreProgress;
  cameraShakeSuccess: TheatreProgress;
  cameraTransformIntro: TheatreTransformTransition;
  cameraTransformOutro: TheatreTransformTransition;
  cameraRotationSuccess: TheatreProgress;
  cameraRotationPerfect: TheatreProgress;
  cameraTransformSuccess: TheatreTransformTransition;

  constructor(
    private renderer: Renderer, ambientChunk: AmbientAddChunk, fogChunk: Fog,
    private sheetSuccess: ISheet, private sheetPerfect: ISheet,
    private sheetIntro: ISheet, private sheetOutro: ISheet
  ) {
    this.noiseTex = renderer.scene.texturePool.get("perlinNoise").texture;

    this.rockManager = new RockManager(
      renderer, this.root, ambientChunk, fogChunk,
      sheetSuccess, this.noiseTex
    );
    this.lilypadManager = new LilypadManager(
      renderer, this.root, ambientChunk, fogChunk, sheetSuccess
    );
    this.riverElemsManager = new RiverElemsManager(this);

    this.frog = new Frog(
      renderer, this.root, this.rockManager, ambientChunk,
      sheetSuccess, sheetPerfect
    );
    this.water = new Water(
      renderer, this.root, sheetSuccess, sheetPerfect, ambientChunk,
      fogChunk, this.noiseTex
    );

    this.cloudManager = new CloudManager(
      renderer, ambientChunk, sheetSuccess
    );
    this.particles = new Particles(
      renderer, 250, vec3.fromValues(1, 1, 1),
      sheetSuccess, this.noiseTex
    );
  }

  get camera(): Camera<PerspectiveLens> {
    return this.renderer.camera as Camera<PerspectiveLens>;
  }

  // --LOAD--

  async load() {
    return Promise.all([
      this.frog.load(),
      this.water.load(),
      this.cloudManager.load(),
      this.rockManager.load(),
      this.lilypadManager.load(),
    ]);
  }

  onLoaded() {
    this.frog.onLoaded();
    this.water.onLoaded();
    this.rockManager.onLoaded();
    this.cloudManager.onLoaded();
    this.lilypadManager.onLoaded();
  }

  // --START/STOP--

  start(skipIntro: boolean) {
    this.root.position.set([0, 0, 0]);
    vec3.copy(this.rootLerpPos, this.root.position);

    this.isJumping = false;
    this.rootLerpFactor = 1;
    this.initFov = this.camera.lens._hfov;
    this.baseFov = this.initFov;
    this.baseFovDist = TARGET_BASE_FOV - this.baseFov;
    this.cameraShakeAmount = 0;
    this.cameraTiltJump.set([0, 0, 0]);
    this.cameraTiltHold.set([0, 0, 0]);

    if (this.camera._parent === null) {
      const parentNode = new Node();
      parentNode.add(this.camera);
    }
    this.cameraWrapper = this.camera._parent;
    this.cameraWrapper.position.set([0, 0, 0]);
    quat.identity(this.cameraWrapper.rotation);

    // Setup theatre objects

    this.riverSpeedSuccess = new TheatreProgress(0, this.updateSpeedProgress, this.sheetSuccess, "River / Speed");
    this.rootAnimPerfect = new TheatreProgress(0, this.updateProgressPerfect, this.sheetPerfect, "River / Movement");
    this.cameraTransformSuccess = new TheatreTransformTransition(this.camera, this.sheetSuccess, "Camera / Transform", false, this.cameraLookAt);
    this.cameraFovSuccess = new TheatreProgress(0, this.updateFovSuccess, this.sheetSuccess, "Camera / FOV");
    this.cameraShakeSuccess = new TheatreProgress(0, this.updateShakeSuccess, this.sheetSuccess, "Camera / Shake");
    this.cameraRotationSuccess = new TheatreProgress(0, this.updateCamRotationSuccess, this.sheetSuccess, "Camera / Rotation");
    this.cameraFovPerfect = new TheatreProgress(0, this.updateFovPerfect, this.sheetPerfect, "Camera / FOV");
    this.cameraRotationPerfect = new TheatreProgress(0, this.updateCamRotationPerfect, this.sheetPerfect, "Camera / Rotation");
    this.cameraTransformIntro = new TheatreTransformTransition(this.camera, this.sheetIntro, "Camera / Transform", false, this.cameraLookAt);
    this.cameraTransformOutro = new TheatreTransformTransition(this.camera, this.sheetOutro, "Camera / Transform", false, this.cameraLookAt);

    // Setup camera transform anims

    const cameraInPosition: vec3Data = [INTRO_POSITION[0], INTRO_POSITION[1], INTRO_POSITION[2]];
    const cameraInLookAt: vec3Data = [INTRO_LOOK_AT[0], INTRO_LOOK_AT[1], INTRO_LOOK_AT[2]];
    const cameraOutPosition: vec3Data = [OUTRO_POSITION[0], OUTRO_POSITION[1], OUTRO_POSITION[2]];
    const cameraOutLookAt: vec3Data = [OUTRO_LOOK_AT[0], OUTRO_LOOK_AT[1], OUTRO_LOOK_AT[2]];
    const cameraSuccessPositionKeyframes: vec3Data[] = [
      Viewport.isMobile ? [0, 25, 8] : [0, 40, 15],
      Viewport.isMobile ? [0, 18, 8] : [0, 28, 15],
      Viewport.isMobile ? [10, 1, -6] : [14, 1, -14],
      Viewport.isMobile ? [0, 4, 8] : [0, 4, 10],
    ];
    const cameraFrogLookAt: vec3Data = [0, 2, 0];

    this.cameraTransformIntro.setKeyframes({
      position: [
        cameraInPosition,
        cameraSuccessPositionKeyframes[0]
      ],
      lookAt: [cameraInLookAt, cameraFrogLookAt]
    });
    this.cameraTransformOutro.setKeyframes({
      position: [cameraSuccessPositionKeyframes[0], cameraOutPosition],
      lookAt: [cameraFrogLookAt, cameraOutLookAt]
    });
    this.cameraTransformSuccess.setKeyframes({
      position: cameraSuccessPositionKeyframes
    });

    this.camera.position.set(skipIntro
      ? cameraSuccessPositionKeyframes[0]
      : cameraInPosition
    );
    vec3.set(this.cameraLookAt, ...(skipIntro
      ? cameraFrogLookAt
      : cameraInLookAt
    ));

    // Start managers

    this.frog.start();
    this.water.start();
    this.particles.start();
    this.rockManager.start();
    this.cloudManager.start();
    this.lilypadManager.start();
    this.riverElemsManager.start();
    this.water.heatmapCvs = this.riverElemsManager.canvas;
  }

  stop() {
    this.cameraWrapper.position.set([0, 0, 0]);
    quat.identity(this.cameraWrapper.rotation);
    this.cameraWrapper.invalidate();

    this.frog.stop();
    this.water.stop();
    this.particles.stop();
    this.rockManager.stop();
    this.cloudManager.stop();
    this.lilypadManager.stop();
    this.riverElemsManager.stop();

    this.riverSpeedSuccess.dispose();
    this.rootAnimPerfect.dispose();
    this.cameraFovPerfect.dispose();
    this.cameraTransformIntro.dispose();
    this.cameraTransformOutro.dispose();
    this.cameraRotationPerfect.dispose();
    this.cameraFovSuccess.dispose();
    this.cameraShakeSuccess.dispose();
    this.cameraRotationSuccess.dispose();
    this.cameraTransformSuccess.dispose();
  }

  // --LIGHTING--

  setupLighting(lighting: Lighting, renderables: MeshRenderer[]) {
    lighting.lightSetup.prepare(this.renderer.gl);
    const materials = [] as Material[];

    for (const renderable of renderables) {
      for (const mat of renderable.materials) {
        if (materials.indexOf(mat) === -1) {
          materials.push(mat);
        }
      }
    }

    for (const renderable of renderables) {
      for (const material of renderable.materials) {
        if (!material.hasPass(RenderPass.REFLECT_DEPTH)) {
          material.addPass(this.renderer.reflectDistPass, RenderPass.REFLECT_DEPTH);
        }
      }
    }
    for (const material of materials) {
      lighting.setupMaterial(material);
    }
  }

  setupSceneLighting(lighting: Lighting) {
    this.setupLighting(
      lighting,
      [
        ...this.frog.gltf.renderables, ...this.rockManager.renderables,
        ...this.lilypadManager.renderables, ...this.water.paintManager.renderables
      ]
    );
  }

  // --INITIAL ROCK--

  setInitialRock(rock: RockElem) {
    this.frog.setInitialRock(rock);
    this.water.prepareStartRock(rock);
    this.root.z = -rock.node.z;
    vec3.copy(this.rootLerpPos, this.root.position);
  }

  // --SCROLL--

  updateScroll() {
    this.water.scroll(this.root.z);
    this.particles.scroll(this.root.z);
  }

  // --PREPARE ANIM--

  prepareJump(amount: number) {
    this.isJumping = true;

    this.frog.prepareJump(amount);
    this.water.prepareJump(this.frog.nextRock);

    this.rootLerpFactor = amount > 0.9
      ? 0.4 - smoothstep(0.9, 1, amount) * 0.35
      : 0.4 - smoothstep(0, 0.9, amount) * (Viewport.isMobile ? 0.1 : 0.2);

    vec3.copy(this.rootStartPos, this.root.position);
    vec3.copy(this.rootTargetPos, this.rootStartPos);
    this.rootTargetPos[2] = Math.max(0, -this.frog.nextRock.node.z);

    this.fovPerfectTarget = amount < JUMP_STEPS[2]
      ? Math.random() * 0.1
      : 0.3 + Math.random() * 0.2;
    this.camRotationPerfectTarget.set(amount < JUMP_STEPS[2]
      ? [0, 0, 0]
      : [
        Math.random() * 0.1,
        -this.frog.direction * (0.1 + Math.random() * 0.05),
        this.frog.direction * (0.1 + Math.random() * 0.05)
      ]
    );
  }

  jumpEnded() {
    this.isJumping = false;
    this.frog.jumpEnded();
    this.water.prepareStartRock(this.frog.currentRock);
  }

  prepareOutro() {
    vec3.copy(this.cameraTransformOutro.keyframes.position[0], this.camera.position);
    vec3.copy(this.cameraTransformOutro.keyframes.lookAt[0], this.cameraLookAt);

    this.cameraTransformIntro.disable();
    this.cameraTransformSuccess.disable();
  }

  // --ANIM--

  updateProgressPerfect = (progress: number) => {
    vec3.lerp(this.rootLerpPos, this.rootStartPos, this.rootTargetPos, progress);
  }

  updateSpeedProgress = (progress: number) => {
    this.speedProgress = progress;
  }

  updateFovSuccess = (progress: number) => {
    this.baseFov = this.initFov + progress * this.baseFovDist;
    this.camera.lens.setHorizontalFov(this.baseFov + this.addFov);
  }

  updateFovPerfect = (progress: number) => {
    this.addFov = progress * this.fovPerfectTarget;
    this.camera.lens.setHorizontalFov(this.baseFov + this.addFov);
  }

  updateShakeSuccess = (progress: number) => {
    this.cameraShakeAmount = progress;
  }

  updateCamRotationSuccess = (progress: number) => {
    vec3.lerp(
      this.cameraTiltHold,
      [0, 0, 0],
      [0, 0, -0.1],
      progress
    );
  }

  updateCamRotationPerfect = (progress: number) => {
    vec3.lerp(
      this.cameraTiltJump,
      [0, 0, 0],
      this.camRotationPerfectTarget,
      progress
    );
  }

  // --RENDER--

  updateRoot() {
    vec3.lerp(this.root.position, this.root.position, this.rootLerpPos, this.rootLerpFactor);
    this.root.invalidate();
    this.root.updateWorldMatrix();
    this.updateScroll();
  }

  updateCameraWrapper(isOutroPlaying: boolean) {
    const noShake = this.isJumping || isOutroPlaying || this.renderer.scene.isTitlePlaying.value;
    this.cameraShakeFactor = lerp(
      this.cameraShakeFactor,
      noShake ? 0 : 1,
      0.01
    );
    const time = Time.time * 0.05;

    this.cameraWrapper.x =
      Math.sin(time) * 0.05 * this.cameraShakeAmount * this.cameraShakeFactor;
    this.cameraWrapper.y =
      Math.cos(time + 0.2) * 0.025 * this.cameraShakeAmount * this.cameraShakeFactor;
    this.cameraWrapper.z =
      Math.sin(time + 0.5) * 0.01 * this.cameraShakeAmount * this.cameraShakeFactor;
    this.cameraWrapper.invalidate();
    this.cameraWrapper.updateWorldMatrix();
  }

  updateCamera(isIntroPlaying: boolean) {
    // look at
    this.camera.lookAt(this.cameraLookAt);

    // mouse parallax
    const coord = this.renderer.pointers.primary.coord.viewport;
    vec3.lerp(
      this.cameraRotationMouse,
      this.cameraRotationMouse,
      Viewport.isMobile
        ? [0, 0, 0]
        : [coord[1] * 0.02, -coord[0] * 0.02, 0],
      0.05
    );

    const valInOut = isIntroPlaying ? 1 - this.cameraTransformIntro.obj.value.lookAtProgress : this.cameraTransformOutro.obj.value.lookAtProgress;

    vec3.lerp(
      this.cameraRotationMouse,
      this.cameraRotationMouse,
      [0, 0, 0],
      valInOut);

    // rotate camera with tilt jump + mouse parallax
    this.camera.rotateX(
      this.cameraRotationMouse[0] + this.cameraTiltHold[0] + this.cameraTiltJump[0]
    );
    this.camera.rotateY(
      this.cameraRotationMouse[1] + this.cameraTiltHold[1] + this.cameraTiltJump[1]
    );
    this.camera.rotateZ(
      this.cameraRotationMouse[2] + this.cameraTiltHold[2] + this.cameraTiltJump[2]
    );

    this.camera.invalidate();
    this.camera.updateWorldMatrix();
  }

  preRender(isIntroPlaying = false, isOutroPlaying = false) {
    const isInOutPlaying = isIntroPlaying || isOutroPlaying;
    this.updateRoot();
    this.updateCameraWrapper(isOutroPlaying);
    this.updateCamera(isIntroPlaying);

    this.riverElemsManager.preRender(this.speedProgress);
    this.rockManager.preRender();
    this.lilypadManager.preRender();
    this.water.preRender(this.speedProgress, this.isJumping);
    this.particles.preRender(this.speedProgress);
    this.cloudManager.preRender();
    this.frog.preRender(this.isJumping);

    if (isInOutPlaying) {
      const tPass = this.renderer.postprocess.texturepass;
      const v = isIntroPlaying
        ? 1 - this.cameraTransformIntro.obj.value.lookAtProgress
        : this.cameraTransformOutro.obj.value.lookAtProgress;
      tPass.textureLuminosity = mix(DOWN_TEXTURE_LUMINOSITY, DEFAULT_TEXTURE_LUMINOSITY, v);
    }
  }

  render(ctx: RenderContext) {
    // render rock before water
    // to write in depth buffer before water depth test
    this.rockManager.render(ctx);
    if (ctx.pass !== RenderPass.REFLECT_DEPTH) this.water.render(ctx);
    this.lilypadManager.render(ctx);
    this.frog.render(ctx);
    this.cloudManager.render(ctx);
    if (ctx.pass !== RenderPass.REFLECT_DEPTH && ctx.pass !== RenderPass.DEPTH) this.particles.render(ctx);
  }
}