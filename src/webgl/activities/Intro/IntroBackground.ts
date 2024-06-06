import Renderer from "@webgl/Renderer";
import RenderMask from "@webgl/core/RenderMask";
import Programs from "@webgl/glsl/programs";
import ArrayBuffer from "nanogl/arraybuffer";
import Fbo from "nanogl/fbo";
import IndexBuffer from "nanogl/indexbuffer";
import Program from "nanogl/program";
import Background, { BackgroundType } from "../Scene2/utils/Background";
import { vec4 } from "gl-matrix";
import { ISheet } from "@theatre/core";
import TheatreFloat from "@webgl/theatre/TheatreFloat";
import gui from "@webgl/dev/gui";
import TheatreVec4 from "@webgl/theatre/TheatreVec4";
import gsap from "gsap";
import lerp from "@/utils/Lerp";
import {
  BACKGROUND_TOP_COLOR_INTRO,
  BACKGROUND_MIDDLE_COLOR_INTRO,
  BACKGROUND_BOTTOM_COLOR_INTRO,
} from "../Scene1/constants";

const START_TOP = [0, 0.1568627451, 0.3019607843, 0.53];
const START_MID = [0.8667, 0.6392, 0.5647, 0.5];
const START_BOTTOM = [0, 0.1568627451, 0.3019607843, 0.47]; //[0.01359, 0.08181, 0.1449, 0.2315 ]

// const END_TOP = [0.9648, 0.6633, 0.8711, 0.6400];
// const END_MID = [0.9398, 0.7225, 0.7225, 0.5200];
// const END_BOT = [0.6580, 0.5515, 0.9098, 0.3700];

// const END_TOP = [...BACKGROUND_TOP_COLOR_INTRO];
// const END_MID = [...BACKGROUND_MIDDLE_COLOR_INTRO];
// const END_BOT = [...BACKGROUND_BOTTOM_COLOR_INTRO];

export default class IntroBackground {
  fsData: Float32Array;
  buffer: ArrayBuffer;
  bufferIndex: IndexBuffer;
  prg: Program;

  loaded: boolean;

  fbo: Fbo;
  background: Background;

  introSheet: ISheet;
  introTransitionSheet: ISheet;

  sphereVisibilityTheatre: TheatreFloat;
  sphereVisibility = { value: 0 };
  topGradientTheatre: TheatreFloat;
  topGradient = { value: 0 };
  botColorGradientTheatre: TheatreFloat;
  botColorGradient = { value: 0 };

  startTopColorAnim: TheatreVec4;
  startTopColor = {
    value: vec4.fromValues(
      START_TOP[0],
      START_TOP[1],
      START_TOP[2],
      START_TOP[3]
    ),
  };
  startMidColorAnim: TheatreVec4;
  startMidColor = {
    value: vec4.fromValues(
      START_MID[0],
      START_MID[1],
      START_MID[2],
      START_MID[3]
    ),
  };
  startBotColorAnim: TheatreVec4;
  startBotColor = {
    value: vec4.fromValues(
      START_BOTTOM[0],
      START_BOTTOM[1],
      START_BOTTOM[2],
      START_BOTTOM[3]
    ),
  };

  // Value for transition from title to scene 1
  sphereVisibilityTheatreTransition: TheatreFloat;
  sphereVisibilityTransition = { value: 0 };
  topGradientTheatreTransition: TheatreFloat;
  topGradientTransition = { value: 0 };
  botColorGradientTheatreTransition: TheatreFloat;
  botColorGradientTransition = { value: 0 };

  startTopColorAnimTransition: TheatreVec4;
  startTopColorTransition = {
    value: vec4.fromValues(
      START_TOP[0],
      START_TOP[1],
      START_TOP[2],
      START_TOP[3]
    ),
  };
  startMidColorAnimTransition: TheatreVec4;
  startMidColorTransition = {
    value: vec4.fromValues(
      START_MID[0],
      START_MID[1],
      START_MID[2],
      START_MID[3]
    ),
  };
  startBotColorAnimTransition: TheatreVec4;
  startBotColorTransition = {
    value: vec4.fromValues(
      START_BOTTOM[0],
      START_BOTTOM[1],
      START_BOTTOM[2],
      START_BOTTOM[3]
    ),
  };

  loadingAnim = { value: 0 };

  useSceneTransitionValues = false;

