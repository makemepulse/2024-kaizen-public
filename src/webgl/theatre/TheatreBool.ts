import { ISheet, ISheetObject, types } from "@theatre/core";

export default class TheatreBool {
  private _obj: ISheetObject<any>;
  private _unsubscribe: VoidFunction;

  constructor(initial = false, private update: (value: boolean) => void, private sheet: ISheet, private name: string) {
    const obj = sheet.object(name, {
      state: types.boolean(initial),
    });

    this._unsubscribe = obj.onValuesChange(values => {
      this.update(values.state);
    });

    this._obj = obj;
  }

  dispose() {
    this._unsubscribe();
    this.sheet.detachObject(this.name);
  }
}