/// #if DEBUG
import gui from "@webgl/dev/gui";
import { Gui } from "@webgl/dev/gui/api";
/// #endif
import Clouds from "./Clouds";
import Camera from "nanogl-camera";
import Scene, { BLOCK_HOLD_AFTER_RELEASE_TIME, BLOCK_HOLD_DOWN_AFTER_RELEASE_TIME } from "../Scene/Scene";
import Butterfly from "./Butterfly";
import { ISheet } from "@theatre/core";
import Renderer from "@webgl/Renderer";
import { vec3, vec4 } from "gl-matrix";
import Gltf from "nanogl-gltf/lib/Gltf";
import Scene1Lights from "./Scene1Lights";
import Material from "nanogl-pbr/Material";
import FlowerManager from "./FlowerManager";
import ParticlesField from "./ParticlesField";
import { JUMP_SOUND_LIST } from "./soundlist";
import AppService from "@/services/AppService";
import { toStatePaths } from "xstate/lib/utils";
import Node from "nanogl-gltf/lib/elements/Node";
import FlowerInstancing from "./FlowerInstancing";
import { RenderContext } from "@webgl/core/Renderer";
import AudioManager, { AUDIO_ID, SCENE_AUDIO_AMBIENT_ID, SCENE_AUDIO_AMBIENT_LAYER_ID } from "@/core/audio/AudioManager";
import Scene1CameraSystem from "./Scene1CameraSystem";
import Scene1PostProcessing from "./Scene1PostProcess";
import Texture from "nanogl-gltf/lib/elements/Texture";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import { InstancingImpl } from "@webgl/core/Instancing";
import GltfTypes from "nanogl-gltf/lib/types/GltfTypes";
import GltfResource from "@webgl/resources/GltfResource";
import Background, { BackgroundType } from "../Scene2/utils/Background";
import { cameraShake, cameraShakeWithLookAt } from "../CameraUtils/CameraShake";
import MaterialOverrideExtension from "nanogl-gltf/lib/extensions/MaterialOverrideExtension";
import {
  UI_VOLUME,
  JUMP_STEPS,
  VOICE_VOLUME,
  BACKGROUND_TOP_COLOR,
  BACKGROUND_MIDDLE_COLOR,
  BACKGROUND_BOTTOM_COLOR,
  BACKGROUND_TOP_COLOR_INTRO,
  BACKGROUND_MIDDLE_COLOR_INTRO,
  BACKGROUND_BOTTOM_COLOR_INTRO,
  BACKGROUND_TOP_COLOR_OUTRO,
  BACKGROUND_BOTTOM_COLOR_OUTRO,
  BACKGROUND_MIDDLE_COLOR_OUTRO,
} from "./constants";
import {
  BACKGROUND_BOTTOM_ALPHA as BACKGROUND_S2_BOTTOM_ALPHA,
  BACKGROUND_BOTTOM_COLOR as BACKGROUND_S2_BOTTOM_COLOR,
  BACKGROUND_MIDDLE_ALPHA as BACKGROUND_S2_MIDDLE_ALPHA,
  BACKGROUND_MIDDLE_COLOR as BACKGROUND_S2_MIDDLE_COLOR,
  BACKGROUND_TOP_ALPHA as BACKGROUND_S2_TOP_ALPHA,
  BACKGROUND_TOP_INTRO_COLOR as BACKGROUND_S2_TOP_COLOR
} from "../Scene2/constants";

const AMBIENT_VOLUME = 0.75;

export default class Scene1 extends Scene {
  path = "scene1/scene1.gltf";
  dandelionPath = "dandelion/dandelion.gltf";

  root: Node;
  flower: Gltf;
  clouds: Clouds;
  butterfly: Butterfly;
  background: Background;
  dandelionResource: GltfResource;

  instancing: InstancingImpl;
  flowerManager: FlowerManager;
  energyParticles: ParticlesField;
  cameraSystem: Scene1CameraSystem;
  postProcessSystem: Scene1PostProcessing;
  flowerInstancingArray: FlowerInstancing[] = [];