  constructor(private renderer: Renderer) {
    this.fsData = new Float32Array([
      -1.0, -1.0, 0.0, 0.0, 1.0, -1.0, 1.0, 0.0, 1.0, 1.0, 1.0, 1.0, -1.0, 1.0,
      0.0, 1.0,
    ]);

    this.background = new Background(
      this.renderer,
      BackgroundType.LINEAR_3_STOPS
    );
    this.background.topColor = this.useSceneTransitionValues
      ? this.startTopColorTransition.value
      : this.startTopColor.value;
    this.background.middleColor = this.useSceneTransitionValues
      ? this.startMidColorTransition.value
      : this.startMidColor.value;
    this.background.bottomColor = this.useSceneTransitionValues
      ? this.startMidColorTransition.value
      : this.startBotColor.value;
    this.background.setTransitionColors(
      vec4.fromValues(...BACKGROUND_TOP_COLOR_INTRO),
      vec4.fromValues(...BACKGROUND_MIDDLE_COLOR_INTRO),
      vec4.fromValues(...BACKGROUND_BOTTOM_COLOR_INTRO)
    );

    /// #if DEBUG
    const fd = gui.folder("Intro");
    fd.addColor(this.background, "topColor");
    fd.addColor(this.background, "middleColor");
    fd.addColor(this.background, "bottomColor");
    fd.addColor(this.background, "transitionTopColor");
    fd.addColor(this.background, "transitionMiddleColor");
    fd.addColor(this.background, "transitionBottomColor");
    fd.range(this.sphereVisibility, "value", 0, 1, {
      label: "Sphere visibility",
    });
    fd.range(this.topGradient, "value", 0, 1, { label: "Base Color Gradient" });
    /// #endif
  }

  private setBuffer() {
    this.buffer = new ArrayBuffer(this.renderer.gl, this.fsData);
    this.bufferIndex = new IndexBuffer(
      this.renderer.gl,
      this.renderer.gl.UNSIGNED_SHORT,
      new Uint16Array([0, 1, 2, 0, 2, 3])
    );

    this.buffer.attrib("aPosition", 2, this.renderer.gl.FLOAT);
    this.buffer.attrib("aTexCoord", 2, this.renderer.gl.FLOAT);
  }

  private setFbo() {
    this.fbo = new Fbo(this.renderer.gl);
    this.fbo.attachColor();
    const colorTex = this.fbo.getColorTexture();
    colorTex.setFilter(false, false, false);
    colorTex.bind();
    colorTex.setFormat(this.renderer.gl.RGBA);
    colorTex.clamp();
  }

  async load() {
    await Promise.all([this.background.load()]);
    this.background.sheetSuccess = this.introTransitionSheet;

    this.background.setUseClampedMix(true);
    this.background.onLoaded();
    this.loaded = true;
  }

  start() {

    this.prg = Programs(this.renderer.gl).get("intro-background");
    this.sphereVisibilityTheatre = new TheatreFloat(
      this.sphereVisibility,
      this.introSheet,
      "sphere reveal progress"
    );
    this.topGradientTheatre = new TheatreFloat(
      this.topGradient,
      this.introSheet,
      "topGradient"
    );
    this.botColorGradientTheatre = new TheatreFloat(
      this.botColorGradient,
      this.introSheet,
      "botColorGradient"
    );
    this.startTopColorAnim = new TheatreVec4(
      this.startTopColor.value,
      this.introSheet,
      "startTopColorAnim"
    );
    this.startMidColorAnim = new TheatreVec4(
      this.startMidColor.value,
      this.introSheet,
      "startMidColorAnim"
    );
    this.startBotColorAnim = new TheatreVec4(
      this.startBotColor.value,
      this.introSheet,
      "startBotColorAnim"
    );

    this.sphereVisibilityTheatreTransition = new TheatreFloat(
      this.sphereVisibilityTransition,
      this.introTransitionSheet,
      "sphere reveal progress"
    );
    this.topGradientTheatreTransition = new TheatreFloat(
      this.topGradientTransition,
      this.introTransitionSheet,
      "topGradient"
    );
    this.botColorGradientTheatreTransition = new TheatreFloat(
      this.botColorGradientTransition,
      this.introTransitionSheet,
      "botColorGradient"
    );
    this.startTopColorAnimTransition = new TheatreVec4(
      this.startTopColorTransition.value,
      this.introTransitionSheet,
      "startTopColorAnim"
    );
    this.startMidColorAnimTransition = new TheatreVec4(
      this.startMidColorTransition.value,
      this.introTransitionSheet,
      "startMidColorAnim"
    );
    this.startBotColorAnimTransition = new TheatreVec4(
      this.startBotColorTransition.value,
      this.introTransitionSheet,
      "startBotColorAnim"
    );

    this.setBuffer();
    this.setFbo();
    this.background.start();
  }

