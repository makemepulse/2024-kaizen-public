import CreateShader from "@webgl/core/CreateProgram";
import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { Sampler, ShaderType } from "nanogl-pbr/Input";

import FragModule from "./clouds.frag";
import Material from "nanogl-pbr/Material";
import { StandardPass } from "nanogl-pbr/StandardPass";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";
import { StaticTexCoord } from "nanogl-pbr/TexCoord";

const FragCode = CreateShader(FragModule);

export default class CloudsChunk extends Chunk {
  opacity: Input
  color: Input
  time: Input

  transformedCode: string

  constructor(material: Material) {
    super(true, false);

    this.addChild(
      (this.opacity = new Input("uOpacity", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.color = new Input("uColor", 3, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.time = new Input("uTime", 1, ShaderType.FRAGMENT))
    );

    this.transformedCode = (((material.getPass("color").pass as StandardPass<MetalnessSurface>).surface.baseColor.param as Sampler).texCoords as StaticTexCoord).getTransformCode();
    this.transformedCode = this.transformedCode.split(" ")[0];
    this.transformedCode = `
    VAL_tex_basecolor${this.transformedCode} = texture2D(tex_basecolor, (${this.transformedCode} + vec2(uTime(), 0.)) * vec2(2., 1.));
    VAL_tex_basecolor${this.transformedCode}.rgb = VAL_tex_basecolor${this.transformedCode}.rgb*VAL_tex_basecolor${this.transformedCode}.rgb;
    VAL_tex_emissive${this.transformedCode} = texture2D(tex_emissive, (${this.transformedCode} + vec2(uTime(), 0.)) * vec2(2., 1.));
    `;

    this.opacity.attachConstant(1);
    this.color.attachConstant([1, 1, 1]);
    this.time.attachConstant(0);

    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("f", this.transformedCode);
    slots.add("postf", FragCode({ slot: "postf" }));
  }
}
