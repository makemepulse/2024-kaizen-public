import gsap from "gsap";
import { vec2, vec3 } from "gl-matrix";
import Fbo from "nanogl/fbo";
import Program from "nanogl/program";
import ArrayBuffer from "nanogl/arraybuffer";
import IndexBuffer from "nanogl/indexbuffer";
import Texture2D from "nanogl/texture-2d";
import Programs from "@webgl/glsl/programs";
import Renderer from "@webgl/Renderer";
import AssetDatabase from "@webgl/resources/AssetDatabase";
import { TextureResource } from "@webgl/resources/TextureResource";
import gui from "@webgl/dev/gui";
import { HexToNewVec3, HexToTmpVec3, HexToVec3 } from "@webgl/core/Color";
import { brushOpts, BrushOptKeys } from "./BrushesConfig";

// Based on https://github.com/oframe/ogl/blob/master/src/extras/Flowmap.js#L7

type FlowMapFBOs = {
  read: Fbo;
  write: Fbo;
}

export class FlowMap {
  private fbos = {} as FlowMapFBOs;
  public texture: Texture2D;
  private prg: Program;
  private renderPrg: Program;
  private buffer: ArrayBuffer;
  private iBuffer: IndexBuffer;
  private renderBuffer: ArrayBuffer;
  private renderIBuffer: IndexBuffer;
  isReady = false;

  private brush1Res: TextureResource;
  private brush1Tex: Texture2D;
  private noiseTex: Texture2D;
  private wNoise: Texture2D;

  public aspect = 1;
  public viewport = [1, 1]

  private needsClear = false;

  // FLOWMAP PARAMS
  public color: vec3 = HexToNewVec3(0xE9D251);
  public bgAlpha = 0;
  public angle = 0;
  public randAngleInfluence = 1;
  public velocity = vec2.create();
  public points: {coord: vec2; randAngle: number, alpha: number, size: number}[] = [];
  public noiseStep = 0.65;
  public alpha = 0.99;
  public accumulation = 1;
  // private scaleFactor = 7;
  public useRandomAngle = false;
  private channelToUse = vec3.fromValues(1, 0, 0);

  // RENDER PARAMS
  private isIntro = true;
  private grainVisibility = 0.6;

  private imgBrush: HTMLImageElement;
  private brushTextureName = "brush-02-2.png";

  constructor(private renderer: Renderer) {
    this.prg = Programs(this.renderer.gl).get("brush");

    this.brush1Res = AssetDatabase.getTexture("brushes/brush.png", renderer.gl, {
      alpha: true,
      smooth: false,
      wrap: "clamp"
    });
    this.noiseTex = this.renderer.scene.texturePool.get("fbmNoise").texture;
    this.wNoise = this.renderer.scene.texturePool.get("whiteNoise").texture;

    this.renderPrg = Programs(this.renderer.gl).get("brushRender");

    /// #if DEBUG
    this.createDebug();
    /// #endif
  }

  createDebug() {
    const fld = gui.folder("Brushes");

    fld.addColor(this, "color").onChange((v) => {
      // WIP for Lucas' test
      const hex = (v as any).slice(1);
      this.color = HexToTmpVec3(parseInt(hex, 16));
    });
    fld.add(this, "useRandomAngle");
    fld.add(this, "noiseStep", { min: 0, max: 1, step: 0.01 });
    fld.add(this, "randAngleInfluence", { min: 0, max: 1, step: 0.01 });
    fld.add(this, "accumulation", { min: 0, max: 1, step: 0.01 });
    fld.add(this, "alpha", { min: 0, max: 1, step: 0.01 });
    fld.add(this, "grainVisibility", { min: 0, max: 1, step: 0.01 });
    // fld.add(this, "scaleFactor", { min: 1, max: 100, step: 1 });
    fld.btn("Clear", () => this.needsClear = true);
    fld.btn("Show Texture", () => {
      this.imgBrush.style.display = "block";
    });

    if(!this.imgBrush?.src) {
      this.imgBrush = new Image();
      this.imgBrush.style.position = "fixed";
      this.imgBrush.style.top = "0";
      this.imgBrush.style.left = "0";
      this.imgBrush.style.display = "none";
      document.body.appendChild(this.imgBrush);
    }

    fld.add(this, "brushTextureName", { options: brushOpts }).onChange((v: string) => {
      console.log(v);
      const asset = AssetDatabase.getAssetPath(decodeURI(`brushes/${v}`));
      this.imgBrush.src = asset;
      this.imgBrush.onload = () => {
        this.brush1Tex.setFormat(this.renderer.gl.RGBA);
        this.brush1Tex.fromImage(this.imgBrush);
        // img.remove();
      };
    });
  }

