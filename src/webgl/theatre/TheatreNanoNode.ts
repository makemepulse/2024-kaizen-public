import { ISheet, ISheetObject, types } from "@theatre/core";
import { quat, vec3 } from "gl-matrix";
import Node from "nanogl-node";

export default class TheatreNanoNode {

  private _obj: ISheetObject<any>;
  private _unsubscribe: VoidFunction;

  constructor(private n: Node, private sheet: ISheet, private name: string) {
    const obj = sheet.object(name, {
      position: types.compound({
        x: types.number(n.position[0]),
        y: types.number(n.position[1]),
        z: types.number(n.position[2]),
      }),
      rotation: types.compound({
        x: types.number(n.rotation[0]),
        y: types.number(n.rotation[1]),
        z: types.number(n.rotation[2]),
        w: types.number(n.rotation[3]),
      }),
      scale: types.compound({
        x: types.number(n.scale[0]),
        y: types.number(n.scale[1]),
        z: types.number(n.scale[2]),
      }),
    });

    this._unsubscribe = obj.onValuesChange(values => {
      const { x, y, z } = values.position;
      vec3.set(this.n.position, x, y, z);

      const { x: xs, y: ys, z: zs } = values.scale;
      vec3.set(this.n.scale, xs, ys, zs);

      const { x: xr, y: yr, z: zr, w: wr } = values.rotation;
      quat.set(this.n.rotation, xr, yr, zr, wr);

      this.n.invalidate();
      this.n.updateWorldMatrix();
    });

    this._obj = obj;
  }

  dispose() {
    this._unsubscribe();
    this.sheet.detachObject(this.name);
  }
}