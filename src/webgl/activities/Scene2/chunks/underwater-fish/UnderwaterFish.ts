import CreateShader from "@webgl/core/CreateProgram";
import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType } from "nanogl-pbr/Input";

import VertModule from "./underwater-fish.vert";
import FragModule from "./underwater-fish.frag";

const VertCode = CreateShader(VertModule);
const FragCode = CreateShader(FragModule);

export default class UnderwaterFish extends Chunk {
  waterHeight: Input;
  waterColor: Input;
  deepWaterColor: Input;
  deepWaterColorFactor: Input;
  time: Input;
  noise: Input;
  viewportSize: Input;
  cameraPos: Input;

  constructor() {
    super(true, false);

    this.addChild(
      (this.waterHeight = new Input("uWaterHeight", 1, ShaderType.VERTEX))
    );
    this.addChild(
      (this.waterColor = new Input("uWaterColor", 3, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.deepWaterColor = new Input("uDeepWaterColor", 3, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.deepWaterColorFactor = new Input("uDeepWaterColorFactor", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.time = new Input("uTime", 1, ShaderType.VERTEX))
    );
    this.addChild(
      (this.noise = new Input("noise", 4, ShaderType.VERTEX))
    );
    this.addChild(
      (this.viewportSize = new Input("uViewportSize", 2, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.cameraPos = new Input("uCameraPos", 3, ShaderType.VERTEX))
    );

    this.waterHeight.attachConstant(0);
    this.waterColor.attachConstant([0, 1, 0]);
    this.deepWaterColor.attachConstant([0, 0, 0]);
    this.deepWaterColorFactor.attachConstant(1);
    this.time.attachConstant(0);
    this.viewportSize.attachConstant([0, 0]);
    this.cameraPos.attachConstant([0, 0, 0]);

    VertCode.onHmr(() => this.invalidateCode());
    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pv", VertCode({ slot: "pv" }));
    slots.add("vertex_warp_world", VertCode({ slot: "vertex_warp_world" }));
    slots.add("postv", VertCode({ slot: "postv" }));
    slots.add("pf", FragCode({ slot: "pf" }));
    slots.add("postf", FragCode({ slot: "postf" }));
  }
}
