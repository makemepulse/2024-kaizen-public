import { throwIfAborted } from "@/core/AbortSignalUtils";
import Deferred from "@/core/Deferred";
import Delay from "@/core/Delay";
import Signal from "@/core/Signal";
import { AbortController, AbortSignal } from "@azure/abort-controller";
import gui from "@webgl/dev/gui";



type FPSMonitorResult = {
  meanFrame: number
}


function pnow() {
  return performance.now() / 1000;
}

class FPSMonitor {



  private _running = false
  private lastFrameTime = -1
  private startTime = -1
  private _sampleDuration = 1

  private record: number[] = []

  private _defer: Deferred<FPSMonitorResult>


  start(duration = 1): Promise<FPSMonitorResult> {
    if (this._running) return;
    this._sampleDuration = duration;
    this._defer = new Deferred();
    this.startTime = pnow();
    this._running = true;
    this.record.length = 0;
    this.lastFrameTime = -1;
    requestAnimationFrame(this.onRaf);
    return this._defer.promise;
  }

  stop() {
    if (!this._running) return;
    this._running = false;
    this._defer.reject("stopped");
    this._stop();
  }

  _stop() {
    this._defer = null;
    this._running = false;
  }

  onRaf = () => {
    if (!this._running) return;

    const now = pnow();
    if (this.lastFrameTime > 0) {
      this.record.push(now - this.lastFrameTime);
    }
    this.lastFrameTime = now;

    if (now - this.startTime > this._sampleDuration) {
      this._defer.resolve(this.getResult());
      this._stop();
      return;
    }

    requestAnimationFrame(this.onRaf);
  }


  getResult(): FPSMonitorResult {
    let rawmean = 0;
    const record = this.record;
    for (let i = 0; i < record.length; i++) {
      const f = record[i];
      rawmean += f;
    }
    rawmean /= record.length;


    let mean = 0;
    let c = 0;
    for (let i = 0; i < record.length; i++) {
      const f = record[i];
      const delta = f / rawmean;
      if (delta > .25 && delta < 4) {
        mean += f;
        c++;
      }
    }

    mean /= c;

    // console.log("result", mean);

    return {
      meanFrame: mean
    };
  }

}


const FPS_TARGET = 50;
/**
 * time in ms before starting monitring fps and adjuste quality
 * to accomodate initial lags
 */
const WARMUP_DELAY = 1000;

/**
 * delay to wait before monitor fps again after quaity drop
 */
const POST_DEGRADE_DELAY = 1000;

/**
 * In continuous mode, th efps is checked every CONTINUOUS_CHECK_DELAY milliseconds
 */
const CONTINUOUS_CHECK_DELAY = 5000;


const _DEGRADE = 1 << 1;
const _UPGRADE = 1 << 2;
const _CONTINUOUS = 1 << 3;

export enum QualityPolicy {
  DEGRADE = _DEGRADE,
  DEGRADE_CONTINUOUS = _DEGRADE | _CONTINUOUS,
  UPGRADE = _UPGRADE,
  UPGRADE_CONTINUOUS = _UPGRADE | _CONTINUOUS,
}


export default class Quality<TLevel> {
  private _autoLevelAbortCtrl: AbortController;
  private targetFps: number;
  private targetFrameTime: number;

  setLevel(level: number) {
    this.levelIndex = level;
  }

  setTargetFps(fps: number) {
    this.targetFps = fps;
    this.targetFrameTime = 1.0 / this.targetFps;
  }

  readonly onChange = new Signal<TLevel>()

  private _currentLevel: number


  /// #if DEBUG

  private _forceQuality = false;

  public get forceQuality() {
    return this._forceQuality;
  }
  public set forceQuality(value) {
    if (value === this._forceQuality) return;
    this._forceQuality = value;
    this._applyLevel();
  }


  private _debugLevel: number;

  public get debugLevel() {
    return this._debugLevel;
  }

  public set debugLevel(value) {
    if (value === this._debugLevel) return;
    this._debugLevel = value;
    this._forceQuality = true;
    this._applyLevel();
  }
  /// #endif



  constructor(readonly levels: TLevel[]) {
    this.levelIndex = levels.length - 1;
    this.targetFps = FPS_TARGET;
    this.targetFrameTime = 1.0 / this.targetFps;

    /// #if DEBUG
    this._debugLevel = this._currentLevel;
    const f = gui.folder("Quality");
    f.monitor(this, "_currentLevel").setLabel("Current level");
    f.add(this, "forceQuality", { label: "force quality level" });
    f.add(this, "debugLevel", { min: 0, max: levels.length - 1, step: 1, label: "quality" });
    /// #endif
  }



  async startAutoLevel(psignal?: AbortSignal, policy: QualityPolicy = QualityPolicy.DEGRADE) {

    this._autoLevelAbortCtrl = new AbortController(psignal);
    const signal = this._autoLevelAbortCtrl.signal;

    const degradeMode = (policy & _DEGRADE) !== 0;

    if (degradeMode) {
      this.maxQuality();
    } else {
      this.minQuality();
    }

    const monitor = new FPSMonitor();
    const targetFrameTime = 1.0 / this.targetFps;

    await Delay(WARMUP_DELAY);

    // eslint-disable-next-line no-constant-condition
    while (true) {

      const res = await monitor.start();

      throwIfAborted(signal);

      // console.log(`fps ${1 / res.meanFrame}`);

      if (degradeMode) {

        if (res.meanFrame > this.targetFrameTime) {
          if (!this.degrade()) break;
          await Delay(POST_DEGRADE_DELAY);
        } else {
          break;
        }

      } else {

        if (res.meanFrame < this.targetFrameTime) {
          if (!this.upgrade()) break;
          await Delay(POST_DEGRADE_DELAY);
        } else {
          this.degrade();
          break;
        }

      }
    }


    /*
     * continuously check fps and try to upgrade or degrade accordingly 
     */
    if ((policy & _CONTINUOUS)) {

      while (!signal.aborted) {

        // monitor fps
        await Delay(CONTINUOUS_CHECK_DELAY);
        throwIfAborted(signal);
        let res = await monitor.start();
        throwIfAborted(signal);

        // if fps is ok, upgrade, check again and degrade if not ok
        if (res.meanFrame < targetFrameTime) {
          this.upgrade();
          await Delay(POST_DEGRADE_DELAY);
          throwIfAborted(signal);
          res = await monitor.start(.5);
          throwIfAborted(signal);
          if (res.meanFrame > targetFrameTime) {
            this.degrade();
          }
        } else {
          this.degrade();
        }
      }
    }





  }

  stopAutoLevel() {
    this._autoLevelAbortCtrl?.abort();
  }


  private set levelIndex(l: number) {
    if (l < 0 || l >= this.levels.length) return;
    this._currentLevel = l;
    this._applyLevel();
  }


  private get levelIndex() {
    return this._currentLevel;
  }


  get level(): TLevel {
    /// #if DEBUG
    if (this._forceQuality) {
      return this.levels[Math.round(this._debugLevel)];
    }
    /// #endif

    return this.levels[this._currentLevel];
  }


  public maxQuality() {
    this.levelIndex = this.levels.length - 1;
  }

  public minQuality() {
    this.levelIndex = 0;
  }

  public upgrade() {
    if (this.levelIndex >= this.levels.length - 1) return false;
    this.levelIndex++;
    return true;
  }


  public degrade() {
    if (this.levelIndex <= 0) return false;
    this.levelIndex--;
    return true;
  }


  private _applyLevel() {
    this.onChange.emit(this.level);
  }

}