import { ISheet, ISheetObject, types } from "@theatre/core";
import { vec4 } from "gl-matrix";

export default class TheatreVec4 {

  private _obj: ISheetObject<any>;
  private _unsubscribe: VoidFunction;

  constructor(
    private v: vec4, private sheet: ISheet, private name: string,
    private vecName = "position",
    private props: [string, string, string, string] = ["x", "y", "z", "w"]
  ) {
    const obj = sheet.object(name, {
      [vecName]: types.compound({
        [props[0]]: types.number(v[0]),
        [props[1]]: types.number(v[1]),
        [props[2]]: types.number(v[2]),
        [props[3]]: types.number(v[3]),
      }),
    });

    this._unsubscribe = obj.onValuesChange(values => {
      const val = values[this.vecName];
      vec4.set(
        this.v,
        val[this.props[0]],
        val[this.props[1]],
        val[this.props[2]],
        val[this.props[3]]
      );
    });

    this._obj = obj;
  }

  dispose() {
    this._unsubscribe();
    this.sheet.detachObject(this.name);
  }
}