import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input, { ShaderType, Uniform } from "nanogl-pbr/Input";

export default class AmbientAddChunk extends Chunk {
  ambientAdd: Input;
  ambientAddUniform: Uniform;

  constructor() {
    super(true, false);
    this.addChild(this.ambientAdd = new Input("ambientAdd", 1, ShaderType.FRAGMENT));

    this.ambientAddUniform = this.ambientAdd.attachUniform();
    this.ambientAddUniform.set(1);
  }

  protected _genCode(slots: ChunksSlots): void {

    slots.add("postlightsf", /*glsl*/`

      float ambientAdd = ambientAdd();
      vec3 ambient = vec3(0.);

      #if HAS_baseColor
        ambient += baseColor() * ambientAdd;
      #endif
      #if HAS_baseColorFactor
        ambient += baseColorFactor() * ambientAdd;
      #endif
      lightingData.lightingColor += ambient;
    `);
  }
}