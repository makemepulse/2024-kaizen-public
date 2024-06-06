import Renderer from "@webgl/Renderer";
import Time from "@webgl/Time";
import Programs from "@webgl/glsl/programs";
import ArrayBuffer from "nanogl/arraybuffer";
import Program from "nanogl/program";
import { Activity } from "@webgl/activities/Activity";
import Texture2D from "nanogl/texture-2d";
import Camera from "nanogl-camera";
import OrthographicLens from "nanogl-camera/ortho-lens";
import { mat4, vec3 } from "gl-matrix";
import IndexBuffer from "nanogl/indexbuffer";
import Node from "nanogl-node";
import GLState, { LocalConfig } from "nanogl-state/GLState";
import AppService from "@/services/AppService";
import { ISheet } from "@theatre/core";
import TheatreBool from "@webgl/theatre/TheatreBool";
import WebglLoading from "@/store/modules/WebglLoading";
import { loadImage } from "./IntroUtils";
import { isAvifSupported } from "@/utils/Image";
import { CursorState, setCursor } from "@/store/modules/Cursor";


const M4 = mat4.create();
const ORIGIN = vec3.create();
const SPRITE_FPS = 30;
export default class DotsLoader implements Activity {

  node: Node;
  prg: Program;
  cfg: LocalConfig;

  noiseTex: Texture2D;
  wNoise: Texture2D;
  cam: Camera<OrthographicLens>;
  time: number;
  globalTime: number;
  aspectRatio: number;
  viewport = [0, 0]

  buffer: ArrayBuffer;
  bufferIndex: IndexBuffer;
  quadData: Float32Array;

  screenW: number;
  boxSize: number;
  box: { xMin: number, xMax: number, y: number};
  dotSize: number;
  dotSizeScreen: number;
  dotsNode: Node[] = [];
  rootNode: Node;
  dotsColor: Texture2D[] = [];
  lastDotHovered = false;

  spriteTex: Texture2D;
  spriteParams = {
    currentDot: 0,
    isPlayingForward: true,
    dots: [
      {
        row: 0,
        col: 0,
        idx: 0,
        frame: 0,
        nbFrames: 24,
        tex: null as Texture2D,
        imgSource: null as HTMLImageElement,
        nbRows: 5,
        nbCols: 5,
      },
      {
        row: 0,
        col: 0,
        idx: 0,
        frame: 0,
        nbFrames: 24,
        tex: null as Texture2D,
        imgSource: null  as HTMLImageElement,
        nbRows: 5,
        nbCols: 5,
      },
      {
        row: 0,
        col: 0,
        idx: 0,
        frame: 0,
        nbFrames: 24,
        tex: null as Texture2D,
        imgSource: null  as HTMLImageElement,
        nbRows: 5,
        nbCols: 5,
      },
    ],
    lastFrame: -1,
    nbRows: 5,
    nbCols: 5,
    allDotsLoaded: false,
  }

  rootNodeTransforms = {
    scaleX: 1,
    scaleY: 1,
  }
  dotAnimation: gsap.core.Tween;

  introSheet: ISheet;
  introTransitionSheet: ISheet;

  hasStarted = false;
  canUpdate = false;

  targetFrame = 0;

  globalAlpha = { value: 1 };

  constructor(private renderer: Renderer) {
    this.prg = Programs(this.renderer.gl).get("dots");

    this.wNoise = this.renderer.scene.texturePool.get("whiteNoise").texture;
    this.noiseTex = this.renderer.scene.texturePool.get("perlinNoise").texture;

    this.cam = new Camera<OrthographicLens>(new OrthographicLens());

    this.cfg = GLState.get(this.renderer.gl).config()
      .depthMask(false)
      .enableDepthTest(false)
      .enableBlend(true)
      .blendFuncSeparate(this.renderer.gl.SRC_ALPHA, this.renderer.gl.ONE_MINUS_SRC_ALPHA, this.renderer.gl.ONE, this.renderer.gl.ONE_MINUS_SRC_ALPHA);
  }

  onResize() {
    // this.boxSize = Math.max(0.47, 570 / window.innerWidth);
    this.viewport = [window.innerWidth, window.innerHeight];
    // this.boxSize = (this.viewport[0] / this.viewport[1]) * 0.32 * 2;
    this.boxSize = 0.38 * 2;
    this.aspectRatio = window.innerWidth / window.innerHeight;
    this.screenW = Math.max(2, this.aspectRatio * 2);

    // this.boxSize = this.screenW;
    this.setCamera();
    this.createDots();
  }

  setCamera() {
    this.cam.lens.near = 0.1;
    this.cam.lens.far = 50;
    this.cam.z = 5;
    this.cam.lookAt(ORIGIN);
    const rx = Math.max(this.viewport[1] / this.viewport[0], 1.0);
    const ry = Math.max(this.viewport[0] / this.viewport[1], 1.0);
    const scale = 1;

    this.cam.lens.setBound(
      -scale * ry,
      scale * ry,
      -scale * rx,
      scale * rx
    );
    this.cam.updateWorldMatrix();
    this.cam.updateViewProjectionMatrix(
      this.renderer.viewport.width,
      this.renderer.viewport.height
    );
  }

