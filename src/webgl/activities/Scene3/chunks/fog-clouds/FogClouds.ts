import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType, Uniform } from "nanogl-pbr/Input";

import CreateShader from "@webgl/core/CreateProgram";
import { FOG_STEP, RIVER_LENGTH } from "@webgl/activities/Scene3/constants";

import shaderFrag from "./fog-clouds.frag";

const FragCode = CreateShader(shaderFrag);

const MAX_DIST = RIVER_LENGTH * 0.5;

export default class FogClouds extends Chunk {
  cameraY: Input;
  minDistZ: Input;
  maxDistZ: Input;
  minLimitY: Input;
  maxLimitY: Input;

  cameraYUniform: Uniform;

  constructor() {
    super(true, false);

    this.addChild(
      (this.cameraY = new Input("uCameraY", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.minDistZ = new Input("uMinDistZ", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.maxDistZ = new Input("uMaxDistZ", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.minLimitY = new Input("uMinLimitY", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.maxLimitY = new Input("uMaxLimitY", 1, ShaderType.FRAGMENT))
    );

    this.minDistZ.attachConstant(MAX_DIST - FOG_STEP * 2);
    this.maxDistZ.attachConstant(MAX_DIST);
    this.minLimitY.attachConstant(0);
    this.maxLimitY.attachConstant(5);
    this.cameraYUniform = this.cameraY.attachUniform();

    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("postf", FragCode({ slot: "postf" }));
  }
}
