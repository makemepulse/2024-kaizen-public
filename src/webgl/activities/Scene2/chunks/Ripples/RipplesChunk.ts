import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import FragModule from "./ripples.frag";
import CreateShader from "@webgl/core/CreateProgram";
import Input, { ShaderType, Uniform } from "nanogl-pbr/Input";
import Program from "nanogl/program";
import Renderer from "@webgl/Renderer";

const FragCode = CreateShader(FragModule);

export default class RipplesChunk extends Chunk {
  noiseInput: Input;

  timeInput: Input;
  timeU: Uniform;

  opacityInput: Input;
  opacityU: Uniform;

  constructor(renderer: Renderer) {
    super(true, true);

    this.addChild(this.noiseInput = new Input("noise", 3, ShaderType.FRAGMENT));
    this.addChild(this.timeInput = new Input("uRippleTime", 1, ShaderType.FRAGMENT));
    this.addChild(this.opacityInput = new Input("uOpacity", 1, ShaderType.FRAGMENT));

    this.timeU = this.timeInput.attachUniform();
    this.opacityU = this.opacityInput.attachUniform();
    this.noiseInput
      .attachSampler("noiseTex")
      .set(renderer.scene.texturePool.get("perlinNoise").texture);
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pf", FragCode({ slot: "pf" }));
    slots.add("postf", FragCode({ slot: "postf" }));
  }

  setup(prg: Program): void {
    if (!prg.UuRippleTime) prg.UuRippleTime = () => { }
  }

}