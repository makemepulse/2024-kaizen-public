import { vec3 } from "gl-matrix";

export const brushOpts = {
  rectangle: "brush.png",
  radial: "radial-brush.png",
  brush01: "brush-01-2.png",
  brush02: "brush-02-2.png",
  brush03: "brush-03-2.png",
  brush04: "brush-04-2.png",
  brush05: "brush-05-2.png",
  brush06: "brush-06-2.png",
  brush07: "brush-07-2.png",
  brush08: "brush-08-2.png",
  brush09: "brush-09-2.png",
  brush10: "brush-10-2.png",
};

export type BrushOptKeys = keyof typeof brushOpts;

export type BrushConfigOpt = {
    brush: BrushOptKeys;
    size: number;
    color: number;
    lerp?: number;
    alpha?: number;
    useBackground?: boolean;
    useRandAngle?: boolean;
    noiseStep?: number;
    accumulations?: number;
    drawInitialBrush?: boolean;
    distPerPoint?: number;
    channel?: vec3;
    isIntro?: boolean;
    minAlpha?: number;
    alphaDecreaseSpeed?: number;
    alphaIncreaseSpeed?: number;
    alphaDecreaseLength?: number;
}

export const BrushConfig: BrushConfigOpt[] = [
  {
    brush: "radial",
    size: 20,
    distPerPoint: 0.007,
    
    color: 0xFF7882,
    useBackground: true,
    useRandAngle: false,
    noiseStep: 0.65,
    channel: vec3.fromValues(0, 1, 0),
    isIntro: true,
    minAlpha: 0.3,
    alphaDecreaseSpeed: -0.02,
  },
  {
    brush: "brush02",
    size: 40,
    distPerPoint: 0.005,
    color: 0xFFA7F2,
    useRandAngle: false,
    // accumulations: 0.7,
  },
  {
    brush: "brush04",
    size: 35,
    distPerPoint: 0.005,
    color: 0x0E944C,
    useRandAngle: false,
  },
  {
    brush: "brush10",
    size: 50,
    distPerPoint: 0.005,
    color: 0x846EC4,
    // accumulations: 0.65,
    useRandAngle: false,
  },
  {
    brush: "brush02",
    size: 35,
    distPerPoint: 0.005,
    color: 0x293494,
    useRandAngle: false,
    noiseStep: 0.65,
  }
];