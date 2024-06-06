import Rect from "nanogl-primitives-2d/rect";
import { Ref, ref } from "vue";

import lerp from "@/utils/Lerp";
import Time from "./Time";
import Delay from "@/core/Delay";
import type Scene from "./activities/Scene/Scene";
import Signal from "@/core/Signal";
import Renderer from "@webgl/Renderer";
import Lighting from "./engine/Lighting";
import RenderMask from "@webgl/core/RenderMask";
import RenderPass from "./core/RenderPass";
import type TrailManager from "./activities/Trail/TrailManager";
import SceneActivityManager from "@webgl/SceneActivityManager";
import { clamp } from "./math";
import { IScene } from "@webgl/engine/IScene";
import { RenderContext } from "@webgl/core/Renderer";
import { TextureResource } from "./resources/TextureResource";
import type TransitionToPortail from "./activities/Conclusion/TransitionToPortail";

type TexturePoolName = "tile" | "whiteNoise" | "perlinNoise" | "fractalNoise" | "turbulenceNoise" | "fbmNoise";

export type TexturePool = Map<TexturePoolName, TextureResource>;

export default class GameScene implements IScene {

  public isHolding = false
  public canHold = true;
  public wasHolding = false;
  public blockHold = false;
  public blockHoldDown = false;
  public wasBlockHold = false;
  public blockRelease = false;
  public isGoingBack = false;
  public wasGoingBack = false;
  public holdFactor = 1;
  public easeHoldDecrease = false;
  public holdingSequenceTime = 1
  public currentScene: Scene
  public texturePool: TexturePool = new Map();

  public transitionToPortail: TransitionToPortail;


  holdValue = 0
  hold = 0
  holdRef: Ref<number>
  holdDuration: Ref<number>
  canReleaseRef: Ref<boolean>
  currIntroPercentage: Ref<number>
  currOutroPercentage: Ref<number>

  isIntroPlaying: Ref<boolean>
  isOutroPlaying: Ref<boolean>
  isTitlePlaying: Ref<boolean>
  isTransitionToPortailPlaying: Ref<boolean>
  showTitle: Ref<boolean>
  firstRelease: Ref<boolean>
  activities: SceneActivityManager;

  trailManager: TrailManager;

  lighting: Lighting;
  quad: Rect;

  loaded = false

  onTouchActive: Signal<{ isLeft: boolean, isRight: boolean }> = new Signal<{ isLeft: boolean, isRight: boolean }>();

  constructor(public renderer: Renderer) {
    this.activities = new SceneActivityManager(this.renderer);
    this.quad = new Rect(this.renderer.gl);
    this.holdRef = ref(0);
    this.holdDuration = ref(0);
    this.currIntroPercentage = ref(0);
    this.currOutroPercentage = ref(0);
    this.canReleaseRef = ref(true);
    this.isIntroPlaying = ref(false);
    this.isOutroPlaying = ref(false);
    this.isTitlePlaying = ref(false);
    this.firstRelease = ref(false);
    this.isTransitionToPortailPlaying = ref(false);
    this.showTitle = ref(false);
    // this.createTexturePool();
  }

  // --LOAD/UNLOAD--

  async load(): Promise<any> {
    // Load Lighting
    const { default: TrailManager } = await import("./activities/Trail/TrailManager");
    this.trailManager = new TrailManager(this.renderer, this.texturePool);
    this.lighting = new Lighting(this.renderer.gl);
    await Promise.all([
      this.trailManager.load(),
      this.lighting.load(),
      ...Array.from(this.texturePool.values()).map(texRes => texRes.load())
    ]);

    this.trailManager.onLoaded();
    this.loaded = true;
  }

  async loadTransition() {
    const { default: TransitionToPortail } = await import("./activities/Conclusion/TransitionToPortail");
    this.transitionToPortail = new TransitionToPortail(this.renderer);
  }

  unload(): void { }

  // --TEXTURE POOL--

