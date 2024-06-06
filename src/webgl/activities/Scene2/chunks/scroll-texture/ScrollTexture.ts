import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { Sampler, ShaderType } from "nanogl-pbr/Input";

import Material from "nanogl-pbr/Material";
import { StandardPass } from "nanogl-pbr/StandardPass";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";
import { StaticTexCoord } from "nanogl-pbr/TexCoord";

export default class ScrollTexture extends Chunk {
  time: Input
  frameRate: Input
  offset: Input

  transformedCode: string

  constructor(material: Material) {
    super(true, false);

    this.addChild(
      (this.time = new Input("uTime", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.frameRate = new Input("uFrameRate", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.offset = new Input("uOffset", 2, ShaderType.FRAGMENT))
    );

    this.transformedCode = (((material.getPass("color").pass as StandardPass<MetalnessSurface>).surface.baseColor.param as Sampler).texCoords as StaticTexCoord).getTransformCode();
    this.transformedCode = this.transformedCode.split(" ")[0];
    this.transformedCode = `
    VAL_tex_basecolor${this.transformedCode} = texture2D(tex_basecolor, ${this.transformedCode} + uOffset() * floor(uTime() * uFrameRate()));
    VAL_tex_basecolor${this.transformedCode}.rgb = VAL_tex_basecolor${this.transformedCode}.rgb*VAL_tex_basecolor${this.transformedCode}.rgb;
    `;

    this.time.attachConstant(0);
    this.frameRate.attachConstant(4);
    this.offset.attachConstant([0, .01]);
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("f", this.transformedCode);
  }
}
