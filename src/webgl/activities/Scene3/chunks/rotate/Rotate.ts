import Chunk from "nanogl-pbr/Chunk";
import Texture2D from "nanogl/texture-2d";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType } from "nanogl-pbr/Input";

import CreateShader from "@webgl/core/CreateProgram";

import shaderVert from "./rotate.vert";

const VertCode = CreateShader(shaderVert);

export default class Rotate extends Chunk {
  time: Input;
  seed: Input;
  noise: Input;

  constructor(noiseTex: Texture2D) {
    super(true, false);

    this.addChild(
      (this.noise = new Input("noise", 4, ShaderType.VERTEX))
    );
    this.addChild(
      (this.time = new Input("uRotateTime", 1, ShaderType.VERTEX))
    );
    this.addChild(
      (this.seed = new Input("uRotateSeed", 1, ShaderType.VERTEX))
    );

    this.time.attachConstant(0);
    this.seed.attachConstant(0);
    this.noise.attachSampler("noiseTex").set(noiseTex);

    VertCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pv", VertCode({ slot: "pv" }));
    slots.add("vertex_warp", VertCode({ slot: "vertex_warp" }));
  }
}
