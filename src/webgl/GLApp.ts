import Quality from "./core/Quality";
import GLView from "./GLView";
import type Renderer from "./Renderer";

export interface QualityLevel {
  postprocess: boolean,
  isVignetteBlur: boolean,
  fps: number,
  dpi: string
}

export default class GLApp {
  private static _instance: GLApp | null = null;

  glview: GLView;
  renderer: Renderer;
  quality: Quality<QualityLevel>;

  constructor() {

    


  }

  async createGlAppElements() {
    const canvas = document.createElement("canvas");
    this.glview = new GLView(canvas, { alpha: false });
    const { default: Renderer } = await import("./Renderer");
    this.renderer = new Renderer(this.glview);

    this.quality = new Quality<QualityLevel>([
      { postprocess: true, fps: 29, isVignetteBlur: false, dpi: "one" },
      { postprocess: true, fps: 50, isVignetteBlur: false, dpi: "one" },
      { postprocess: true, fps: 59, isVignetteBlur: false, dpi: "one" },
      { postprocess: true, fps: 29, isVignetteBlur: false, dpi: "full" },
      { postprocess: true, fps: 50, isVignetteBlur: false, dpi: "full" },
      { postprocess: true, fps: 59, isVignetteBlur: false, dpi: "full" },
      { postprocess: true, fps: 29, isVignetteBlur: true, dpi: "full" },
      { postprocess: true, fps: 50, isVignetteBlur: true, dpi: "full" },
      { postprocess: true, fps: 59, isVignetteBlur: true, dpi: "full" },
    ]);
    this.quality.maxQuality();
    this.quality.onChange.on(this._onQualityChange);
  }

  /**
   * implement loading here if the entry point has a "main" loading logic
   */
  load(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * start rendering loop on GLView
   */
  start(): void {
    this.glview.start();
  }

  startProfile() {
    this.quality.startAutoLevel();
  }

  _onQualityChange = (level: QualityLevel) => {
    // console.log("on quality change", level); // To debug quality settings
    this.renderer.postprocess.enabled = level.postprocess;
    // if (level.fps <= 30) {
    //   this.glview.profileStarted = true
    // }
    if (!level.isVignetteBlur)
      this.renderer.postprocess.post.remove(this.renderer.postprocess.vignetteblur);
    switch (level.dpi) {
    case "full":
      this.glview.setPixelRatio(window.devicePixelRatio);
      break;
    case "one":
      this.glview.setPixelRatio(1);
      break;
    case "low":
      this.glview.setPixelRatio(0.75);
      break;
    default:
      break;
    }
    this.glview.updateSize();
    this.glview.setTargetFps(level.fps);
    this.quality.setTargetFps(level.fps);

  }

  /**
   * stop rendering loop on GLView
   */
  stop(): void {
    this.glview.stop();
  }
}

/// #if DEBUG

if (module.hot) {
  module.hot.decline();
}

/// #endif
