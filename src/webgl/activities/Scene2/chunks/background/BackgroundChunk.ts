import CreateShader from "@webgl/core/CreateProgram";
import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType } from "nanogl-pbr/Input";
import Material from "nanogl-pbr/Material";

import FragModule from "./background.frag";
import Program from "nanogl/program";

const FragCode = CreateShader(FragModule);

export default class BackgroundChunk extends Chunk {
  topColor: Input;
  middleColor: Input;
  bottomColor: Input;
  type: Input;
  radialStrength: Input;
  useClampedMix: Input;

  transformedCode: string

  constructor(material: Material) {
    super(true, true);

    this.addChild(
      (this.topColor = new Input("uTopColor", 4, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.middleColor = new Input("uMiddleColor", 4, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.bottomColor = new Input("uBottomColor", 4, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.type = new Input("uType", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.radialStrength = new Input("uRadialStrength", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.useClampedMix = new Input("uUseClampedMix", 1, ShaderType.FRAGMENT))
    );

    this.topColor.attachConstant([1, 0, 0, 1]);
    this.middleColor.attachConstant([0, 1, 0, 0.5]);
    this.bottomColor.attachConstant([0, 0, 1, 0]);
    this.type.attachConstant(2);
    this.radialStrength.attachConstant(1);
    this.useClampedMix.attachConstant(0);

    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pv",
      `
    IN mediump vec2 aTexCoord0;
    OUT mediump vec2 vTexCoord0;
    `);
    slots.add("postv",
      `
    vTexCoord0 = aTexCoord0;
    `);
    slots.add("pf", FragCode({ slot: "pf" }));
    slots.add("postf", FragCode({ slot: "postf" }));
  }

  setup(prg: Program): void {
    if (!prg.tex_basecolor) prg.tex_basecolor = () => { }
    if (!prg.uMetalnessFactor) prg.uMetalnessFactor = () => { }
  }


}
