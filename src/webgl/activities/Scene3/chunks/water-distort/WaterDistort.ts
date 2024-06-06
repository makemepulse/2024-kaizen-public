import Chunk from "nanogl-pbr/Chunk";
import Texture2D from "nanogl/texture-2d";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import { StandardPass } from "nanogl-pbr/StandardPass";
import Input, { Sampler, ShaderType, Uniform } from "nanogl-pbr/Input";

import CreateShader from "@webgl/core/CreateProgram";

import shaderVert from "./water-distort.vert";
import shaderFrag from "./water-distort.frag";

const VertCode = CreateShader(shaderVert);
const FragCode = CreateShader(shaderFrag);

export default class WaterDistort extends Chunk {
  time: Input
  scroll: Input
  waterNoise: Input;
  offsetScale: Input;

  timeUniform: Uniform;
  scrollUniform: Uniform;
  offsetScaleUniform: Uniform;

  originalVarying: string;

  constructor(pass: StandardPass, noiseTex: Texture2D) {
    super(true, false);

    this.addChild(
      (this.waterNoise = new Input("noise", 4, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.offsetScale = new Input("uOffsetScale", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.time = new Input("uWaterTime", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.scroll = new Input("uRiverScroll", 1, ShaderType.FRAGMENT))
    );

    this.timeUniform = this.time.attachUniform();
    this.scrollUniform = this.scroll.attachUniform();
    this.offsetScaleUniform = this.offsetScale.attachUniform();
    this.waterNoise.attachSampler("noiseTex").set(noiseTex);

    const baseColorParam = pass.surface.baseColor.param as Sampler;
    // save original varying of base color
    this.originalVarying = baseColorParam._varying;
    // change texture coordinates of base color to use custom coords
    baseColorParam._varying = "customCoords";

    VertCode.onHmr(() => this.invalidateCode());
    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pv", VertCode({ slot: "pv" }));
    slots.add("vertex_warp_world", VertCode({ slot: "vertex_warp_world" }));
    slots.add("pf", FragCode({ slot: "pf" }));
    slots.add("f", FragCode({ slot: "f", originalVarying: this.originalVarying }));
  }
}
