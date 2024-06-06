import CreateShader from "@webgl/core/CreateProgram";
import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType } from "nanogl-pbr/Input";

import VertModule from "./reed-wind.vert";

const VertCode = CreateShader(VertModule);

export default class ReedWind extends Chunk {
  time: Input

  constructor() {
    super(true, false);

    this.addChild(
      (this.time = new Input("uTime", 1, ShaderType.VERTEX))
    );
    this.time.attachConstant(0);

    VertCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("vertex_warp_world", VertCode({ slot: "vertex_warp_world" }));
  }
}
