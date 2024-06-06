import Fbo from "nanogl/fbo";
import Node from "nanogl-node";
import Delay from "@/core/Delay";
import Camera from "nanogl-camera";
import Program from "nanogl/program";
import Renderer from "@webgl/Renderer";
import { vec2 } from "gl-matrix";
import Texture2D from "nanogl/texture-2d";
import Programs from "@webgl/glsl/programs";
import Viewport from "@/store/modules/Viewport";
import ArrayBuffer from "nanogl/arraybuffer";
import IndexBuffer from "nanogl/indexbuffer";
import ArchivesManager from "./ArchivesManager";
import OrthographicLens from "nanogl-camera/ortho-lens";
import { SpriteSheetManager } from "./SpriteSheetManager";
import GLState, { LocalConfig } from "nanogl-state/GLState";
import { ArchivesMap } from "@webgl/activities/Archives/ArchivesMap";

const LOOP_ALPHA_DELAY_IN = 800;
const LOOP_ALPHA_DELAY_OUT = 400;
const NEXT_START_FRAME_PERC = 0.85;

type AtlasLayer = {
  texture: Texture2D;
  images: HTMLImageElement[];
  isLoop: boolean;
  isShaking: boolean;
  allLoaded?: boolean;
}

export default class Archive {
  cfg: LocalConfig;
  prg: Program;
  buffer: ArrayBuffer;
  bufferIndex: IndexBuffer;

  archiveCam: Camera<OrthographicLens>;

  private _noiseTex: Texture2D;
  atlas = Array(4) as AtlasLayer[];
  worker: Worker;
  public allImgLoaded = false

  node: Node;
  quadData: Float32Array;

  time = 0;

  canShowLoop = false;
  loopAlpha = 0;

  viewport = [0, 0]

  private isAnimOut = false

  private mouseCoord = vec2.create();

  private animationEndedPromise: Promise<void>;
  private resolveAnimationEnded: () => void;

  private canNextEnterPromise: Promise<void>;
  private resolveCanNextEnter: () => void;

  public fbo?: Fbo = null;

  private spriteManager: SpriteSheetManager;

  constructor(
    private renderer: Renderer,
    private cam: Camera<OrthographicLens>,
    public archiveIdx: number,
  ) {
    this.quadData = new Float32Array([
      -1.0, -1.0, 1.0, 0.0, 0.0,
      1.0, -1.0, 1.0,  1.0, 0.0,
      1.0, 1.0, 1.0, 1.0, 1.0,
      -1.0, 1.0, 1.0, 0.0, 1.0,
    ]);

    this.time = 0;

    this.node = new Node();

    this.prg = Programs(this.renderer.gl).get("archives");

    this.worker = ArchivesManager.getWorker();

    // this.createTextures();
    this._noiseTex = this.renderer.scene.texturePool.get("perlinNoise").texture;

    this.cfg = GLState.get(renderer.gl).config()
      .depthMask(false)
      .enableDepthTest(false)
      .enableBlend(true)
      .blendFunc(renderer.gl.ONE, renderer.gl.ONE_MINUS_SRC_ALPHA);

    this.spriteManager = new SpriteSheetManager(renderer, ArchivesMap[archiveIdx], this.worker, archiveIdx, [], () => {}, () => (this.allImgLoaded = true));
  }

  public handleWorkerMessage(imageBase64: string, layerIndex: number, frameIndex: number) {
    this.spriteManager.handleWorkerMessage(imageBase64, layerIndex, frameIndex);
  }

  initBuffers() {
    this.buffer = new ArrayBuffer(this.renderer.gl, this.quadData);
    this.bufferIndex = new IndexBuffer(this.renderer.gl, this.renderer.gl.UNSIGNED_SHORT, new Uint16Array([0, 1, 2, 0, 2, 3]));

    this.buffer.attrib("aPosition", 3, this.renderer.gl.FLOAT);
    this.buffer.attrib("aTexCoord", 2, this.renderer.gl.FLOAT);
  }

  private setFbo() {
    this.fbo = new Fbo(this.renderer.gl);
    this.fbo.attachColor();

    const colorTex = this.fbo.getColorTexture();
    colorTex.setFilter(false, false, false);
    colorTex.bind();
    colorTex.setFormat(this.renderer.gl.RGBA);
    colorTex.repeat();
  }

  public async startAnimation() {
    if (this.isAnimOut) return;
    this.spriteManager.updateLoopState({
      hasStarted: true,
      isPlaying: true,
      isLoopPlaying: false,
      canContinue: false
    });
    await Delay(LOOP_ALPHA_DELAY_IN);
    if (this.isAnimOut) return;
    this.canShowLoop = true;
    this.spriteManager.updateLoopState({
      hasStarted: true,
      isPlaying: true,
      isLoopPlaying: true,
      canContinue: false
    });
  }

  public async resumeAnimation() {
    this.isAnimOut = true;
    this.spriteManager.updateLoopState({
      hasStarted: true,
      isPlaying: true,
      isLoopPlaying: true,
      canContinue: true
    });
    // this.canContinue = true;
    // this.isPlaying = true;
    await Delay(LOOP_ALPHA_DELAY_OUT);
    this.canShowLoop = false;
  }

  public resetAnimation() {
    this.time = 0;
    this.canShowLoop = false;
    this.isAnimOut = false;
    this.loopAlpha = 0;
    this.spriteManager.reset();
  }

