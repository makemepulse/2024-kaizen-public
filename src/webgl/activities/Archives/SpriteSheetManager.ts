import { getImageFormat } from "@/utils/Image";
import Renderer from "@webgl/Renderer";
import AssetDatabase from "@webgl/resources/AssetDatabase";
import Texture2D from "nanogl/texture-2d";
import Time from "@webgl/Time";


export type SpritesObject = {
  fps: number;
  loopFps: number;
  endFrameIn?: number;
  totalFrames: number;
  loopFrames: number;
  layers: {
    path: string;
    isMultiply: boolean;
    isLoop: boolean;
    isShaking: boolean;
  }[];
}

export type AtlasLayer = {
  texture: Texture2D;
  images: HTMLImageElement[];
  isLoop: boolean;
  isShaking: boolean;
  allLoaded?: boolean;
}

export type FrameEvent = {
  targetFrame: number | "last";
  callback: () => void;
}

export class SpriteSheetManager {
  firstTextureLoaded: boolean;
  framerate: number;
  loopFramerate: number;
  frameStop?: number;
  totalFrames= 0;
  totalLoopFrames = 0;
  public allImgLoaded = false;

  time = 0;
  loopTime = 0;
  frame = 0;

  currentFrame = 0;
  currentLoopFrame = 0;
  lastLoopFrameDrawn = -1;
  lastFrameDrawn = -1;

  hasStarted = false;
  isPlaying = false;
  canContinue = false;
  isLoopPlaying = false;

  atlas: AtlasLayer[];

  public isReverse = false;

  constructor(
    private renderer: Renderer,
    private spiteObject: SpritesObject,
    private worker: Worker,
    public key: string | number,
    private frameEvents: FrameEvent[] = [],
    private onEndEvent: () => void = () => {},
    private onLoaded: () => void = () => {},
    private handleWorkerLocally: boolean = false

  ) {
    this.createTextures();
    if(handleWorkerLocally) {
      this.worker.onmessage = (e) => {
        const { imageBase64, layerIndex, frameIndex } = e.data;
        this.handleWorkerMessage(imageBase64, layerIndex, frameIndex);
      };
    }
  }


  async createTextures() {
    const { fps, loopFps, layers, endFrameIn, totalFrames, loopFrames } = this.spiteObject;
    this.firstTextureLoaded = false;
    this.framerate = fps;
    this.loopFramerate = loopFps;
    this.frameStop = endFrameIn;
    this.totalFrames = totalFrames;
    this.totalLoopFrames = loopFrames;

    this.atlas = Array(layers.length);

    // Initialize atlas layers and textures
    layers.forEach((layer, i) => {
      const tex = new Texture2D(this.renderer.gl, this.renderer.gl.RGBA);
      tex.bind();
      tex.clamp();
      this.atlas[i] = {
        images: Array(layer.isLoop ? loopFrames : totalFrames).fill(null),
        texture: tex,
        isLoop: layer.isLoop,
        isShaking: layer.isShaking,
      };
    });

    // Prepare and send image load requests to the worker
    const origin = window.location.origin;
    const extension = await getImageFormat("webp");
    const imageLoadRequests = layers.flatMap((layer, layerIndex) => {
      return Array.from({ length: layer.isLoop ? loopFrames : totalFrames }, (_, frameIndex) => {
        const idx = frameIndex > 9 ? frameIndex.toString() : `0${frameIndex}`;
        const assetPath = origin + "/" + AssetDatabase.getAssetPath(decodeURI(`${layer.path}/${extension}/${idx}.${extension}`));
        return { assetPath, layerIndex, frameIndex }; // Each request contains its own layer and frame index
      });
    });

    // Send the requests to the worker
    this.worker.postMessage({
      imageLoadRequests,
      key: this.key,
    });

    this.renderer.gl.pixelStorei(this.renderer.gl.UNPACK_FLIP_Y_WEBGL, true);
  }

