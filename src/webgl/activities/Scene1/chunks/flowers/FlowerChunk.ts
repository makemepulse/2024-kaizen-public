import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType, Uniform } from "nanogl-pbr/Input";

import shaderVert from "./FlowerChunk.vert";
import shaderFrag from "./FlowerChunk.frag";
import CreateShader from "@webgl/core/CreateProgram";

const VertCode = CreateShader(shaderVert);
const FragCode = CreateShader(shaderFrag);

export default class FlowerChunk extends Chunk {
  uTime: Input;
  uTimeUniform: Uniform;
  uScale: Input;
  uScaleUniform: Uniform;
  uMousePos: Input;
  uMousePosUniform: Uniform;
  uRadius: Input;
  uRadiusUniform: Uniform;
  cameraPos: Input;
  cameraPosUniform: Uniform;
  maxDistScale: Input;
  maxDistScaleUniform: Uniform;
  minDistScale: Input;
  minDistScaleUniform: Uniform;

  constructor() {
    super(true, false);

    this.addChild(this.uTime = new Input("uTime", 1, ShaderType.VERTEX));
    this.uTimeUniform = this.uTime.attachUniform();
    this.uTimeUniform.set(0);

    this.addChild(this.uMousePos = new Input("uMousePos", 3, ShaderType.VERTEX));
    this.uMousePosUniform = this.uMousePos.attachUniform();

    this.addChild(this.uRadius = new Input("uRadius", 1, ShaderType.VERTEX));
    this.uRadiusUniform = this.uRadius.attachUniform();
    this.uRadiusUniform.set(66);

    this.addChild(this.cameraPos = new Input("CameraPos", 3, ShaderType.VERTEX));
    this.addChild(this.maxDistScale = new Input("MaxDistScale", 1, ShaderType.VERTEX));
    this.addChild(this.minDistScale = new Input("MinDistScale", 1, ShaderType.VERTEX));

    this.addChild(this.uScale = new Input("uScale", 1, ShaderType.VERTEX));

    this.uScaleUniform = this.uScale.attachUniform();
    this.uScaleUniform.set(0);

    this.cameraPosUniform = this.cameraPos.attachUniform();
    this.cameraPosUniform.set(0, 0, 0);

    this.maxDistScaleUniform = this.maxDistScale.attachUniform();
    this.maxDistScaleUniform.set(90);

    this.minDistScaleUniform = this.minDistScale.attachUniform();
    this.minDistScaleUniform.set(190);

    this.uMousePosUniform.set(0, 13, 41);

    VertCode.onHmr(() => this.invalidateCode());
    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pv", VertCode({ slot: "pv" }));
    slots.add("vertex_warp", VertCode({ slot: "vertex_warp" }));
    slots.add("pf", FragCode({ slot: "pf" }));
    slots.add("postf", FragCode({ slot: "postf" }));
  }

}