import CreateShader from "@webgl/core/CreateProgram";
import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType } from "nanogl-pbr/Input";

import VertModule from "./lily-move.vert";

const VertCode = CreateShader(VertModule);

export default class LilyMove extends Chunk {
  time: Input
  noise: Input
  moveFactor: Input

  constructor() {
    super(true, false);

    this.addChild(
      (this.time = new Input("uTime", 1, ShaderType.VERTEX))
    );
    this.addChild(
      (this.noise = new Input("noise", 4, ShaderType.VERTEX))
    );
    this.addChild(
      (this.moveFactor = new Input("uMoveFactor", 1, ShaderType.VERTEX))
    );

    this.time.attachConstant(0);
    this.moveFactor.attachConstant(1);

    VertCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pv", VertCode({ slot: "pv" }));
    slots.add("vertex_warp", VertCode({ slot: "vertex_warp" }));
    slots.add("vertex_warp_world", VertCode({ slot: "vertex_warp_world" }));
  }
}
