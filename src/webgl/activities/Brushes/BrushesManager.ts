import { vec2, vec3 } from "gl-matrix";
import GLState, { LocalConfig } from "nanogl-state/GLState";
import { Subscription } from "xstate";

import Delay from "@/core/Delay";
import lerp, { lerpAngle } from "@/utils/Lerp";
import Renderer from "@webgl/Renderer";
import Time from "@webgl/Time";
import { Activity } from "@webgl/activities/Activity";
import gui from "@webgl/dev/gui";
import AppService from "@/services/AppService";

import Brush from "./Brush";
import type { FlowMap } from "./FlowMap";
import gsap from "gsap";
import { BrushConfigOpt, BrushConfig } from "./BrushesConfig";
import Subtitles from "@/store/modules/Subtitles";
import { easeInQuad } from "@webgl/math/ease";

const MAX_DIST_TO_SKIP = 1.3;
const MAX_DIST_TO_SKIP_M = 1.25;
const MIX_DIST_TO_SKIP = 0.1;

export default class BrushesManager implements Activity {
  isPainting = false;

  cfg: LocalConfig;
  
  brushes: Brush[];
  currentBrush: number;
  isLoaderBrush = true;
  baseSize = 0;

  viewport = [0, 0];
  aspect = 1;
  isMobile = false;

  drawInitialBrush = false;
  distPerPoint = 0.025;
  minAlpha = 0.4;
  alphaDecreaseSpeed = -1;
  alphaIncreaseSpeed = 1;
  alphaDecreaseLength = 0.25;
  direction = vec2.create();
  startCoord = vec2.create();
  coord = vec2.create();
  lerpCoord = vec2.create();
  prevCoord = vec2.create();
  velocity = vec2.create();
  angle = 0;
  mouseLerp = 0.2;
  angleLerp = 1;
  prevTime = 0;

  currentBrushParams = { totalPoints: 0, hasModifiedAlpha: false, brushAlphaStartPos: 0, hasIncreasingSize: false, hasDecreasingSize: false, alpha: 1, size: 7, increaseScale: 0, decreaseScale: 0, }
  maxDist = 6;
  canDraw = false;
  isInTransition = false;
  justStarted = false;
  clearColor = false;

  changeStateSubscription: Subscription;
  currentState: any;
  currentArchivesStep: number;

  flow: FlowMap;

  debugNoAutoSkip = false;

  constructor(private renderer: Renderer) {
    this.brushes = [];
    this.currentBrush = -1;

    this.cfg = GLState.get(renderer.gl).config()
      .depthMask(false)
      .enableDepthTest(false)
      .enableBlend(true)
      .blendFuncSeparate(renderer.gl.SRC_ALPHA, renderer.gl.ONE_MINUS_SRC_ALPHA, renderer.gl.ONE, renderer.gl.ONE_MINUS_SRC_ALPHA);

    /// #if DEBUG
    this.createDebug();
    /// #endif
  }

  createDebug() {
    const fld = gui.folder("Brushes");

    fld.add(this, "debugNoAutoSkip");
    fld.add(this, "distPerPoint", { min: 0.001, max: 0.2, step: 0.0001 });
    fld.add(this, "mouseLerp", { min: 0, max: 1, step: 0.01 });
    fld.add(this, "angleLerp", { min: 0, max: 1, step: 0.01 });
    fld.add(this, "minAlpha", { min: 0, max: 0.5, step: 0.01 });
    fld.add(this, "alphaIncreaseSpeed", { min: 0, max: 0.1, step: 0.001 });
    fld.add(this, "alphaDecreaseSpeed", { min: -0.1, max: 0, step: 0.001 });
    fld.add(this, "alphaDecreaseLength", { min: 0, max: 0.5, step: 0.001 });
    // window.addEventListener("keydown", (e) => {
    //   if(e.key === "Enter") {
    //     this.goNext();
    //   }
    // });
  }

  onResize = () => {
    this.viewport[0] = window.innerWidth;
    this.viewport[1] = window.innerHeight;
    this.aspect = window.innerWidth / window.innerHeight;
    this.flow.setViewport(this.aspect, this.viewport);
    this.isMobile = window.innerWidth < 768;
    this.flow.clearBrushs();
  }

  // --PAINTING EVENTS--
  onChangeState = (state: any) => {
    // When intro is skipped
    if(this.currentState?.landing_page === "intro" && state.event?.type === "SKIP") {
      this.updateBrushConfig(BrushConfig[1]);
      this.clearColor = false;
    }
    this.currentState = state.value;
    this.currentArchivesStep = state.context.step;
    
  }

