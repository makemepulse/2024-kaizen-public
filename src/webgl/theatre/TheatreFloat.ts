import { ISheet, ISheetObject, types } from "@theatre/core";

export default class TheatreFloat {

  private _obj: ISheetObject<{
    x: number;
}>;
  private _unsubscribe: VoidFunction;

  get value() {
    return this.number.value;
  }

  constructor(private number: { value: number }, private sheet: ISheet, private name: string) {
    const obj = sheet.object(name, {
      x: types.number(number.value)
    });

    this._unsubscribe = obj.onValuesChange(value => {
      this.number.value = value.x;
    });

    this._obj = obj;
  }

  dispose() {
    this._unsubscribe();
    this.sheet.detachObject(this.name);
  }
}