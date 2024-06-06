import CreateShader from "@webgl/core/CreateProgram";
import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Flag from "nanogl-pbr/Flag";
import Input, { ShaderType } from "nanogl-pbr/Input";
import TexCoord from "nanogl-pbr/TexCoord";
import FragModule from "./fresnel.frag";

const FragCode = CreateShader(FragModule);

export default class Fresnel extends Chunk {

  color: Input;

  // Params :
  // x -> power
  // y -> intensity
  // z -> bias
  params: Input;
  intensity: Input;
  fadeUV: Flag;
  uvs: Input;

  constructor() {

    super(true, false);
    this.addChild(this.color = new Input("FresnelColor", 3, ShaderType.FRAGMENT));
    this.addChild(this.params = new Input("FresnelParams", 3, ShaderType.FRAGMENT));
    this.addChild(this.intensity = new Input("FresnelIntensity", 1, ShaderType.FRAGMENT));
    this.addChild(this.fadeUV = new Flag("FresnelFadeUV", false));
    this.addChild( this.uvs = new Input("vTexCoord", 2, ShaderType.FRAGMENT));

    FragCode.onHmr(()=>this.invalidateCode());

  }

  setFadeUV(fade: boolean): void {
    this.fadeUV.set(fade);
    if(fade){
      this.uvs.attachAttribute(TexCoord.create("aTexCoord0").attrib);
    }
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add("postf"    , FragCode({slot:"postf"    }));
    slots.add("prelightsf"    , FragCode({slot:"prelightsf"    }));
  }

}