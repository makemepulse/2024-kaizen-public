import CreateShader from "@webgl/core/CreateProgram";
import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { Sampler, ShaderType } from "nanogl-pbr/Input";

import VertModule from "./lily-foam.vert";
import FragModule from "./lily-foam.frag";
import Material from "nanogl-pbr/Material";
import { StandardPass } from "nanogl-pbr/StandardPass";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";
import { StaticTexCoord } from "nanogl-pbr/TexCoord";

const VertCode = CreateShader(VertModule);
const FragCode = CreateShader(FragModule);

export default class LilyFoam extends Chunk {
  alphaThreshold: Input
  opacity: Input
  time: Input
  noise: Input
  color: Input
  viewFoam: Input

  transformedCode: string

  constructor(material: Material) {
    super(true, false);

    this.addChild(
      (this.alphaThreshold = new Input("uAlphaThreshold", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.opacity = new Input("uFoamOpacity", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.time = new Input("uTime", 1, ShaderType.ALL))
    );
    this.addChild(
      (this.noise = new Input("noise", 4, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.viewFoam = new Input("uViewFoam", 1, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.color = new Input("uColor", 3, ShaderType.FRAGMENT))
    );

    this.transformedCode = (((material.getPass("color").pass as StandardPass<MetalnessSurface>).surface.baseColor.param as Sampler).texCoords as StaticTexCoord).getTransformCode();
    this.transformedCode = this.transformedCode.split(" ")[0];
    this.transformedCode = `vec4 tex = texture2D(tex_basecolor, ${this.transformedCode});`;

    this.alphaThreshold.attachConstant(0.5);
    this.opacity.attachConstant(1);
    this.time.attachConstant(0);
    this.color.attachConstant([0, 1, 0]);

    VertCode.onHmr(() => this.invalidateCode());
    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pv", VertCode({ slot: "pv" }));
    slots.add("postv", VertCode({ slot: "postv" }));
    slots.add("pf", FragCode({ slot: "pf" }));
    slots.add("f", FragCode({ slot: "f" }));
    slots.add("postf", this.transformedCode);
    slots.add("postf", FragCode({ slot: "postf" }));
  }
}