  onCursorDown = () => {
    if(this.isInTransition || AppService.state.machine.context.archiveTransition) return;
    this.canDraw = true;
    this.justStarted = true;
    
  }

  onCursorUp = () => {
    this.canDraw = false;
    if(!this.debugNoAutoSkip && (this.currentBrushParams.totalPoints * this.distPerPoint) >= MIX_DIST_TO_SKIP) {
      this.isInTransition = true;
      this.goNext();
    }
    this.resetMouse();
  }

  updateBrushConfig = ({ brush, size, color, lerp = 0.04, alpha = 1, useBackground = false, useRandAngle = false, noiseStep = 0.65, accumulations = 1, drawInitialBrush = true, distPerPoint =  0.03, channel = vec3.fromValues(1, 0, 0), isIntro = false, minAlpha = 0.4, alphaDecreaseSpeed = -0.009, alphaIncreaseSpeed = 0.006, alphaDecreaseLength = 0.25 }: BrushConfigOpt) => {
    if(isIntro) {
      this.flow.setAlphaBackground(+useBackground);
      // this.flow.setBrushColor(HexToTmpVec3(color));
      this.flow.setBrushTexture(brush);
      // this.flow.setBrushSize(size);
      this.currentBrushParams.size = size;
      this.flow.setAccumulation(accumulations);
      this.flow.setNoiseStep(noiseStep);
      this.flow.setUseRandomAngle(useRandAngle);
      this.flow.setChannelToUse(channel);
      this.flow.setIsIntro(isIntro);
      this.drawInitialBrush = drawInitialBrush;
      this.mouseLerp = lerp;
      this.distPerPoint = distPerPoint;
      this.isInTransition = false;
      this.minAlpha = minAlpha;
      this.alphaDecreaseSpeed = alphaDecreaseSpeed;
      this.alphaIncreaseSpeed = alphaIncreaseSpeed;
      this.alphaDecreaseLength = alphaDecreaseLength;
    } else {
      gsap.to(this.flow, {
        alpha: 0,
        duration: 0.5,
        onComplete: () => {      
          this.flow.clearBrushs();
          this.flow.alpha = alpha;
          this.flow.setAlphaBackground(+useBackground);
          this.flow.setBrushColor(color);
          this.flow.setBrushTexture(brush);
          // this.flow.setBrushSize(size);
          this.currentBrushParams.size = size;
          this.flow.setAccumulation(accumulations);
          this.flow.setNoiseStep(this.currentBrushParams.hasModifiedAlpha ? 1 : noiseStep);
          this.flow.setUseRandomAngle(useRandAngle);
          this.flow.setChannelToUse(channel);
          this.flow.setIsIntro(isIntro);
          this.drawInitialBrush = drawInitialBrush;
          this.mouseLerp = lerp;
          this.distPerPoint = distPerPoint;
          this.minAlpha = minAlpha;
          this.alphaDecreaseSpeed = alphaDecreaseSpeed;
          this.alphaIncreaseSpeed = alphaIncreaseSpeed;
          this.alphaDecreaseLength = alphaDecreaseLength;
          this.isInTransition = false;
  
        }
      });
    }
  }

  goNext = async () => {
    if (this.currentState.landing_page === "loader") {
      this.clearColor = true;
      AppService.state.send("NEXT");
      await Delay(500);
      this.updateBrushConfig(BrushConfig[0]);
    } else if (this.currentState.landing_page === "intro") {
      this.updateBrushConfig(BrushConfig[1]);
      await Delay(500);

      // ENABLE THIS TO BLOCK NEXT STEP WAITING FOR END SUBTITLES : 
      // if(Subtitles.blocking) return;
      AppService.state.send("PAINTING_DONE");
      this.clearColor = false;
    } else if (this.currentState.archives === "running") {
      switch (this.currentArchivesStep) {
      case 0: {
        AppService.state.send("NEXT");
        await Delay(1500);
        this.updateBrushConfig(BrushConfig[2]);
        break;
      }
      case 1: {
        AppService.state.send("NEXT");
        await Delay(1500);
        this.updateBrushConfig(BrushConfig[3]);
        break;
      }
      case 2: {
        AppService.state.send("NEXT");
        await Delay(1500);
        this.updateBrushConfig(BrushConfig[4]);
        break;
      }
      case 3: {
        AppService.state.send("SKIP");
        await Delay(1500);
        await gsap.to(this.flow, {
          alpha: 0,
          duration: 0.5,
        });
        break;
      }
      }
    }

  }