  lights: Scene1Lights;
  materials: Material[] = [];

  sheetPerfectVariants: ISheet[] = [];

  progress = { value: 0, startV: 0, releaseV: 0 };
  progressTheatre: TheatreFloat;

  flowerScaleIntro = { value: 0.0 }
  flowerScaleOutro = { value: 1.0 }
  flowerScaleIntroTheatre: TheatreFloat;
  flowerScaleOutroTheatre: TheatreFloat;

  flowerScaleDistance = { value: 0.0 }
  flowerScaleDistanceTheatre: TheatreFloat;

  sceneId = 1;

  /// #if DEBUG
  public static guiFolder: Gui;
  /// #endif

  constructor(renderer: Renderer, id: number) {
    super(renderer, id);
    this.stepValues = JUMP_STEPS;
    /// #if DEBUG
    Scene1.guiFolder = gui.folder("Scene 1");
    /// #endif

    this.flowerManager = new FlowerManager(this.renderer);

    this.background = new Background(this.renderer, BackgroundType.LINEAR_3_STOPS);
    this.background.topColor = vec4.fromValues(...BACKGROUND_TOP_COLOR, 0.58);
    this.background.middleColor = vec4.fromValues(...BACKGROUND_MIDDLE_COLOR, 0.52);
    this.background.bottomColor = vec4.fromValues(...BACKGROUND_BOTTOM_COLOR, 0.4);
    this.background.setTransitionColors(
      vec4.fromValues(...BACKGROUND_TOP_COLOR_OUTRO, 0.58),
      vec4.fromValues(...BACKGROUND_MIDDLE_COLOR_OUTRO, 0.52),
      vec4.fromValues(...BACKGROUND_BOTTOM_COLOR_OUTRO, 0.4)
    );
    this.background.setIntroColors(
      vec4.fromValues(...BACKGROUND_TOP_COLOR_INTRO),
      vec4.fromValues(...BACKGROUND_MIDDLE_COLOR_INTRO),
      vec4.fromValues(...BACKGROUND_BOTTOM_COLOR_INTRO)
    );
    this.background.setOutroColors(
      vec4.fromValues(...BACKGROUND_S2_TOP_COLOR, BACKGROUND_S2_TOP_ALPHA),
      vec4.fromValues(...BACKGROUND_S2_MIDDLE_COLOR, BACKGROUND_S2_MIDDLE_ALPHA),
      vec4.fromValues(...BACKGROUND_S2_BOTTOM_COLOR, BACKGROUND_S2_BOTTOM_ALPHA)
    );
    this.background.setUseClampedMix(true);

    this.sheetPerfectVariants[0] = AppService.state.machine.context.theatreProject.project.sheet("scene1-perfect-small");
    this.sheetPerfectVariants[1] = AppService.state.machine.context.theatreProject.project.sheet("scene1-perfect-medium");
    this.sheetPerfectVariants[2] = AppService.state.machine.context.theatreProject.project.sheet("scene1-perfect-large");

    this.flowerManager.setAlternateSheet(this.sheetPerfectVariants);

    this.energyParticles = new ParticlesField(this.renderer, 300, 100, vec3.fromValues(0.17, 0.08, 0.08), 3, this.sheetSuccess, this.sheetIntro, this.sheetOutro);

    this.cameraSystem = new Scene1CameraSystem(this, this.sheetPerfect, this.sheetSuccess, this.sheetIntro, this.sheetOutro);

    this.postProcessSystem = new Scene1PostProcessing(this.renderer, this.sheetPerfectVariants, this.sheetSuccess);

    /// #if DEBUG
    const PARAMS = {
      topColor: this.background.topColor,
      middleColor: this.background.middleColor,
      bottomColor: this.background.bottomColor,
    };
    const f = Scene1.guiFolder.folder("Background");
    f.addColor(PARAMS, "topColor").onChange((v) => {
      this.background.topColor.set(v);
      this.background.transitionTopColor.set(v);
    });
    f.addColor(PARAMS, "middleColor").onChange((v) => {
      this.background.middleColor.set(v);
      this.background.transitionMiddleColor.set(v);
    });
    f.addColor(PARAMS, "bottomColor").onChange((v) => {
      this.background.bottomColor.set(v);
      this.background.transitionBottomColor.set(v);
    });
    /// #endif
  }

