import CreateShader from "@webgl/core/CreateProgram";
import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType } from "nanogl-pbr/Input";

import VertModule from "./underwater-rock.vert";
import FragModule from "./underwater-rock.frag";

const VertCode = CreateShader(VertModule);
const FragCode = CreateShader(FragModule);

export default class UnderwaterRock extends Chunk {
  waterHeight: Input;
  distortionFactor: Input;
  opacityThreshold: Input;
  waterColor: Input;

  constructor() {
    super(true, false);

    this.addChild(
      (this.waterHeight = new Input("uWaterHeight", 1, ShaderType.VERTEX))
    );
    this.addChild(
      (this.distortionFactor = new Input("uDistortionFactor", 1, ShaderType.VERTEX))
    );
    this.addChild(
      (this.opacityThreshold = new Input("uOpacityThreshold", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.waterColor = new Input("uWaterColor", 3, ShaderType.FRAGMENT))
    );

    this.waterHeight.attachConstant(0);
    this.distortionFactor.attachConstant(1);
    this.opacityThreshold.attachConstant(1);
    this.waterColor.attachConstant([0, 0, 1]);

    VertCode.onHmr(() => this.invalidateCode());
    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pv", VertCode({ slot: "pv" }));
    slots.add("vertex_warp_world", VertCode({ slot: "vertex_warp_world" }));
    slots.add("pf", FragCode({ slot: "pf" }));
    slots.add("postf", FragCode({ slot: "postf" }));
  }
}
