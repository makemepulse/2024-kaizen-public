import { ISheet, ISheetObject, types } from "@theatre/core";
import { vec3 } from "gl-matrix";

export default class TheatreVec3 {

  private _obj: ISheetObject<any>;
  private _unsubscribe: VoidFunction;

  constructor(private v: vec3, private sheet: ISheet, private name: string) {
    const obj = sheet.object(name, {
      position: types.compound({
        x: types.number(v[0]),
        y: types.number(v[1]),
        z: types.number(v[2]),
      }),
    });

    this._unsubscribe = obj.onValuesChange(values => {
      const { x, y, z } = values.position;
      vec3.set(this.v, x, y, z);
    });

    this._obj = obj;
  }

  dispose() {
    this._unsubscribe();
    this.sheet.detachObject(this.name);
  }
}