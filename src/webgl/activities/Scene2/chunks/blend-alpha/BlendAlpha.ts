import CreateShader from "@webgl/core/CreateProgram";
import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType } from "nanogl-pbr/Input";

import FragModule from "./blend-alpha.frag";

const FragCode = CreateShader(FragModule);

export default class BlendAlpha extends Chunk {
  threshold: Input
  opacity: Input
  shadowThreshold: Input

  constructor() {
    super(true, false);

    this.addChild(
      (this.threshold = new Input("uThreshold", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.opacity = new Input("uOpacity", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.shadowThreshold = new Input("uShadowThreshold", 1, ShaderType.FRAGMENT))
    );

    this.threshold.attachConstant(0.5);
    this.opacity.attachConstant(1);
    this.shadowThreshold.attachConstant(0.5);

    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("postf", FragCode({ slot: "postf" }));
  }
}