  private initBuffer() {
    const quad = new Float32Array([
      -1.0, -1.0, 1.0, 0.0, 0.0,
      1.0, -1.0, 1.0,  1.0, 0.0,
      1.0, 1.0, 1.0, 1.0, 1.0,
      -1.0, 1.0, 1.0, 0.0, 1.0,
    ]);
    this.buffer = new ArrayBuffer(this.renderer.gl, quad);
    this.renderBuffer = new ArrayBuffer(this.renderer.gl, quad);
    this.iBuffer = new IndexBuffer(this.renderer.gl, this.renderer.gl.UNSIGNED_SHORT, new Uint16Array([0, 1, 2, 0, 2, 3]));
    this.renderIBuffer = new IndexBuffer(this.renderer.gl, this.renderer.gl.UNSIGNED_SHORT, new Uint16Array([0, 1, 2, 0, 2, 3]));
    this.buffer.attrib("aPosition", 3, this.renderer.gl.FLOAT);
    this.renderBuffer.attrib("aPosition", 3, this.renderer.gl.FLOAT);
    this.buffer.attrib("aTexCoord", 2, this.renderer.gl.FLOAT);
    this.renderBuffer.attrib("aTexCoord", 2, this.renderer.gl.FLOAT);
  }

  private setFbos() {
    this.fbos.read = new Fbo(this.renderer.gl);
    this.fbos.read.attachColor();
    let c = this.fbos.read.getColorTexture();
    c.setFormat(this.renderer.gl.RGBA);
    this.fbos.read.resize(this.viewport[0], this.viewport[1]);
    c.bind();
    // c.setFilter(false, false, false);
    this.fbos.write = new Fbo(this.renderer.gl);
    this.fbos.write.attachColor();
    c = this.fbos.write.getColorTexture();
    c.setFormat(this.renderer.gl.RGBA);
    this.fbos.write.resize(this.viewport[0], this.viewport[1]);
    c.bind();
    // c.setFilter(false, false, false);
    this.swap();
    this.isReady = true;
  }

  swap() {
    const tmp = this.fbos.read;
    this.fbos.read = this.fbos.write;
    this.fbos.write = tmp;
    this.texture = this.fbos.read.getColorTexture();
  }

  async load(): Promise<any> {
    await Promise.all([
      this.brush1Res.load(),
    ]);
    this.afterLoad();
  }

  afterLoad() {
    this.brush1Tex = this.brush1Res.texture;
  }

  onKeyDown(e: KeyboardEvent) {
    if(e.key === "r") {
      console.clear();
      this.needsClear = true;
    }
  }
  setViewport(aspect: number, viewport: number[]) {
    this.aspect = aspect;
    this.viewport = viewport;
    if(!this.isReady) return;
    this.fbos.read.resize(this.viewport[0], this.viewport[1]);
    this.fbos.write.resize(this.viewport[0], this.viewport[1]);
  }
  setIsIntro(isIntro: boolean) { this.isIntro = isIntro; }
  setChannelToUse(channel: vec3) { this.channelToUse.set(channel); }
  setAccumulation(acc: number) { this.accumulation = acc; }
  setNoiseStep(step: number) { this.noiseStep = step; }
  setUseRandomAngle(use: boolean) { this.useRandomAngle = use; }
  setAlphaBackground(alpha: number) { this.bgAlpha = alpha; }
  setBrushColor(color: number) { HexToVec3(color, this.color) }
  // setBrushSize(size: number) { this.scaleFactor = size; }
  setBrushTexture(texture: BrushOptKeys) {
    const filename = brushOpts[texture];
    const assetPath = AssetDatabase.getAssetPath(decodeURI(`brushes/${filename}`));
    if (!this.imgBrush) { this.imgBrush = new Image(); }

    this.imgBrush.src = assetPath;
    this.imgBrush.onload = () => {
      this.brush1Tex.setFormat(this.renderer.gl.RGBA);
      this.brush1Tex.fromImage(this.imgBrush);
    };
  }
  clearOldBrush() { this.needsClear = true }
  clearBrushs() {
    this.needsClear = true;
    const container = document.querySelector(".brush-container");
    if(container) {
      const imgs = container.querySelectorAll("img");
      for(let i = 0; i < imgs.length; i++) {
        gsap.to(imgs[i], {
          duration: 0.5,
          delay: i * 0.1,
          autoAlpha: 0,
          ease: "quart.out",
          onComplete: () => imgs[i].remove()
        });
      }
    }
  }