  // --LOAD--

  override async load(): Promise<any> {
    console.log("start load scene 1")
    this.lights = new Scene1Lights(this.renderer);
    this.matOverride = new MaterialOverrideExtension();

    // Load GLTF Scene
    this.resource = new GltfResource(this.path, this.renderer.gl, {
      defaultTextureFilter: this.renderer.gl.LINEAR_MIPMAP_LINEAR,
      extensions: [this.matOverride],
    });
    this.gltf = await this.resource.load();

    // Load Dandelion
    this.dandelionResource = new GltfResource(this.dandelionPath, this.renderer.gl, {
      defaultTextureFilter: this.renderer.gl.NEAREST
    });
    this.flower = await this.dandelionResource.load();

    // Set Texture Filter
    const texA = this.flower.getAllElements().filter(element => {
      if (element.gltftype === GltfTypes.TEXTURE) {
        const el = element as Texture;
        if (el.source.name === "Flower_01_DiffuseDouble") return true;
      }
      return false;
    });
    for (const element of texA) {
      const tex = element as Texture;
      tex.glTexture.bind();
      tex.glTexture.setFilter(false);
    }

    // Load Butterfly
    this.butterfly = new Butterfly();
    await this.butterfly.load(this.renderer, this.flowerManager);

    this.butterfly.sheetPerfect = this.sheetPerfect;
    this.butterfly.sheetSuccess = this.sheetSuccess;
    this.butterfly.sheetPerfectVariants = this.sheetPerfectVariants;

    // Load Clouds
    this.clouds = new Clouds(this.sheetPerfect, this.sheetSuccess, this.sheetIntro, this.sheetOutro);
    await this.clouds.load(this.renderer);

    // Load Background
    await this.background.load();
    this.background.sheetSuccess = this.sheetSuccess;
    this.background.sheetIntro = this.sheetIntro;
    this.background.sheetOutro = this.sheetOutro;

    // Load Camera System
    this.cameraSystem.load(this.renderer);

    // On Loaded Call
    this.onLoaded();
  }

  override onLoaded(): void {
    super.onLoaded();

    // Setup Flower Instancing
    for (const renderable of this.flower.renderables) {
      const flowerInstancing = new FlowerInstancing(this.renderer, renderable.mesh.primitives, this.gltf.getNode("EmptiesRoot"), this.flowerManager);
      flowerInstancing.setupMaterial(this.flower, this.renderer.scene.lighting);
      this.flowerInstancingArray.push(flowerInstancing);
    }

    this.background.onLoaded();
  }

  // --START/STOP--

  override start(): void {
    super.start();
    const hasReachedPortail = AppService.state.getSnapshot().context.hasReachedPortail;
    AudioManager.fadeInWithDelay(SCENE_AUDIO_AMBIENT_ID[this.id - 1], AMBIENT_VOLUME, hasReachedPortail ? 2000 : 19000, 3);
    AudioManager.fadeInWithDelay(SCENE_AUDIO_AMBIENT_LAYER_ID[this.id - 1], AMBIENT_VOLUME - 0.15, hasReachedPortail ? 2000 : 19000, 3);
    AudioManager.fadeOutWithDelay(AUDIO_ID.INTRO, 17000, 1000);

    if (this.waitingStart) return;

    this.flowerScaleIntroTheatre = new TheatreFloat(this.flowerScaleIntro, this.sheetIntro, "Flower Scale Intro");
    this.flowerScaleOutroTheatre = new TheatreFloat(this.flowerScaleOutro, this.sheetOutro, "Flower Scale Outro");
    this.flowerScaleDistanceTheatre = new TheatreFloat(this.flowerScaleDistance, this.sheetSuccess, "Flower Scale Distance");

    this.clouds.start();
    this.butterfly.start();
    this.flowerManager.start();

    this.postProcessSystem.start();
    this.cameraSystem.start(this.butterfly);
    this.energyParticles.start(vec3.fromValues(0, 0, 0));

    this.background.start();

    this.gltf.root.add(this.renderer.scene.lighting.root);
    this.lights.start(this.renderer.scene.lighting);

    // this.background.gltf.root.scale.set([20, 20, 20]);
    // this.background.gltf.root.invalidate();
    // this.background.gltf.root.updateWorldMatrix();

    Background.transition.value = 0;
    Background.transition.startV = Background.transition.value;
  }