  useTransitionSheet() {
    this.useSceneTransitionValues = true;
    this.background.topColor = this.startTopColorTransition.value;
    this.background.middleColor = this.startMidColorTransition.value;
    this.background.bottomColor = this.startBotColorTransition.value;
  }

  goToTlEnd(duration: number) {
    const tl = gsap.timeline({
      onUpdate: () => {
        this.startTopColor.value = vec4.fromValues(
          tColor.x,
          tColor.y,
          tColor.z,
          tColor.w
        );
        this.background.topColor = this.startTopColor.value;
        this.startMidColor.value = vec4.fromValues(
          mColor.x,
          mColor.y,
          mColor.z,
          mColor.w
        );
        this.background.middleColor = this.startMidColor.value;
        this.startBotColor.value = vec4.fromValues(
          bColor.x,
          bColor.y,
          bColor.z,
          bColor.w
        );
        this.background.bottomColor = this.startBotColor.value;
      },
    });
    const tColor = {
      x: this.startTopColor.value[0],
      y: this.startTopColor.value[1],
      z: this.startTopColor.value[2],
      w: this.startTopColor.value[3],
    };
    const mColor = {
      x: this.startMidColor.value[0],
      y: this.startMidColor.value[1],
      z: this.startMidColor.value[2],
      w: this.startMidColor.value[3],
    };
    const bColor = {
      x: this.startBotColor.value[0],
      y: this.startBotColor.value[1],
      z: this.startBotColor.value[2],
      w: this.startBotColor.value[3],
    };

    tl.to(
      tColor,
      {
        x: 0.1114,
        y: 0.4434,
        z: 0.575,
        w: 0.6667,
        duration,
      },
      0
    );
    tl.to(
      mColor,
      {
        x: 0.2072,
        y: 0.5602,
        z: 0.65,
        w: 0.4907,
        duration,
      },
      0
    );
    tl.to(
      bColor,
      {
        x: 0.03,
        y: 0.29,
        z: 0.529,
        w: 0.4,
        duration,
      },
      0
    );
    tl.to(
      this.sphereVisibility,
      {
        value: 0.95,
        duration,
      },
      0
    );
    tl.to(
      this.botColorGradient,
      {
        value: 0.2,
        duration,
      },
      0
    );
    return tl;
  }

  stop() {
    this.background.stop();

    this.buffer.dispose();
    this.bufferIndex.dispose();
    this.fbo?.dispose();

    this.sphereVisibilityTheatre?.dispose();
    this.topGradientTheatre?.dispose();
    this.botColorGradientTheatre?.dispose();
    this.startTopColorAnim?.dispose();
    this.startMidColorAnim?.dispose();
    this.startBotColorAnim?.dispose();
    this.sphereVisibilityTheatreTransition?.dispose();
    this.topGradientTheatreTransition?.dispose();
    this.botColorGradientTheatreTransition?.dispose();
    this.startTopColorAnimTransition?.dispose();
    this.startMidColorAnimTransition?.dispose();
    this.startBotColorAnimTransition?.dispose();
  }

  playIntro() {
    gsap.to(this.loadingAnim, {
      value: 1,
      duration: 1,
      ease: "power1.out",
    });
  }

  preRender() {
    if (this.fbo.width !== this.renderer.viewport.width || this.fbo.height !== this.renderer.viewport.height)
      this.fbo.resize(
        this.renderer.viewport.width,
        this.renderer.viewport.height
      );
  }

  rttPass() {
    this.fbo.bind();
    this.fbo.defaultViewport();
    this.background.render(this.renderer.context.withMask(RenderMask.OPAQUE));
  }

  render() {
    if (!this.loaded) return;
    this.prg.bind();

    const botProgress = lerp(
      0,
      this.useSceneTransitionValues
        ? this.botColorGradientTransition.value
        : this.botColorGradient.value,
      this.loadingAnim.value
    );

    this.prg.uColorTex(this.fbo.getColorTexture());
    this.prg.uSphereBgProgress(
      this.useSceneTransitionValues
        ? this.sphereVisibilityTransition.value
        : this.sphereVisibility.value
    );
    this.prg.uTopGradient(
      this.useSceneTransitionValues
        ? this.topGradientTheatreTransition.value
        : this.topGradient.value
    );
    this.prg.uBottomGradient(botProgress);
    this.buffer.attribPointer(this.prg);
    this.bufferIndex.bind();
    this.bufferIndex.drawTriangles();
  }
}