  start() {
    this.setFbos();
    this.initBuffer();
    //TODO: Remove
    /// #if DEBUG
    // window.addEventListener("keydown", this.onKeyDown.bind(this));
    /// #endif
  }

  stop() {
    this.buffer.dispose();
    this.iBuffer.dispose();
    // this.prg.dispose();
    // this.renderPrg.dispose();
    this.fbos.read.dispose();
    this.fbos.write.dispose();
    this.brush1Tex.dispose();
    this.noiseTex.dispose();
    /// #if DEBUG
    window.removeEventListener("keydown", this.onKeyDown.bind(this));
    /// #endif
  }

  preRender() {
    if(!this.isReady) return;

    if(this.needsClear) {
      this.needsClear = false;
      this.fbos.read.bind();
      this.fbos.read.defaultViewport();
      this.renderer.gl.clearColor(0, 0, 0, 0);
      this.renderer.gl.clear(this.renderer.gl.COLOR_BUFFER_BIT);
    }
  }

  rttPass() {
    if(!this.isReady) return;
    if(this.points.length > 0) {
      for(let i = 0; i < this.points.length; i++) {
        const {coord, randAngle, alpha, size} = this.points[i];
        this.fbos.write.bind();
        this.fbos.write.defaultViewport();
        this.renderer.gl.clearColor(0, 0, 0, 0);
        this.renderer.gl.clear(this.renderer.gl.COLOR_BUFFER_BIT);
        this.prg.use();
        this.prg.uTex(this.fbos.read.getColorTexture());
        this.prg.uCoord(coord);
        this.prg.uAspect(this.aspect);
        this.prg.uVelocity(this.velocity);
        this.prg.uNoiseStep(this.noiseStep);
        this.prg.uAccumulation(this.accumulation);
        this.prg.uAngle(this.angle);
        this.prg.uScale(size);
        this.prg.uBrush1(this.brush1Tex);
        this.prg.uRandAngle(randAngle);
        this.prg.uRandAngleInfluence(this.randAngleInfluence);
        this.prg.uRandAngleEnabled(this.useRandomAngle);
        this.prg.uNoise(this.noiseTex);
        this.prg.uChanToUse(this.channelToUse);
        this.prg.uAlpha(alpha);

        this.buffer.attribPointer(this.prg);
        this.iBuffer.bind();
        this.iBuffer.drawTriangles();

        this.swap();
        // this.renderer.gl.bindFramebuffer(this.renderer.gl.FRAMEBUFFER, null);
      }
    }
  }

  render() {
    if(!this.isReady) return;
    this.renderPrg.use();
    this.renderPrg.uTex(this.texture);
    this.renderPrg.uGrainVisibility(this.grainVisibility);
    this.renderPrg.uWNoise(this.wNoise);
    this.renderPrg.uAspect(this.aspect);
    this.renderPrg.uColor(this.color);
    this.renderPrg.uColorIntro1(HexToTmpVec3(0xE9D251));
    this.renderPrg.uColorIntro2(HexToTmpVec3(0xFF7882));
    this.renderPrg.uIsIntro(this.isIntro);
    this.renderPrg.uBackgroundAlpha(this.bgAlpha);
    this.renderPrg.uBrushAlpha(this.alpha);
    this.renderBuffer.attribPointer(this.renderPrg);
    this.renderIBuffer.bind();
    this.renderIBuffer.drawTriangles();
  }
}