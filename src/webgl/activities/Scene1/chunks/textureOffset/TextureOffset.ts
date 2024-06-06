import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { Sampler, ShaderType, Uniform } from "nanogl-pbr/Input";
import { StandardPass } from "nanogl-pbr/StandardPass";

import shaderVert from "./TextureOffset.vert";
import shaderFrag from "./TextureOffset.frag";
import CreateShader from "@webgl/core/CreateProgram";

const VertCode = CreateShader(shaderVert);
const FragCode = CreateShader(shaderFrag);

export default class TextureOffset extends Chunk {

  originalVarying: string;

  constructor(pass: StandardPass) {
    super(true, false);

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

}