  resetMouse() {
    this.prevTime = 0;
    this.coord.set([-2, -2]);
    this.lerpCoord.set([-2, -2]);
    this.prevCoord.set([-2, -2]);
    this.velocity.set([0, 0]);
    this.angle = 0;
    // Reset & Get new brush params
    this.currentBrushParams = {
      ...this.currentBrushParams,
      totalPoints: 0,
      hasModifiedAlpha: Math.random() > 0.2,
      hasIncreasingSize: Math.random() > 0.4,
      increaseScale: Math.random() * 2 + 1,
      hasDecreasingSize: Math.random() > 0.4,
      decreaseScale: Math.random() * 2 + 1,
      alpha: 1,
      brushAlphaStartPos: Math.random() * 0.6 + 0.2,
    };
    this.flow.velocity.set([0, 0]);
  }

  updateMouse= (event: MouseEvent | TouchEvent) => {
    const x = event instanceof MouseEvent ? event.clientX : event.touches[0].clientX;
    const y = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    const normX = x / this.viewport[0] * 2 - 1;
    const normY = -(y / this.viewport[1]) * 2 + 1;
    
    const dt = Time.dt / 1000;
    const deltaX = (normX - this.prevCoord[0]) / dt;
    const deltaY = (normY - this.prevCoord[1]) / dt;
    
    if(this.canDraw) {
      this.coord.set([normX, normY]);
      this.velocity.set([deltaX, deltaY]);
      // if(vec2.length(this.velocity) > 0.05) {
      this.angle = Math.atan2(deltaY, deltaX);
      // }
      if(this.justStarted) {
        this.flow.velocity.set(this.velocity);
        this.lerpCoord.set(this.coord);
        this.prevCoord.set(this.coord);
        this.flow.angle = this.angle;
        this.justStarted = false;
      }
      // else 
      //   this.randAngle = 0;
      // this.prevCoord.set(coord);
    }
    
    this.prevTime = Time.dt;
  }

  updateAlpha = (isDecreasing = false) => {
    const newAlpha = Math.max(this.minAlpha, Math.min(this.currentBrushParams.alpha + (isDecreasing ? this.alphaDecreaseSpeed : this.alphaIncreaseSpeed), 1));
    this.currentBrushParams.alpha = newAlpha;    
    return this.currentBrushParams.alpha;
  }

  getBrushProgress = (nbPoints: number) => {
    return (nbPoints * this.distPerPoint) / (this.isMobile ? MAX_DIST_TO_SKIP_M : MAX_DIST_TO_SKIP * this.aspect);
  }

  // --LOAD/UNLOAD--

  async load(): Promise<any> {
    if(!this.flow) {
      const FlowMap = (await import("./FlowMap")).FlowMap;

      this.flow = new FlowMap(this.renderer);
    }
    return this.flow.load();
  }

  unload(): void { }

  // --START/STOP--

  async start() {

    this.changeStateSubscription = AppService.state.subscribe(this.onChangeState);
    this.onResize();

    this.renderer.postprocess.enabled = false;
    this.flow.start();


    // // mouse/touch down event must be on canvas
    this.renderer.ilayer.addEventListener("mousedown", this.onCursorDown);
    this.renderer.ilayer.addEventListener("touchstart", this.onCursorDown);
    this.renderer.ilayer.addEventListener("mouseup", this.onCursorUp);
    this.renderer.ilayer.addEventListener("touchend", this.onCursorUp);
    window.addEventListener("mousemove", this.updateMouse);
    window.addEventListener("touchmove", this.updateMouse);
    window.addEventListener("resize", this.onResize);
  }

  stop(): void {
    this.changeStateSubscription.unsubscribe();

    this.renderer.postprocess.enabled = true;
    this.flow.stop();
    this.renderer.ilayer.removeEventListener("mousedown", this.onCursorDown);
    this.renderer.ilayer.removeEventListener("touchstart", this.onCursorDown);
    this.renderer.ilayer.removeEventListener("mouseup", this.onCursorUp);
    this.renderer.ilayer.removeEventListener("touchend", this.onCursorUp);
    window.removeEventListener("mousemove", this.updateMouse);
    window.removeEventListener("touchmove", this.updateMouse);
    window.removeEventListener("resize", this.onResize);
  }


  // --RENDER--