  createQuad() {
    this.quadData = new Float32Array([
      -1.0 * 0.5, -1.0 * 0.5, 1.0, 0.0, 0.0,
      1.0 * 0.5, -1.0 * 0.5, 1.0,  1.0, 0.0,
      1.0 * 0.5, 1.0 * 0.5, 1.0, 1.0, 1.0,
      -1.0 * 0.5, 1.0 * 0.5, 1.0, 0.0, 1.0,
    ]);

    this.buffer = new ArrayBuffer(this.renderer.gl, this.quadData);
    this.bufferIndex = new IndexBuffer(this.renderer.gl, this.renderer.gl.UNSIGNED_SHORT, new Uint16Array([0, 1, 2, 0, 2, 3]));

    this.buffer.attrib("aPosition", 3, this.renderer.gl.FLOAT);
    this.buffer.attrib("aTexCoord", 2, this.renderer.gl.FLOAT);
  }

  createDots() {
    this.dotSize = 0.1742;
    const y = 0;
    this.box = {
      xMin: -(this.boxSize / 2),
      xMax: (this.boxSize / 2),
      y: y,
    };

    const rectPos = [
      {
        x: this.box.xMin + this.dotSize / 2 * 1.75,
        y,
      },
      {
        x: (this.box.xMin + this.dotSize / 2) + this.dotSize + (this.dotSize * 0.5), // pos of 1st point + width + offset relative to box width
        y,
      },
      {
        x: this.box.xMax - (this.dotSize / 2) * 1.8,
        y,
      }
    ];
    this.rootNode = new Node();

    this.dotsNode = [];
    for (let i = 0; i < rectPos.length; i++) {
      const pos = rectPos[i];
      const node = new Node();
      this.rootNode.add(node);
      node.position.set([pos.x, pos.y, 0]);
      node.scale.set([this.dotSize, this.dotSize, 1]);
      node.invalidate();
      node.updateWorldMatrix();
      this.dotsNode.push(node);
    }
  }


  // --- SET & LOAD TEXTURES ---