  override stop(): void {
    super.stop();

    this.lights.stop();
    this.clouds.stop();
    this.lights.stop();
    this.butterfly.stop();
    this.cameraSystem.stop();
    this.flowerManager.stop();
    this.postProcessSystem.stop();
    this.background.stop();
    this.energyParticles.dispose();
    this.gltf.root.remove(this.renderer.scene.lighting.root);

    this.flowerScaleIntroTheatre?.dispose();
    this.flowerScaleOutroTheatre?.dispose();
    this.flowerScaleDistanceTheatre?.dispose();
  }

  // --STATE--

  override changeState = async (state: any) => {
    if (this.previousState === toStatePaths(state.value)[0].join(".")) return;
    else this.previousState = toStatePaths(state.value)[0].join(".");

    this.checkOutro(state);

    if (state.matches("scene.interacting.perfect")) {
      this.release();
    }
  };

  override changeStep(step: number): void {
    super.changeStep(step);

    if (this.renderer.scene.isGoingBack) return;
    if (step === 2) {
      cameraShake(this.renderer.camera, 0.5, 0.05);
    }
    if (step === 3) {
      cameraShake(this.renderer.camera, 0.8, 0.1);
    }
    if (step === 4) {
      cameraShake(this.renderer.camera, 0.8, 0.15);
    }
  }

  release() {
    if (this.renderer.scene.blockRelease) return;
    window.clearTimeout(this.unblockReleaseTO);
    window.clearTimeout(this.unblockDownReleaseTO);
    this.butterfly.release(this.holdingPercent);

    this.renderer.scene.blockRelease = true;
    this.renderer.scene.blockHold = true;
    this.renderer.scene.blockHoldDown = true;

    this.jumpCounter++;

    AudioManager.stopHold(this.id);

    const variant = this.holdingPercent < JUMP_STEPS[1] ? 0 : this.holdingPercent < JUMP_STEPS[2] ? 1 : 2;
    // console.log("perfect interaction " + variant);
    const randomLine = Math.floor(Math.random() * JUMP_SOUND_LIST.length);
    const randomVariant = Math.floor(Math.random() * JUMP_SOUND_LIST[randomLine].length);
    if (variant === 0) {
      cameraShakeWithLookAt(this.renderer.camera, this.cameraSystem.cameraLookAt, 0.5, 0.01, 0.01);
      AudioManager.playReactions(JUMP_SOUND_LIST[randomLine][randomVariant], UI_VOLUME);
    }
    if (variant === 1) {
      cameraShakeWithLookAt(this.renderer.camera, this.cameraSystem.cameraLookAt, 0.8, 0.2, 0.15);
      this.firstReleaseDone ? AudioManager.playReactions(JUMP_SOUND_LIST[randomLine][randomVariant], UI_VOLUME) : (this.firstReleaseDone = true, AudioManager.playVoice(this.id, 3, VOICE_VOLUME));
    }
    if (variant === 2) {
      cameraShakeWithLookAt(this.renderer.camera, this.cameraSystem.cameraLookAt, 1.5, 0.4, 0.2);
      AudioManager.playReactions(JUMP_SOUND_LIST[randomLine][randomVariant], UI_VOLUME);
    }
    this.checkFirstPerfect();
    this.sheetPerfectVariants[variant]?.sequence.play().then(async () => {
      this.checkRelease();
      this.resetHoldTime();
      this.renderer.scene.blockRelease = false;
      this.unblockDownReleaseTO = window.setTimeout(() => {
        if (this.renderer.scene.isTitlePlaying.value) return;
        this.renderer.scene.blockHold = false;
        if (this.renderer.scene.isHolding) AudioManager.playHold(this.id, this.renderer.scene.holdValue);
      }, BLOCK_HOLD_AFTER_RELEASE_TIME);
      this.unblockReleaseTO = window.setTimeout(() => {
        if (this.renderer.scene.isTitlePlaying.value) return;
        this.renderer.scene.blockHoldDown = false;
      }, BLOCK_HOLD_DOWN_AFTER_RELEASE_TIME);
    });
  }

