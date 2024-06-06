import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType } from "nanogl-pbr/Input";

import CreateShader from "@webgl/core/CreateProgram";
import { BACKGROUND_BOTTOM_COLOR } from "@webgl/activities/Scene3/constants";

import shaderFrag from "./underwater.frag";

const FragCode = CreateShader(shaderFrag);

export default class Underwater extends Chunk {
  color: Input;

  constructor() {
    super(true, false);

    this.addChild(
      (this.color = new Input("uUnderwaterColor", 3, ShaderType.FRAGMENT))
    );

    this.color.attachConstant(BACKGROUND_BOTTOM_COLOR);

    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("postf", FragCode({ slot: "postf" }));
  }
}
