import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType } from "nanogl-pbr/Input";

import CreateShader from "@webgl/core/CreateProgram";
import { FOG_STEP, RIVER_LENGTH } from "@webgl/activities/Scene3/constants";

import shaderFrag from "./fog.frag";

const FragCode = CreateShader(shaderFrag);

const MAX_DIST = RIVER_LENGTH * 0.5;

export default class Fog extends Chunk {
  minDist: Input;
  maxDist: Input;

  constructor() {
    super(true, false);

    this.addChild(
      (this.minDist = new Input("uMinDist", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.maxDist = new Input("uMaxDist", 1, ShaderType.FRAGMENT))
    );

    this.minDist.attachConstant(MAX_DIST - FOG_STEP);
    this.maxDist.attachConstant(MAX_DIST);

    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("postf", FragCode({ slot: "postf" }));
  }
}
