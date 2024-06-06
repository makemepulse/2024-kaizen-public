import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import CreateShader from "@webgl/core/CreateProgram";
import { StandardPass } from "nanogl-pbr/StandardPass";
import Input, { Sampler, ShaderType, Uniform } from "nanogl-pbr/Input";

import shaderVert from "./cloud.vert";
import shaderFrag from "./cloud.frag";
import Program from "nanogl/program";

const VertCode = CreateShader(shaderVert);
const FragCode = CreateShader(shaderFrag);

export default class CloudChunk extends Chunk {
  cameraPos: Input;
  zDepthCameraPos: Uniform;

  maxDist: Input;
  minDist: Input;
  maxDistUniform: Uniform;
  minDistUniform: Uniform;

  isFogEnabled: Input;
  isFogEnabledUniform: Uniform;

  opacity: Input;
  opacityUniform: Uniform;

  time: Input;
  timeUniform: Uniform;
  originalVarying: string;

  progressInput: Input;
  progressUniform: Uniform;

  cloudColorSlow: Input;
  cloudColorSlowUniform: Uniform;

  cloudColorFast: Input;
  cloudColorFastUniform: Uniform;

  cloudUpDownFade: Input;
  cloudUpDownFadeUniform: Uniform;

  constructor(pass: StandardPass) {
    super(true, true);
    this.addChild(this.time = new Input("uTime", 1, ShaderType.FRAGMENT));
    this.addChild(this.maxDist = new Input("MaxDist", 1, ShaderType.FRAGMENT));
    this.addChild(this.minDist = new Input("MinDist", 1, ShaderType.FRAGMENT));
    this.addChild(this.cameraPos = new Input("CameraPos", 3, ShaderType.VERTEX));
    this.addChild(this.isFogEnabled = new Input("IsFogEnabled", 1, ShaderType.FRAGMENT));
    this.addChild(this.progressInput = new Input("CloudsProgress", 1, ShaderType.FRAGMENT));
    this.addChild(this.cloudColorSlow = new Input("CloudColorSlow", 3, ShaderType.FRAGMENT));
    this.addChild(this.cloudColorFast = new Input("CloudColorFast", 3, ShaderType.FRAGMENT));
    this.addChild(this.cloudUpDownFade = new Input("CloudUpDownFade", 1, ShaderType.FRAGMENT));
    this.addChild(this.opacity = new Input("uOpacityUniform", 1, ShaderType.FRAGMENT));

    this.zDepthCameraPos = this.cameraPos.attachUniform();

    this.timeUniform = this.time.attachUniform();
    this.maxDistUniform = this.maxDist.attachUniform();
    this.minDistUniform = this.minDist.attachUniform();
    this.progressUniform = this.progressInput.attachUniform();
    this.isFogEnabledUniform = this.isFogEnabled.attachUniform();
    this.cloudColorSlowUniform = this.cloudColorSlow.attachUniform();
    this.cloudColorFastUniform = this.cloudColorFast.attachUniform();
    this.cloudUpDownFadeUniform = this.cloudUpDownFade.attachUniform();
    this.opacityUniform = this.opacity.attachUniform();

    this.timeUniform.set(0);
    this.progressUniform.set(0);
    this.maxDistUniform.set(600.0);
    this.minDistUniform.set(450.0);
    this.isFogEnabledUniform.set(1);
    this.zDepthCameraPos.set(0, 0, 0);
    this.cloudUpDownFadeUniform.set(60.0);
    this.cloudColorSlowUniform.set(1.0, 0.82, 0.55);
    this.cloudColorFastUniform.set(1.0, 0.93, 0.83);
    this.opacityUniform.set(1);

    // change texture coordinates of base color to use custom coords - cf WaterMove from Romane
    const baseColorParam = pass.surface.baseColor.param as Sampler;
    this.originalVarying = baseColorParam._varying;
    baseColorParam._varying = "customCoords";

    VertCode.onHmr(() => this.invalidateCode());
    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pv", VertCode({ slot: "pv" }));
    slots.add("postv", VertCode({ slot: "postv" }));
    slots.add("pf", FragCode({ slot: "pf" }));
    slots.add("f", FragCode({ slot: "f", originalVarying: this.originalVarying }));
    slots.add("postf", FragCode({ slot: "postf" }));
  }

  setup(prg: Program): void {
    if (!prg.UambientAdd) prg.UambientAdd = () => { };
  }
}