  override onMouseMove = (e: MouseEvent) => {
    this.mousePosition.x = e.clientX;
    this.mousePosition.y = e.clientY;
    this.butterfly.onMouseMove(e);
    this.lights.onMouseMove(e);
  }

  // --LIGHTING--

  override setupLighting() {
    const materials = [] as Material[];
    for (const renderable of this.gltf.renderables) {
      for (const mat of renderable.materials) {
        if (materials.indexOf(mat) === -1) {
          materials.push(mat);
        }
      }
    }
    for (const material of materials) {
      this.renderer.scene.lighting.setupMaterial(material);
    }
    this.butterfly.setupLighting(this.renderer.scene.lighting);
    this.lights.start(this.renderer.scene.lighting);
  }

  // --PRERENDER/RENDER--

  override preRender(): void {
    if (!this.isLoaded) return;

    super.preRender();
    const cam: Camera = this.renderer.cameras.camera;

    this.butterfly.preRender();
    this.cameraSystem.preRender(cam, this.butterfly.node.position, this.isIntroPlaying, this.isOutroPlaying);
    this.energyParticles.preRender();
    this.postProcessSystem.preRender(this.cameraSystem.ratioOutro.value);

    // Update instancing
    for (const flowerInstancing of this.flowerInstancingArray) {
      // flowerInstancing.zDepth.maxDistUniform.set(flowerInstancing.zDepthMaxDist);
      // flowerInstancing.ambientChunk.maxDistUniform.set(flowerInstancing.zDepthMaxDist);
      if (this.isIntroPlaying) flowerInstancing.instanceChunk.uScaleUniform.set(this.flowerScaleIntro.value);
      if (this.isOutroPlaying) flowerInstancing.instanceChunk.uScaleUniform.set(this.flowerScaleOutro.value);
      // flowerInstancing.instanceChunk.minDistScaleUniform.set(this.flowerScaleDistance.value);
      flowerInstancing.preRender(cam);
    }

    this.clouds.preRender(cam);
    this.lights.preRender(this.butterfly.node.position);

    if (this.isOutroPlaying) {
      for (const v of this.renderer.postprocess.frame.borderWidth) {
        v[0] *= 1 - this.cameraSystem.ratioOutro.value;
        v[1] *= 1 - this.cameraSystem.ratioOutro.value;
        v[2] *= 1 - this.cameraSystem.ratioOutro.value;
        v[3] *= 1 - this.cameraSystem.ratioOutro.value;
      }
    }
  }

  override rttPass(): void {
    if (!this.isLoaded) return;

    this.renderer.scene.lighting.lightSetup.prepare(this.renderer.gl);
    this.renderer.scene.lighting.renderLightmaps((ctx: RenderContext) => {
      this.render(ctx);
    });
  }

  override render(ctx: RenderContext): void {
    if (!this.isLoaded) return;

    this.gltf.root.invalidate();
    this.gltf.root.updateWorldMatrix();

    this.background.render(ctx);
    this.butterfly.render(ctx);

    for (const renderable of this.gltf.renderables) {
      renderable.render(ctx.gl, ctx.camera, ctx.mask, ctx.pass, ctx.glConfig);
    }

    this.clouds.render(ctx);
    this.energyParticles.render(ctx);

    for (const flowerInstancing of this.flowerInstancingArray) {
      flowerInstancing.render(ctx);
    }
  }
}
