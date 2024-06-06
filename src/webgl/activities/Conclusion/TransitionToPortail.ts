import Renderer from "@webgl/Renderer";
import { AtlasLayer, SpriteSheetManager, SpritesObject } from "../Archives/SpriteSheetManager";
import PublicPath from "@/core/PublicPath";
import Delay from "@/core/Delay";
import AppService from "@/services/AppService";


const SpritesMap: SpritesObject =
  {
    fps: 30,
    loopFps: 30,
    totalFrames: 37,
    loopFrames: 37,
    layers: [
      {
        path: "transitions/chapter-to-menu",
        isMultiply: false,
        isLoop: false,
        isShaking: false
      }
    ]
  };

export default class TransitionToPortail {
  spriteManager: SpriteSheetManager;
  private static worker: Worker;

  allImgLoaded = false;
  isPlaying = false;

  atlas: AtlasLayer[];

  
  constructor(private renderer: Renderer) {
    const gl = renderer.gl;

    const workerUrl = PublicPath("js/transition.worker.js");
    TransitionToPortail.worker = new Worker(workerUrl);

    this.spriteManager = new SpriteSheetManager(renderer, SpritesMap, TransitionToPortail.worker, "to-menu", [], this.onEnd, this.onSpriteLoad, true);
  }

  onSpriteLoad = () => {
    this.allImgLoaded = true;
    this.renderer.postprocess.post.add(this.renderer.postprocess.transitionPass);
  }

  onEnd = async () => {
    // await Delay(500);
    // AppService.state.send("SKIP");
    AppService.state.send("GO_TO_QUOTE");
    await Delay(500);
    this.spriteManager.reset();
    this.isPlaying = false;
  }

  play() {
    this.spriteManager.updateLoopState({
      canContinue: true,
      isPlaying: true,
      isLoopPlaying: true,
      hasStarted: true
    });
    this.isPlaying = true;
  }

  prepare() {
    this.spriteManager.updateFrame();
  }

  isTransitionToScene(val: boolean) {
    this.spriteManager.isReverse = val;
  }


  stop(){
    TransitionToPortail.worker.terminate();
  }
  preRender(){
    if(!this.allImgLoaded) return;
    
    this.spriteManager.preRender();
    this.atlas = this.spriteManager.getAtlas();
  }
}