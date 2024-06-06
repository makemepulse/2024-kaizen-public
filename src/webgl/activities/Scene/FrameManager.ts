import { vec4 } from "gl-matrix";
import { ISheet } from "@theatre/core";

import Frame from "@webgl/glsl/frame";
import TheatreVec4 from "@webgl/theatre/TheatreVec4";

export default class FrameManager {
  borderWidthSuccess: TheatreVec4[];

  constructor(private frame: Frame, private sheetSuccess: ISheet) {
    frame.noiseOffset.set([Math.random(), Math.random()]);
  }

  start() {
    this.borderWidthSuccess = this.frame.borderWidth.map((borderWidth: vec4, i: number) => {
      return new TheatreVec4(
        borderWidth,
        this.sheetSuccess,
        `Frame / Frame ${i + 1}`,
        "borderWidth",
        ["top", "bottom", "left", "right"]
      );
    });
  }

  stop() {
    for (const borderWidthSuccess of this.borderWidthSuccess) {
      borderWidthSuccess.dispose();
    }
  }
}