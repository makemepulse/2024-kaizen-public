import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { Sampler, ShaderType, Uniform } from "nanogl-pbr/Input";
import { StandardPass } from "nanogl-pbr/StandardPass";

import CreateShader from "@webgl/core/CreateProgram";

import shaderFrag from "./stretch-scroll.frag";

const FragCode = CreateShader(shaderFrag);

export default class StretchScroll extends Chunk {
  time: Input;
  scale: Input;
  offset: Input;
  stretch: Input;
  stretchOffset: Input;

  timeUniform: Uniform;
  scaleUniform: Uniform;
  offsetUniform: Uniform;
  stretchUniform: Uniform;
  stretchOffsetUniform: Uniform;

  originalVarying: string;

  constructor(pass: StandardPass) {
    super(true, false);

    this.addChild(
      (this.time = new Input("uScrollTime", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.scale = new Input("uScrollScale", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.stretch = new Input("uScrollStretch", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.stretchOffset = new Input("uScrollStretchOffset", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.offset = new Input("uScrollOffset", 1, ShaderType.FRAGMENT))
    );

    this.timeUniform = this.time.attachUniform();
    this.scaleUniform = this.scale.attachUniform();
    this.offsetUniform = this.offset.attachUniform();
    this.stretchUniform = this.stretch.attachUniform();
    this.stretchOffsetUniform = this.stretchOffset.attachUniform();

    const baseColorParam = pass.surface.baseColor.param as Sampler;
    // save original varying of base color
    this.originalVarying = baseColorParam._varying;
    // change texture coordinates of base color to use custom coords
    baseColorParam._varying = "stretchCoords";

    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("f", FragCode({ slot: "f", originalVarying: this.originalVarying }));
  }
}
