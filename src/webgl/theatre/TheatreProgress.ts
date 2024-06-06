import { ISheet, ISheetObject, types } from "@theatre/core";

export default class TheatreProgress {
  private _obj: ISheetObject<any>;
  private _unsubscribe: VoidFunction;

  public value: number;

  constructor(
    initial = 0, private update: (val: number) => void, private sheet: ISheet,
    private name: string
  ) {
    const obj = sheet.object(name, {
      progress: types.number(initial),
    });

    this._unsubscribe = obj.onValuesChange(values => {
      this.value = values.progress;
      this.update(this.value);
    });

    this._obj = obj;
  }

  dispose() {
    this._unsubscribe();
    this.sheet.detachObject(this.name);
  }
}