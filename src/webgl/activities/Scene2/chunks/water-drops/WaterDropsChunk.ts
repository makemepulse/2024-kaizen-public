import CreateShader from "@webgl/core/CreateProgram";
import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType } from "nanogl-pbr/Input";

import VertModule from "./water-drops.vert";
import FragModule from "./water-drops.frag";

const VertCode = CreateShader(VertModule);
const FragCode = CreateShader(FragModule);

export default class WaterDropsChunk extends Chunk {
  cameraRight: Input
  cameraUp: Input
  color: Input

  constructor() {
    super(true, false);

    this.addChild(
      (this.cameraRight = new Input("uCameraRight", 3, ShaderType.VERTEX))
    );
    this.addChild(
      (this.cameraUp = new Input("uCameraUp", 3, ShaderType.VERTEX))
    );
    this.addChild(
      (this.color = new Input("uColor", 3, ShaderType.FRAGMENT))
    );

    this.cameraRight.attachConstant([0, 0, 0]);
    this.cameraUp.attachConstant([0, 0, 0]);
    this.color.attachConstant([160 / 255, 214 / 255, 217 / 255]);

    VertCode.onHmr(() => this.invalidateCode());
    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pv", VertCode({ slot: "pv" }));
    slots.add("vertex_warp", VertCode({ slot: "vertex_warp" }));
    slots.add("vertex_warp_world", VertCode({ slot: "vertex_warp_world" }));
    slots.add("postf", FragCode({ slot: "postf" }));
  }
}