  async setDotsTexture(useAvif: boolean) {
    const urls = [
      `intro/dots/dot-1.${useAvif ? "avif" : "webp"}`,
      `intro/dots/dot-2.${useAvif ? "avif" : "webp"}`,
      `intro/dots/dot-3.${useAvif ? "avif" : "webp"}`,
    ];
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      const img = await loadImage(url);
      this.spriteParams.dots[i].imgSource = img;
    }
  }

  // ------

  // --- EVENTS ---

  onClick() {
    this.spriteParams.isPlayingForward = false;
  }

  async load(): Promise<any> {
    this.renderer.gl.pixelStorei(this.renderer.gl.UNPACK_FLIP_Y_WEBGL, true);
    const isAvif = await isAvifSupported();
    await Promise.all([
      // this.setBackground(),
      this.setDotsTexture(isAvif),
    ]);
  }

  unload(): void { }

  async start() {
    this.time = 0;
    this.globalTime = 0;

    this.onResize();
    this.createQuad();

    for (const dot of this.spriteParams.dots) {
      const tex = new Texture2D(this.renderer.gl, this.renderer.gl.RGBA);
      tex.setFilter(false, false, false);
      tex.fromImage(dot.imgSource);
      dot.tex = tex;
    }

    window.addEventListener("resize", this.onResize.bind(this));
    // window.addEventListener("click", this.onClick.bind(this));
    // window.addEventListener("touchstart", this.onClick.bind(this));

    this.hasStarted = true;
  }

  stop() {
    this.buffer.dispose();
    this.bufferIndex.dispose();

    for (const dot of this.spriteParams.dots) {
      dot.tex.dispose();
    }

    window.removeEventListener("resize", this.onResize.bind(this));
    // window.removeEventListener("click", this.onClick.bind(this));
    // window.removeEventListener("touchstart", this.onClick.bind(this));
  }

  startAnim() {
    this.canUpdate = true;
  }

  // RENDER

  updateLoadingDots(dt: number) {
    if (!this.spriteParams.isPlayingForward) return;

    // Check how many frames to draw based on loading
    const totalFramesToDraw = this.spriteParams.dots.reduce((acc, dot) => acc + dot.nbFrames, 0);
    const loadingPercentage = WebglLoading.loaded / WebglLoading.toLoad;
    const targetFrame = Math.floor(totalFramesToDraw * loadingPercentage);

    if(this.spriteParams.lastFrame === targetFrame || this.spriteParams.allDotsLoaded) return;
    this.time += dt;
    const frame = Math.min(this.spriteParams.lastFrame + 1, Math.floor(this.time * SPRITE_FPS)); // frame can't be higher than the prev frame + 1

    if(frame === this.spriteParams.lastFrame) return;
    this.spriteParams.lastFrame = frame;

    const currentDot = this.spriteParams.currentDot;
    this.spriteParams.dots[currentDot].frame = frame;

    const spriteDiff = this.spriteParams.dots.filter((dot, i) => i < currentDot).reduce((acc, dot) => acc + dot.nbFrames, 0);
    const currentSprite = frame - spriteDiff;
    this.spriteParams.currentDot = currentDot;

    if(frame - spriteDiff === this.spriteParams.dots[currentDot].nbFrames) {
      this.spriteParams.currentDot = Math.min(2, this.spriteParams.currentDot + 1);
    }

    if(frame === totalFramesToDraw) {
      this.spriteParams.allDotsLoaded = true;
      AppService.state.send("INTRO_DOTS_FINISHED");
    }

    if (currentSprite !== this.spriteParams.dots[currentDot].idx) {
      this.spriteParams.dots[currentDot].idx = currentSprite;
      this.spriteParams.dots[currentDot].row = Math.floor(currentSprite / this.spriteParams.nbRows);
      this.spriteParams.dots[currentDot].col = currentSprite % this.spriteParams.nbCols;
    }
  }

  revertLoadingAnimation(dt: number) {
    if(this.spriteParams.isPlayingForward || this.spriteParams.lastFrame === 0 || !this.spriteParams.allDotsLoaded) return; // Stop if animation is fully reverted or not loaded.

    this.time -= dt;
    let frame = Math.max(0, Math.floor(this.time * SPRITE_FPS)); // frame can't be lower than 0
    frame = Math.max(this.spriteParams.lastFrame - 1, frame); // avoid skipping frames

    if(frame === this.spriteParams.lastFrame) return; // No change, so exit.
    this.spriteParams.lastFrame = frame;

    // Determine the current dot and adjust its frame.
    let spriteAccumulatedFrames = 0;
    let currentDot = 0;
    for(let i = 0; i < this.spriteParams.dots.length; i++) {
      spriteAccumulatedFrames += this.spriteParams.dots[i].nbFrames;
      if(spriteAccumulatedFrames > frame) {
        currentDot = i;
        break;
      }
    }

    // if(spriteAccumulatedFrames === 72 && currentDot === 0)
    //   return;


    // Calculate the difference in frames for the current dot and the global frame count.
    const spriteDiff = this.spriteParams.dots.slice(0, currentDot).reduce((acc, dot) => acc + dot.nbFrames, 0);
    const currentSprite = frame - spriteDiff;
    this.spriteParams.currentDot = currentDot;
    this.spriteParams.dots[currentDot].frame = frame;

    // Update the dot's row and column based on the current sprite.
    if (currentSprite !== this.spriteParams.dots[currentDot].idx) {
      this.spriteParams.dots[currentDot].idx = currentSprite;
      this.spriteParams.dots[currentDot].row = Math.floor(currentSprite / this.spriteParams.nbRows);
      this.spriteParams.dots[currentDot].col = currentSprite % this.spriteParams.nbCols;
    }

    // Reset flags when the animation is fully reverted.
    if(frame === 0) {
      this.spriteParams.allDotsLoaded = false;
      AppService.state.send("CAN_START_INTRO_TIMELINE");
    }
  }

  updateDotTransform() {
    this.rootNode.scale.set([this.rootNodeTransforms.scaleX, this.rootNodeTransforms.scaleY, 1]);
    this.rootNode.invalidate();
    this.rootNode.updateWorldMatrix();
  }

  preRender(): void {
    if(!this.hasStarted || !this.canUpdate) return;

    const dt = Math.min(1/5, Time.dt / 1000);

    this.globalTime += dt;

    this.updateDotTransform();
    this.updateLoadingDots(dt);
    this.revertLoadingAnimation(dt);
  }

  rttPass(): void { }

  renderQuad(i: number): void {
    const spriteUsed = this.spriteParams.dots[i];
    const node = this.dotsNode[i];
    this.cam.modelViewProjectionMatrix(M4, node._wmatrix);

    this.prg.use();
    this.prg.uMVP(M4);
    this.prg.uTime(this.globalTime);
    this.prg.uWNoiseTex(this.wNoise);
    this.prg.uNoiseTex(this.noiseTex);

    this.prg.uDotTex(spriteUsed.tex);

    this.prg.uAlpha(this.globalAlpha.value);

    this.prg.uSpriteMaxColRow(spriteUsed.nbCols, spriteUsed.nbRows);
    this.prg.uSpriteCellSize(1 / spriteUsed.nbCols, 1 / spriteUsed.nbRows);
    this.prg.uSpriteCurrColRow(spriteUsed.col, spriteUsed.row);

    this.buffer.attribPointer(this.prg);
    this.bufferIndex.bind();
    this.bufferIndex.drawTriangles();

  }

  render() {
    this.cfg.apply();

    for (let i = 0; i < this.dotsNode.length; i++) {
      this.renderQuad(i);
    }
  }
}