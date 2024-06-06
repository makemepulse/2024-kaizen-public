import Chunk from "nanogl-pbr/Chunk";
import VertModule from "./ground.vert";
import FragModule from "./ground.frag";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import CreateShader from "@webgl/core/CreateProgram";
import Input, { ShaderType, Uniform } from "nanogl-pbr/Input";

const FragCode = CreateShader(FragModule);
const VertCode = CreateShader(VertModule);

export default class GroundChunk extends Chunk {
  color: Input;
  cameraPos: Input;
  groundCameraPos: Uniform;
  clearColor: Uniform;

  maxDist: Input;
  minDist: Input;
  maxDistUniform: Uniform;
  minDistUniform: Uniform;

  isFogEnabled: Input;
  isFogEnabledUniform: Uniform;

  constructor() {
    super(true, false);
    this.addChild(this.color = new Input("ClearColor", 3, ShaderType.FRAGMENT));
    this.addChild(this.cameraPos = new Input("CameraPos", 3, ShaderType.VERTEX));
    this.addChild(this.maxDist = new Input("MaxDist", 1, ShaderType.FRAGMENT));
    this.addChild(this.minDist = new Input("MinDist", 1, ShaderType.FRAGMENT));
    this.addChild(this.isFogEnabled = new Input("IsFogEnabled", 1, ShaderType.FRAGMENT));

    this.groundCameraPos = this.cameraPos.attachUniform();
    this.groundCameraPos.set(0, 0, 0);

    this.clearColor = this.color.attachUniform();
    this.clearColor.set(0.0, 1.0, 0.0);

    this.maxDistUniform = this.maxDist.attachUniform();
    this.maxDistUniform.set(36);

    this.minDistUniform = this.minDist.attachUniform();
    this.minDistUniform.set(10);

    this.isFogEnabledUniform = this.isFogEnabled.attachUniform();
    this.isFogEnabledUniform.set(1);

    FragCode.onHmr(()=>this.invalidateCode());
    VertCode.onHmr(()=>this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pv", VertCode({slot:"pv"}));
    slots.add("postv", VertCode({slot:"postv"}));
    slots.add("pf", FragCode({slot:"pf"}));
    slots.add("postf"    , FragCode({slot:"postf"    }));
  }

}