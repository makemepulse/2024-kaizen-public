import Chunk from "nanogl-pbr/Chunk";
import VertModule from "./zdepth.vert";
import FragModule from "./zdepth.frag";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import CreateShader from "@webgl/core/CreateProgram";
import Input, { ShaderType, Uniform } from "nanogl-pbr/Input";

const FragCode = CreateShader(FragModule);
const VertCode = CreateShader(VertModule);

export default class ZDepth extends Chunk {
  cameraPos: Input;
  zDepthCameraPos: Uniform;

  maxDist: Input;
  maxDistUniform: Uniform;

  minDist: Input;
  minDistUniform: Uniform;

  bottomFade: Input;
  bottomFadeUniform: Uniform;

  topFade: Input;
  topFadeUniform: Uniform;

  isFogEnabled: Input;
  isFogEnabledUniform: Uniform;

  isAlphaEnabled: Input;
  isAlphaEnabledUniform: Uniform;

  constructor() {
    super(true, false);

    this.addChild(this.maxDist = new Input("MaxDist", 1, ShaderType.FRAGMENT));
    this.addChild(this.minDist = new Input("MinDist", 1, ShaderType.FRAGMENT));
    this.addChild(this.topFade = new Input("TopFade", 1, ShaderType.FRAGMENT));
    this.addChild(this.cameraPos = new Input("CameraPos", 3, ShaderType.VERTEX));
    this.addChild(this.bottomFade = new Input("BottomFade", 1, ShaderType.FRAGMENT));
    this.addChild(this.isFogEnabled = new Input("IsFogEnabled", 1, ShaderType.FRAGMENT));
    this.addChild(this.isAlphaEnabled = new Input("IsAlphaEnabled", 1, ShaderType.FRAGMENT));

    this.zDepthCameraPos = this.cameraPos.attachUniform();
    this.zDepthCameraPos.set(0, 0, 0);

    this.maxDistUniform = this.maxDist.attachUniform();
    this.maxDistUniform.set(36);

    this.minDistUniform = this.minDist.attachUniform();
    this.minDistUniform.set(10);

    this.isFogEnabledUniform = this.isFogEnabled.attachUniform();
    this.isFogEnabledUniform.set(1);

    this.isAlphaEnabledUniform = this.isAlphaEnabled.attachUniform();
    this.isAlphaEnabledUniform.set(1);

    this.bottomFadeUniform = this.bottomFade.attachUniform();
    this.bottomFadeUniform.set(1);

    this.topFadeUniform = this.topFade.attachUniform();
    this.topFadeUniform.set(20);

    FragCode.onHmr(() => this.invalidateCode());
    VertCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pv", VertCode({ slot: "pv" }));
    slots.add("postv", VertCode({ slot: "postv" }));
    slots.add("pf", FragCode({ slot: "pf" }));
    slots.add("postf", FragCode({ slot: "postf" }));
  }

}