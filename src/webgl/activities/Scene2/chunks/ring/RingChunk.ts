import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Texture2D from "nanogl/texture-2d";
import FragModule from "./ring.frag";
import CreateShader from "@webgl/core/CreateProgram";
import Input, { Sampler, ShaderType, Uniform } from "nanogl-pbr/Input";
import TexCoord, { StaticTexCoord } from "nanogl-pbr/TexCoord";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";
import { StandardPass } from "nanogl-pbr/StandardPass";

const FragCode = CreateShader(FragModule);

export default class RingChunk extends Chunk {

  timeInput: Input;
  timeU: Uniform;
  speedInput: Input;
  speedU: Uniform;

  opacityInput: Input;
  opacityU: Uniform;

  transformedCode: string
  constructor(pass: StandardPass<MetalnessSurface>) {
    super(true, false);

    this.addChild(this.timeInput = new Input("uTime", 1, ShaderType.FRAGMENT));
    this.addChild(this.speedInput = new Input("uSpeed", 1, ShaderType.FRAGMENT));
    this.addChild(this.opacityInput = new Input("uOpacity", 1, ShaderType.FRAGMENT));

    // this.timeU = this.timeInput.attachUniform()
    this.speedU = this.speedInput.attachUniform()
    this.opacityU = this.opacityInput.attachUniform()

    this.speedU.set(1)

    this.transformedCode = ((pass.surface.baseColor.param as Sampler).texCoords as StaticTexCoord).getTransformCode();
    this.transformedCode = this.transformedCode.split(" ")[0];
    this.transformedCode = `
    VAL_tex_basecolor${this.transformedCode} = texture2D(tex_basecolor, ${this.transformedCode} * vec2(uSpeed(), 1.));
    `;

  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("f", this.transformedCode);
    // slots.add("pf", FragCode({ slot: "pf" }));
    slots.add("postf", FragCode({ slot: "postf" }));
  }

}