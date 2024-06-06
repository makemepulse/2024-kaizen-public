import { ISheet, ISheetObject, types } from "@theatre/core";
import { vec3, vec4 } from "gl-matrix";

export default class TheatreRgb {

  private _obj: ISheetObject<any>;
  private _unsubscribe: VoidFunction;

  get rgb() {
    return this.v;
  }

  constructor(private v: vec3, private sheet: ISheet, private name: string) {
    const obj = sheet.object(name, {
      position: types.rgba({
        r: v[0],
        g: v[1],
        b: v[2],
        a: 1,
      }),
    });

    this._unsubscribe = obj.onValuesChange(values => {
      const { r, g, b } = values.position;
      vec3.set(this.v, r, g, b );
    });

    this._obj = obj;
  }

  dispose() {
    this._unsubscribe();
    this.sheet.detachObject(this.name);
  }
}