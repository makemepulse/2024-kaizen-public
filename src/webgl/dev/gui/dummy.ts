/* eslint-disable @typescript-eslint/no-explicit-any */

import { quat } from "gl-matrix";
import { Color, Control, Gui } from "./api";



class DummyControl<T> implements Control<T>{

  constructor( private _value: T){}
  
  valueOf(): T {
    return this._value
  }
  
  get value(): T {
    return this._value
  }
  
  onChange(): this {0;return this;}
  setLabel(s: string): this {s; return this;}
  setHint(s: string): this {s; return this;}
  remove(): void {0;}

}


function _factory(){

  const gui : Gui = {
    add<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<O[Key]> {
      return new DummyControl(tgt[prop]);
    },

    range<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<O[Key]> {
      return new DummyControl(tgt[prop]);
    },
  
    monitor<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<O[Key]> {
      return new DummyControl(tgt[prop]);
    },
    
    addColor<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<Color> {
      return new DummyControl(tgt[prop]);
    },

    addRotation<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<quat>  {
      return new DummyControl(tgt[prop]);
    },
    
    addSelect<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<O[Key]> {
      return new DummyControl(tgt[prop]);
    },

    addRadios<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<O[Key]> {
      return new DummyControl(tgt[prop]);
    },

    
    folder(): Gui {
      return gui;
    },
    
    btns(): void {0},
    clear() {0},
    clearTarget(): void {0},
    clearFolder(): void {0},
    open():Gui {return this},
    close():Gui {return this},
    
    btn():Control<undefined> {
      return new DummyControl(null);
    },
    select: function <T>(): Control<T> {
      return new DummyControl(null);
    },
    radios: function <T>(): Control<T> {
      return new DummyControl(null);
    },


    
  }

  return gui
  
}


const gui = _factory()
export default gui