  onEndAnim() {
    this.isAnimOut = false;
    this.resolveAnimationEnded?.();
  }

  canNextEnter(): Promise<void> {
    return this.canNextEnterPromise;
  }
  animationEnded(): Promise<void> {
    if (!this.animationEndedPromise) return Promise.resolve();
    return this.animationEndedPromise;
  }

  // --UPDATE UNIFORMS--

  private updateLoopAlpha() {
    let increment = 1 / 60;
    increment *= this.canShowLoop ? 1 : -1;
    this.loopAlpha = Math.min(1, Math.max(0, this.loopAlpha + increment));
  }

  private updateMouseCoord() {
    const targetCoords = Viewport.isMobile ? [0, 0] : this.renderer.pointers.primary.coord.viewport;
    vec2.lerp(this.mouseCoord, this.mouseCoord, targetCoords, 0.02);
  }

  // --LOAD/UNLOAD--

  async load(): Promise<any> {
    return Promise.resolve();
  }

  unload(): void {
  }

  // --START/STOP--

  start(): void {
    this.initBuffers();

    this.setFbo();

    this.animationEndedPromise = new Promise<void>(resolve => {
      this.resolveAnimationEnded = resolve;
    });

    this.canNextEnterPromise = new Promise<void>(resolve => {
      this.resolveCanNextEnter = resolve;
    });

    const events = [
      { targetFrame: Math.floor((ArchivesMap[this.archiveIdx].totalFrames - 1) * NEXT_START_FRAME_PERC), callback: this.resolveCanNextEnter.bind(this) }
    ];

    this.spriteManager.setFramesEvents(events);
    this.spriteManager.setOnEndEvent(this.onEndAnim.bind(this));

    this.startAnimation();

  }

  stop(): void {
    this.buffer?.dispose();
    this.bufferIndex?.dispose();
    this.fbo?.dispose();
    this.spriteManager.stop();
    this.resolveAnimationEnded?.();
    this.resolveCanNextEnter?.();
    this.animationEndedPromise = null;
    this.canNextEnterPromise = null;
    this.resolveAnimationEnded = null;
    this.resolveCanNextEnter = null;
    this.isAnimOut = false;
    this.resetAnimation();
  }

  // --RENDER--
  preRender(): void {
    const viewport = this.renderer.viewport;
    this.fbo.resize(viewport.width, viewport.height);
    this.spriteManager.preRender();
    this.time = this.spriteManager.getTime();
    this.atlas = this.spriteManager.getAtlas();
  }

  rttPass(): void {
    this.renderer.gl.bindFramebuffer(this.renderer.gl.FRAMEBUFFER, null);
    if(this.atlas.some(atlas => !atlas.allLoaded)) return;

    this.cfg.apply();

    this.fbo.bind();
    this.fbo.defaultViewport();

    this.renderer.gl.clearColor(0, 0, 0, 0);
    this.renderer.gl.clear(this.renderer.gl.COLOR_BUFFER_BIT);

    this.prg.use();

    // this.updateTextures(this.currentFrame, this.currentLoopFrame);
    this.updateLoopAlpha();
    this.updateMouseCoord();

    this.prg.uTime?.(this.time);
    this.prg.uNoiseTex(this._noiseTex);
    this.prg.uLoopAlpha(this.loopAlpha);
    this.prg.uCoord(this.mouseCoord);

    this.prg.uTex1(this.atlas[0].texture);
    this.prg.uShaking1(this.atlas[0].isShaking);
    this.prg.uTex2(this.atlas[1].texture);
    this.prg.uShaking2(this.atlas[1].isShaking);
    this.prg.uTex3(this.atlas[2].texture);
    this.prg.uShaking3(this.atlas[2].isShaking);
    this.prg.uTex4(this.atlas[3].texture);
    this.prg.uShaking4(this.atlas[3].isShaking);

    this.buffer.attribPointer(this.prg);
    this.bufferIndex.bind();
    this.bufferIndex.drawTriangles();
  }

  render(): void {
    // this.renderer.gl.clear(this.renderer.gl.COLOR_BUFFER_BIT | this.renderer.gl.DEPTH_BUFFER_BIT);
    // if(this.atlas.some(atlas => !atlas.allLoaded)) return;

    // this.cfg.apply();

    // this.renderer.gl.clearColor(0, 0, 0, 0);
    // this.renderer.gl.clear(this.renderer.gl.COLOR_BUFFER_BIT);

    // this.cam.modelViewProjectionMatrix(M4, this.node._wmatrix);
    // this.prg.use();
    // this.prg.uMVP(M4);

    // this.updateTextures(this.currentFrame, this.currentLoopFrame);
    // this.prg.uTex1(this.atlas[0].texture);
    // this.prg.uTex2(this.atlas[1].texture);
    // this.prg.uTex3(this.atlas[2].texture);
    // this.prg.uTex4(this.atlas[3].texture);

    // this.buffer.attribPointer(this.prg);
    // this.bufferIndex.bind();
    // this.bufferIndex.drawTriangles();

    // this.renderer.gl.bindFramebuffer(this.renderer.gl.FRAMEBUFFER, null);
    // this.buffer.attribPointer(this.prg);
    // this.bufferIndex.bind();
    // this.bufferIndex.drawTriangles();
  }
}