  public handleWorkerMessage(imageBase64: string, layerIndex: number, frameIndex: number) {
    const img = new Image();
    img.onload = () => {
      if (frameIndex === 0) {
        this.atlas[layerIndex].texture.fromImage(img);
      }

      if (!this.firstTextureLoaded) this.firstTextureLoaded = true;

      this.atlas[layerIndex].images[frameIndex] = img;

      if (this.atlas[layerIndex].images.every(image => image != null)) {
        this.atlas[layerIndex].allLoaded = true;
      }

      if (this.atlas.every(atlas => atlas.allLoaded)) {
        this.allImgLoaded = true;
        this.onLoaded();
      }
    };

    img.src = imageBase64;
  }

  getAtlas() {
    return this.atlas;
  }

  getTime() {
    return this.loopTime;
  }

  updateLoopState(state: { hasStarted: boolean, isPlaying: boolean, isLoopPlaying: boolean, canContinue: boolean }) {
    const { hasStarted, isPlaying, isLoopPlaying, canContinue } = state;

    this.hasStarted = hasStarted;
    this.isPlaying = isPlaying;
    this.isLoopPlaying = isLoopPlaying;
    this.canContinue = canContinue;
  }

  setFramesEvents(events: FrameEvent[]) {
    this.frameEvents = events;
  }

  setOnEndEvent(callback: () => void) {
    this.onEndEvent = callback;
  }

  setOnLoaded(callback: () => void) {
    this.onLoaded = callback;
  }

  reset() {
    this.time = 0;
    this.loopTime = 0;
    this.frame = 0;
    this.currentFrame = 0;
    this.currentLoopFrame = 0;
    this.lastLoopFrameDrawn = -1;
    this.lastFrameDrawn = -1;
    this.hasStarted = false;
    this.isPlaying = false;
    this.canContinue = false;
    this.isLoopPlaying = false;
    this.isReverse = false;
    this.updateTextures(0, 0);
  }

  updateFrame() {
    this.updateTextures(this.currentFrame, this.currentLoopFrame);
  }

  // --- RENDERING ---

  private updateTextures(frame : number, loopFrame: number) {
    if (!this.allImgLoaded) return;

    const f = this.isReverse ? this.totalFrames - frame - 1 : frame;
    const lF = this.isReverse ? this.totalLoopFrames - loopFrame - 1 : loopFrame;

    if((this.lastLoopFrameDrawn === lF && this.isLoopPlaying) || (this.lastFrameDrawn === f && this.isPlaying)) return;
    this.lastLoopFrameDrawn = lF;
    this.lastFrameDrawn = f;
    for (let i = 0; i < this.atlas.length; i++) {
      const img = this.atlas[i].images[this.atlas[i].isLoop ? lF : f];
      this.atlas[i].texture.fromImage(img);
    }
  }

  start(): void {
  }

  stop(): void {
    // for (const layer of this.atlas) {
    //   layer.texture.dispose();
    // }
  }

  load() {
  }

  preRender(): void {
    if(!this.hasStarted) return;

    if(this.frameStop && this.currentFrame >= this.frameStop && !this.canContinue) { // Enf of animation In
      this.isPlaying = false;
    }

    for (const evt of this.frameEvents) {
      if(evt.targetFrame === this.currentFrame) {
        evt.callback?.();
      }
    }

    if(this.currentFrame >= this.totalFrames - 1) { // End of animation Out
      this.isPlaying = false;
      this.onEndEvent?.();
    }

    if(this.isLoopPlaying) {
      this.loopTime += Math.min(1/5, Time.dt / 1000);
      this.currentLoopFrame = Math.floor(this.loopTime * this.loopFramerate) % this.totalLoopFrames;
    }
    if(this.isPlaying) {
      this.time += Math.min(1/5, Time.dt / 1000);
      this.currentFrame = Math.min(Math.floor(this.time * this.framerate), this.totalFrames - 1);
    }

    this.updateTextures(this.currentFrame, this.currentLoopFrame);
  }
}