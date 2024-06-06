import Program from "nanogl/program";
import ArrayBuffer from "nanogl/arraybuffer";
import GLState, { LocalConfig } from "nanogl-state/GLState";
import { vec2 } from "gl-matrix";

import Delay from "@/core/Delay";
import Programs from "@webgl/glsl/programs";
import Renderer from "@webgl/Renderer";
import AppService from "@/services/AppService";
import RenderMask from "@webgl/core/RenderMask";
import { Activity } from "@webgl/activities/Activity";
import { RenderContext } from "@webgl/core/Renderer";

const FLOAT_PER_PARTICLE = 4;
const COLORS = [
  [213, 162, 0],
  [242, 143, 126],
  [3, 157, 127],
];

export default class Brush {
  isPainting = false;

  prg: Program;
  buffer: ArrayBuffer;

  count = 0;
  baseSize = 112;
  targetPos = vec2.create();
  currentPos = vec2.create();
  bufferData: Float32Array;

  isHidden = false
  uAlpha = 1;

  constructor(private renderer: Renderer, private isInitialBrush = false, private brushIdx: number) {
    this.buffer = new ArrayBuffer(renderer.gl);
    this.buffer.attrib("aPosition", 2, renderer.gl.FLOAT);
    this.buffer.attrib("aConfig", 2, renderer.gl.FLOAT);

    this.prg = Programs(renderer.gl).get("brush");
  }

  // --LOAD/UNLOAD--

  async load(): Promise<any> {
    return Promise.resolve()
  }

  unload(): void { }

  // --START/STOP--

  start(): void {
    // mouse/touch down event must be on canvas

  }

  stop(): void {
    this.buffer.dispose();
  }

  // --PAINTING EVENTS--

  onPaintStart = (coord: vec2, baseSize: number) => {
    this.baseSize = baseSize;
    vec2.copy(this.targetPos, coord);
    vec2.copy(this.currentPos, coord);

    this.addParticle(0.8);
  }

  onPaintMove = (coord: vec2) => {
    vec2.copy(this.targetPos, coord);
  }

  onPaintStop = () => {
    this.isPainting = false;
  }

  // --PARTICLES--

  addParticle(forceOpacity?: number): void {
    const size = Math.max(
      this.baseSize - Math.exp(this.count * 0.1),
      0
    );

    if (size === 0) {
      this.onPaintStop();
      return;
    }

    const currentLength = this.count * FLOAT_PER_PARTICLE;
    const data = new Float32Array(currentLength + FLOAT_PER_PARTICLE);

    if (this.count > 0) data.set(this.bufferData);
    data.set([
      this.currentPos[0],
      this.currentPos[1],
      size,
      forceOpacity ?? (size / this.baseSize * 0.2)
    ], currentLength);

    this.bufferData = data;
    this.buffer.data(this.bufferData);

    this.count += 1;
  }

  getColor(): number[] {
    return [COLORS[this.brushIdx][0] / 255, COLORS[this.brushIdx][1] / 255, COLORS[this.brushIdx][2] / 255];
  }

  hide(): void {
    this.isHidden = true;
  }

  // --RENDER--

  preRender(): void {
    if (this.currentPos[0] === this.targetPos[0] && this.currentPos[1] === this.targetPos[1]) return;

    vec2.lerp(this.currentPos, this.currentPos, this.targetPos, 0.2);
    this.addParticle();
  }

  rttPass(): void {}

  render(): void {
    if (this.isHidden) {
      this.uAlpha = Math.max(this.uAlpha -  (0.0075 + 0.0025 * this.brushIdx), 0);
    }

    this.buffer.attribPointer(this.prg);
    this.prg.use();
    // this.prg.uColor([+(this.brushIdx === 0), +(this.brushIdx === 1), +(this.brushIdx === 2)]);
    this.prg.uColor(this.getColor());
    this.prg.uAlpha(this.uAlpha);
    this.buffer.drawPoints();
  }
}