  async createTexturePool() {
    const AssetDatabase = (await import("./resources/AssetDatabase")).default;
    this.texturePool.set("tile", AssetDatabase.getTexture("textures/tile.webp", this.renderer.gl, { alpha: true }));
    this.texturePool.set("fbmNoise", AssetDatabase.getTexture("textures/fbm.webp", this.renderer.gl, { smooth: false }));
    this.texturePool.set("perlinNoise", AssetDatabase.getTexture("textures/perlinNoise.webp", this.renderer.gl, { alpha: true }));
    this.texturePool.set("fractalNoise", AssetDatabase.getTexture("textures/fractalNoise.jpg", this.renderer.gl, { alpha: true }));
    this.texturePool.set("turbulenceNoise", AssetDatabase.getTexture("textures/turbulenceNoise.webp", this.renderer.gl, { alpha: true }));

    const wNoise = AssetDatabase.getTexture("textures/wnoise.webp", this.renderer.gl, { smooth: false });
    wNoise.texture.setFormat(this.renderer.gl.LUMINANCE);
    this.texturePool.set("whiteNoise", wNoise);

    this.renderer.createPostProcess();
  }

  // --WARMUP--

  async warmup() {
    const activities = [this.activities.getActivity("scene1")];

    for (let i = 0; i < activities.length; i++) {
      activities[i].start();
      activities[i].preRender();
      activities[i].rttPass();
    }

    const camera = this.renderer.camera;
    const viewport = this.renderer.viewport;
    camera.updateViewProjectionMatrix(viewport.width, viewport.height);

    const gl = this.renderer.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    viewport.setupGl(gl);
    gl.clearColor(0.0, 0.0, 0.0, 0.0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    this.renderer.context.withCamera(this.renderer.camera);

    for (let i = 0; i < activities.length; i++) {
      activities[i].render(this.renderer.context.withMask(RenderMask.OPAQUE));
      activities[i].render(this.renderer.context.withMask(RenderMask.BLENDED).withPass(RenderPass.DEPTH));
    }

    for (let i = 0; i < activities.length; i++) {
      activities[i].stop();
    }

    await Delay(200);
  }

  prepareTransition(isTransitionToScene: boolean) {
    this.transitionToPortail.isTransitionToScene(isTransitionToScene);
    this.transitionToPortail.prepare();
  }

  playTransitionToPortail() {
    this.transitionToPortail.play();
  }

  // --RENDER--

  preRender(): void {
    if (!this.loaded) return
    this.transitionToPortail?.preRender();
    this.trailManager.preRender();

    const prevHoldValue = this.holdValue;
    this.wasGoingBack = this.isGoingBack;
    this.wasBlockHold = this.blockHold;
    this.canHold = !this.blockHold; // && !this.isGoingBack;
    this.canReleaseRef.value = !this.blockRelease && !this.blockHoldDown;
    this.isTransitionToPortailPlaying.value = this.transitionToPortail?.isPlaying || false;

    if (!this.blockHold) {
      const t = Time.scaledDt / 1000;

      this.holdFactor = this.isHolding && this.canHold
        ? 1
        : this.easeHoldDecrease
          ? lerp(this.holdFactor, -1, 0.05)
          : (this.blockHoldDown ? 0 : -1);

      const speedBoost = 1 // this.isGoingBack ? 1 : 2.5; // Add speed boost when decreasing so we don't have to wait too much for the hold to reach 0

      this.holdValue += t * this.holdFactor * speedBoost;

      this.holdValue = clamp(this.holdValue, 0, this.holdingSequenceTime);
      this.holdRef.value = this.holdValue / this.holdingSequenceTime;
      this.holdDuration.value = this.holdingSequenceTime;
      this.hold = this.holdValue;
    }

    this.isGoingBack = Math.sign(this.holdValue - prevHoldValue) < 0;

    for (const activity of this.activities.active) {
      activity.preRender();
    }

    this.wasHolding = this.isHolding;
  }

  rttPass(): void {
    if (!this.loaded) return
    for (const activity of this.activities.active) {
      activity.rttPass();
    }
  }

  render(context: RenderContext): void {
    if (!this.loaded) return;
    if (!this.trailManager.renderAbove) this.trailManager.render(context);
    for (const activity of this.activities.active) {
      activity.render(context);
    }
    if (this.trailManager.renderAbove) this.trailManager.render(context);
  }
}
