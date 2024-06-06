import Camera from "nanogl-camera";
import { ISheet, ISheetObject, types } from "@theatre/core";
import PerspectiveLens from "nanogl-camera/perspective-lens";

export default class TheatreCameraFov {

  private _obj: ISheetObject<any>;
  private _unsubscribe: VoidFunction;

  constructor(private cam: Camera, private sheet: ISheet, private name: string) {
    const obj = sheet.object(name, {
      fov: types.number((cam.lens as PerspectiveLens).fov, { range: [0.1, Math.PI] }),
    });

    this._unsubscribe = obj.onValuesChange(values => {
      const { fov } = values;
      (cam.lens as PerspectiveLens).setHorizontalFov(fov);

      this.cam.invalidate();
      this.cam.updateWorldMatrix();
    });

    this._obj = obj;
  }

  dispose() {
    this._unsubscribe();
    this.sheet.detachObject(this.name);
  }
}