  preRender(): void {
    if(!this.justStarted) {

      //Consistent lerp value among framerate
      let mouseLerp = (Time.dt / 1000) * (this.mouseLerp / 0.008);    
      mouseLerp = Math.max(this.mouseLerp, mouseLerp);
      
      vec2.lerp(this.lerpCoord, this.lerpCoord, this.coord, mouseLerp);
      vec2.lerp(this.flow.velocity, this.flow.velocity, this.velocity, mouseLerp);
      
      const dist = vec2.distance(this.prevCoord, this.lerpCoord) * (this.aspect < 1 ? 1 : this.aspect);
      vec2.sub(this.direction, this.prevCoord, this.lerpCoord);
      
      if(dist > this.distPerPoint && this.canDraw) {
        const { hasModifiedAlpha, hasIncreasingSize, increaseScale, hasDecreasingSize, decreaseScale, brushAlphaStartPos } = this.currentBrushParams;
        
        this.flow.angle = lerpAngle(this.flow.angle, this.angle, this.angleLerp);
        const nbPoints = Math.floor(dist / this.distPerPoint);
        
        const p = [];
        for (let i = 1; i < nbPoints + 1; i++) {
          const brushProgress = this.getBrushProgress(this.currentBrushParams.totalPoints + i);
          let brushProgressStart = brushProgress / 0.2;
          brushProgressStart = Math.min(1, Math.max(0, brushProgressStart));
          let isStarting = false;
          let brushProgressEnd = (brushProgress - 0.8) / 0.2;
          brushProgressEnd = Math.min(1, Math.max(0, brushProgressEnd));
          let isEnding = false;

          let alphaDecrease = false;
          if(brushProgress > brushAlphaStartPos && hasModifiedAlpha) {
            this.currentBrushParams.alpha = this.minAlpha;
            this.currentBrushParams.hasModifiedAlpha = false;
          } else if (brushProgress > brushAlphaStartPos - this.alphaDecreaseLength && hasModifiedAlpha) {
            alphaDecrease = true;
          }

          const coord = vec2.lerp(vec2.create(), this.prevCoord, this.lerpCoord, i / nbPoints);
          const randAngle = Math.random() * Math.PI * 2;
          // Get size
          let size = this.currentBrushParams.size;
          if(hasIncreasingSize && brushProgressStart < 1) {
            isStarting = true;
            size = lerp(this.currentBrushParams.size * increaseScale, this.currentBrushParams.size, brushProgressStart);
          }
          if (hasDecreasingSize && brushProgressEnd > 0) {
            isStarting = false;
            isEnding = true;
            size = lerp(this.currentBrushParams.size, this.currentBrushParams.size * decreaseScale, brushProgressEnd);
          }

          // Get alpha
          // if(hasModifiedAlpha && brushProgress > brushAlphaStartPos - brushAlphaDecreaseLength) {
          //   const alphaDecrease = this.saturate((brushProgress - (brushAlphaStartPos - brushAlphaDecreaseLength)) / brushAlphaDecreaseLength);
          //   const alphaIncrease = this.saturate((brushProgress - brushAlphaStartPos) / brushAlphaIncreaseLength);
          //   console.log({alphaDecrease, alphaIncrease});
          //   alpha = lerp(1, 0.1, easeOutQuad(alphaDecrease));
          //   alpha = lerp(alpha, 1, easeInQuad(alphaIncrease));
          // }

          let alpha = easeInQuad(this.updateAlpha(alphaDecrease));
          alpha = isStarting ? lerp(0, alpha, brushProgressStart) : (isEnding ? lerp(alpha, 0, brushProgressEnd) : alpha);
          
          p.push({coord, randAngle, alpha, size}); 
        }

        this.currentBrushParams.totalPoints += p.length;
        this.flow.points = p;
        this.prevCoord.set(this.lerpCoord);
        if(this.getBrushProgress(this.currentBrushParams.totalPoints) > 1) {
          this.onCursorUp(); 
        }
      } else {
        this.flow.points = [];
      }
    }
    // this.flow.canDraw = this.canDraw;
    this.flow.preRender();
  }

  rttPass(): void {
    this.flow.rttPass();
  }

  render(): void {
    if(this.clearColor) {
      this.renderer.gl.clearColor(234 / 255, 228 / 255, 203 / 255, 0);
      this.renderer.gl.clear(this.renderer.gl.COLOR_BUFFER_BIT);
    }

    this.cfg.apply();

    this.flow.render();
  }
}
