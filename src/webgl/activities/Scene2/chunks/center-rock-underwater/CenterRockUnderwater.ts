import CreateShader from "@webgl/core/CreateProgram";
import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";

import VertModule from "./center-rock-underwater.vert";
import FragModule from "./center-rock-underwater.frag";

const VertCode = CreateShader(VertModule);
const FragCode = CreateShader(FragModule);

export default class CenterRockUnderwater extends Chunk {

  constructor() {
    super(true, false);

    VertCode.onHmr(() => this.invalidateCode());
    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pv", VertCode({ slot: "pv" }));
    slots.add("postv", VertCode({ slot: "postv" }));
    slots.add("pf", FragCode({ slot: "pf" }));
    slots.add("postf", FragCode({ slot: "postf" }));
  }
}
