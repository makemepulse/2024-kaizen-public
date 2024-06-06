import Chunk from "nanogl-pbr/Chunk";
import VertModule from "./trail.vert";
import FragModule from "./trail.frag";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import CreateShader from "@webgl/core/CreateProgram";
import Program from "nanogl/program";
import Input, { ShaderType, Uniform } from "nanogl-pbr/Input";
import TexCoord from "nanogl-pbr/TexCoord";
import Texture from "nanogl/texture";
import { vec3 } from "gl-matrix";

const FragCode = CreateShader(FragModule);
const VertCode = CreateShader(VertModule);

export default class TrailChunk extends Chunk {

  trailPosition: number[]
  prg: Program

  noiseInput: Input;
  time: Input;
  timeU: Uniform;

  color: Input;
  colorU: Uniform;

  mixBorder: Input;
  mixBorderU: Uniform;

  offset: Input;
  offsetU: Uniform;

  speedThreshold: Input;
  speedThresholdU: Uniform;

  alpha: Input;
  alphaU: Uniform;

  thickness: Input;
  thicknessU: Uniform
  thicknessV = 0.13;
  timeV = 1;

  speed: Input;
  speedU: Uniform;

  constructor(noiseTex: Texture) {
    super(true, true);
    this.addChild(this.time = new Input("uTime", 1, ShaderType.ALL));
    this.addChild(this.thickness = new Input("thickness", 1, ShaderType.VERTEX));
    this.addChild(this.speed = new Input("uSpeed", 1, ShaderType.ALL));
    this.addChild(this.noiseInput = new Input("noise", 4, ShaderType.FRAGMENT));
    this.addChild(this.alpha = new Input("uAlpha", 1, ShaderType.FRAGMENT));
    this.addChild(this.color = new Input("uColor", 3, ShaderType.FRAGMENT));
    this.addChild(this.speedThreshold = new Input("uSpeedThreshold", 1, ShaderType.VERTEX));
    this.addChild(this.mixBorder = new Input("uMixBorder", 1, ShaderType.ALL));
    this.addChild(this.offset = new Input("uOffset", 3, ShaderType.VERTEX));


    this.offsetU = this.offset.attachUniform();
    this.offsetU.set(0, 0, 0);
    // this.thicknessV = thickness + Math.random() * thickness;
    this.thicknessU = this.thickness.attachUniform();
    this.thicknessU.set(this.thicknessV);

    this.speedU = this.speed.attachUniform();
    this.speedThresholdU = this.speedThreshold.attachUniform();
    this.mixBorderU = this.mixBorder.attachUniform();
    this.alphaU = this.alpha.attachUniform();
    this.alphaU.set(1);

    this.speedThresholdU.set(0.03);
    this.mixBorderU.set(1);

    this.colorU = this.color.attachUniform();
    // this.colorU.set(colorVec[0], colorVec[1], colorVec[2]);

    const tc = TexCoord.create("aTexCoord0");
    this.noiseInput.attachSampler("noisecolor", tc).set(noiseTex);

    this.timeV = Math.random() * 10;
    this.timeU = this.time.attachUniform();
    // this.timeU.set(this.timeV);
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pv", VertCode({ slot: "pv" }));
    slots.add("postv", VertCode({ slot: "postv" }));
    slots.add("pf", FragCode({ slot: "pf" }));
    slots.add("postf", FragCode({ slot: "postf" }));
  }

  dispose() { }

}