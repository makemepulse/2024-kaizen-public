import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Flag from "nanogl-pbr/Flag";
import Input, { Uniform } from "nanogl-pbr/Input";
import Program from "nanogl/program";
import Texture2D from "nanogl/texture-2d";
import ScreenSize from "../ScreenSize";
import FragCode from "./code.frag"
import FragPreCode from "./pre-code.frag"
import Time from "@webgl/Time";


export default class FloorReflectionChunk extends Chunk {

  static enabled: Flag = new Flag('enableFReflect', true);

  reflectionTexture: Texture2D = null

  strength: Input
  time: Input
  timeU: Uniform

  constructor() {
    super(true, true)
    this.addChild(FloorReflectionChunk.enabled);
    this.addChild(ScreenSize.input);

    this.addChild(this.strength = new Input("ReflectionStrength", 1));
    this.addChild(this.time = new Input("uTime", 1));
    this.strength.attachConstant(1.8),
      this.timeU = this.time.attachUniform();
    this.timeU.set(0)
  }

  protected _genCode(slots: ChunksSlots): void {
    slots.add('postlightsf', FragCode())
    slots.add('pf', FragPreCode())
  }


  setup(prg: Program): void {
    if (this.reflectionTexture === null) throw 'missing reflection texture'
    prg.tFloorReflect(this.reflectionTexture);
    this.timeU.set(Time.scaledTime * 0.0001)
  }
}
