import CreateShader from "@webgl/core/CreateProgram";
import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { Sampler, ShaderType } from "nanogl-pbr/Input";

import VertModule from "./water-surface.vert";
import FragModule from "./water-surface.frag";
import Material from "nanogl-pbr/Material";
import { StandardPass } from "nanogl-pbr/StandardPass";
import { MetalnessSurface } from "nanogl-pbr/PbrSurface";
import { StaticTexCoord } from "nanogl-pbr/TexCoord";
import Program from "nanogl/program";

const VertCode = CreateShader(VertModule);
const FragCode = CreateShader(FragModule);

export default class WaterSurface extends Chunk {
  // pondCenter: Input
  waterColor: Input
  time: Input
  noise: Input

  transformedCode: string

  constructor(material: Material) {
    super(true, true);

    // this.addChild(
    //   (this.pondCenter = new Input("uPondCenter", 3, ShaderType.FRAGMENT))
    // );
    this.addChild(
      (this.waterColor = new Input("uWaterColor", 3, ShaderType.FRAGMENT))
    );
    this.addChild(
      (this.time = new Input("uSurfaceTime", 1, ShaderType.ALL))
    );
    // this.addChild(
    //   (this.noise = new Input("noise", 4, ShaderType.FRAGMENT))
    // );

    // this.transformedCode = (((material.getPass("color").pass as StandardPass<MetalnessSurface>).surface.baseColor.param as Sampler).texCoords as StaticTexCoord).getTransformCode();
    // this.transformedCode = this.transformedCode.split(" ")[0];
    // this.transformedCode = `
    // VAL_tex_basecolor${this.transformedCode} = texture2D(tex_basecolor, ${this.transformedCode});
    // VAL_tex_basecolor${this.transformedCode}.rgb = VAL_tex_basecolor${this.transformedCode}.rgb*VAL_tex_basecolor${this.transformedCode}.rgb;
    // `;

    // this.pondCenter.attachConstant([0, 0, 0]);
    // this.waterColor.attachConstant([0, 1, 0]);
    // this.time.attachConstant(0);

    VertCode.onHmr(() => this.invalidateCode());
    FragCode.onHmr(() => this.invalidateCode());
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("pv", VertCode({ slot: "pv" }));
    slots.add("vertex_warp_world", VertCode({ slot: "vertex_warp_world" }));
    slots.add("postv", VertCode({ slot: "postv" }));
    slots.add("pf", FragCode({ slot: "pf" }));
    slots.add("f", FragCode({ slot: "f" }));
    // slots.add("f", this.transformedCode);
    slots.add("postf", FragCode({ slot: "postf" }));
  }

  setup(prg: Program) {
    super.setup(prg)
    if (!prg.UuPondCenter) prg.UuPondCenter = () => { }
  }
}
