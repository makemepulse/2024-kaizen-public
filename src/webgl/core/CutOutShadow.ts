import Chunk from "nanogl-pbr/Chunk";
import ChunksSlots from "nanogl-pbr/ChunksSlots";
import Input from "nanogl-pbr/Input";

export default class CutoutShadow extends Chunk {

  color: Input;
  threshold: Input;

  constructor() {
    super(true, false)

    // add 2 inputs for the effect parameters
    // as child of this chunk
    this.addChild(this.color = new Input('cs_color', 4))
    this.addChild(this.threshold = new Input('cs_threshold', 1))

    // initialize these input with constant values
    this.threshold.attachConstant(.5)

  }


  protected _genCode(slots: ChunksSlots): void {

    const discardCode = `
    if( cs_threshold() > cs_color().a ){
      discard;
    }`

    slots.add('f', discardCode);
  }
}