import CreateShader from "@webgl/core/CreateProgram";
import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType } from "nanogl-pbr/Input";

import FragModule from "./csb-fix.frag";

const FragCode = CreateShader(FragModule);

export default class CSBFix extends Chunk {
  brightness: Input
  saturation: Input
  contrast: Input

  constructor() {
    super(true, false);

    this.addChild(
      (this.brightness = new Input("uBrightness", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.saturation = new Input("uSaturation", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.contrast = new Input("uContrast", 1, ShaderType.FRAGMENT))
    );

    this.brightness.attachConstant(1);
    this.saturation.attachConstant(1);
    this.contrast.attachConstant(1);

    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pf", FragCode({ slot: "pf" }));
    slots.add("postf", FragCode({ slot: "postf" }));
  }
}
