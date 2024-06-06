
import Signal from "@/core/Signal";
import ResizeObserver from "resize-observer-polyfill";
import { GLContext } from "nanogl/types";
import { fpsCtrl } from "./dev/gui/tweakpane";

/**
 * Limit frame dt
 * @param dt 
 * @returns 
 */
function clampDt(dt: number): number {
  if (dt > 1 / 5 || dt < 1 / 180) {
    dt = 1 / 60;
  }
  return dt;
}


function now() {
  return performance.now();
}



class GLView {

  pixelRatio: number
  gl: GLContext

  width: number
  height: number
  canvasWidth: number
  canvasHeight: number
  previousTime: number

  private _rafId: number
  private _playing: boolean
  private _resizeObs: ResizeObserver;

  onRender = new Signal<number>()
  onResize = new Signal<void>()

  targetFPS: number;
  fpsInterval: number;

  /**
   * 
   * @param cvs 
   * @param opts 
   */
  constructor(readonly canvas: HTMLCanvasElement, {
    depth = true,
    alpha = false,
    pixelRatio = -1
  } = {}) {


    if (pixelRatio < 0) {
      this.pixelRatio = Math.min(3.0, window.devicePixelRatio);
    } else {
      this.pixelRatio = pixelRatio;
    }

    const opts: WebGLContextAttributes =
    {
      depth: depth,
      antialias: false,
      stencil: false,
      alpha: alpha,
      premultipliedAlpha: false,
      preserveDrawingBuffer: false,
      powerPreference: "high-performance"

    };

    /**
     * @type {WebGLRenderingContext}
     */
    this.gl = (
      canvas.getContext("webgl2", opts) ||
      canvas.getContext("webgl", opts) ||
      canvas.getContext("experimental-webgl", opts) ||
      canvas.getContext("webgl")) as GLContext;

    this.gl.clearColor(1, 1, 1, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.width = 0;
    this.height = 0;

    this.canvasWidth = 0;
    this.canvasHeight = 0;

    this.targetFPS = 60;
    this.fpsInterval = 1000 / this.targetFPS;

    this.previousTime = now();
    this._rafId = 0;
    this._playing = false;

    this._resizeObs = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      this._handleResize(width, height);
    });

  }

  setTargetFps(fps = 60) {
    this.targetFPS = fps;
    this.fpsInterval = 1000 / this.targetFPS;
  }

  setPixelRatio(ratio: number) {
    this.pixelRatio = Math.min(2.0, ratio);
  }

  updateSize(): void {
    const pr = this.pixelRatio;
    // console.log("pixel ratio", pr);

    this.canvas.width = Math.ceil(pr * this.canvasWidth / 4.0) * 4.0;
    this.canvas.height = Math.ceil(pr * this.canvasHeight / 4.0) * 4.0;
    this.width = this.gl.drawingBufferWidth;
    this.height = this.gl.drawingBufferHeight;
    this.onResize.emit();
  }



  _handleResize(w: number, h: number): boolean {

    if (isNaN(w) || isNaN(h) || w === 0 || h === 0) {
      return false;
    }
    if (w !== this.canvasWidth || h !== this.canvasHeight) {

      this.canvasWidth = w;
      this.canvasHeight = h;
      this.updateSize();
    }
    return true;
  }


  start(): void {
    this._resizeObs.observe(this.canvas);
    this._playing = true;
    this.frame(now());
    this.previousTime = now();
  }

  stop(): void {
    this._resizeObs.disconnect();
    this._playing = false;
    this._rafId = 0;
  }



  _requestFrame(): void {
    window.cancelAnimationFrame(this._rafId);
    this._rafId = window.requestAnimationFrame(this.frame);
  }

  frame = (time: number): void => {
    if (!this._playing) {
      return;
    }

    const elapsed = time - this.previousTime;

    let dt = (time - this.previousTime) / 1000;

    dt = clampDt(dt);
    if (elapsed > this.fpsInterval) {
      this.onRender.emit(dt);


      // this.previousTime = time;
      this.previousTime = time - (elapsed % this.fpsInterval);
    }

    if (this._playing) {
      this._requestFrame();
    }

  }

}



export default GLView;

