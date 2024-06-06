import Chunk from "nanogl-pbr/Chunk";
import Texture2D from "nanogl/texture-2d";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { Sampler, ShaderType, Uniform } from "nanogl-pbr/Input";
import { StandardPass } from "nanogl-pbr/StandardPass";

import CreateShader from "@webgl/core/CreateProgram";

import shaderVert from "./rock-moss.vert";
import shaderFrag from "./rock-moss.frag";

const VertCode = CreateShader(shaderVert);
const FragCode = CreateShader(shaderFrag);

export default class RockMoss extends Chunk {
  mossNoise: Input;
  mossTexture: Input;
  mossProgress: Input;
  mossEndProgress: Input;

  mossProgressUniform: Uniform;
  mossEndProgressUniform: Uniform;

  constructor(mossTex: Texture2D, noiseTex: Texture2D, pass: StandardPass) {
    super(true, false);

    this.addChild(
      (this.mossNoise = new Input("noise", 4, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.mossTexture = new Input("mossTex", 4, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.mossProgress = new Input("uMossProgress", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.mossEndProgress = new Input("uMossEndProgress", 1, ShaderType.FRAGMENT))
    );

    this.mossProgressUniform = this.mossProgress.attachUniform();
    this.mossEndProgressUniform = this.mossEndProgress.attachUniform();
    this.mossNoise
      .attachSampler("noiseTex")
      .set(noiseTex);

    const baseColor = (pass.surface.baseColor.param as Sampler);
    const mossTexSampler = this.mossTexture
      .attachSampler("mossTex", baseColor.texCoords, "rgb");
    mossTexSampler.colorspace = baseColor.colorspace;
    mossTexSampler.set(mossTex);

    VertCode.onHmr(() => this.invalidateCode());
    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pv", VertCode({ slot: "pv" }));
    slots.add("postv", VertCode({ slot: "postv" }));
    slots.add("pf", FragCode({ slot: "pf" }));
    slots.add("f", FragCode({ slot: "f" }));
  }
}
