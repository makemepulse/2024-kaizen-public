/* eslint-disable @typescript-eslint/no-explicit-any */
import { quat, vec3, vec4 } from "gl-matrix";
import type { InputParams } from "tweakpane";

export type Color = vec3|vec4

export interface Control<T = any> {
  value: T
  onChange( cb: (v:T)=>void ):this
  setLabel( s:string ): this
  setHint( s:string ): this
  remove():void
}

export interface Gui {
  
  add<O extends Record<string, any>, Key extends string>( tgt:O, prop:Key, opts?: InputParams ):Control<O[Key]>
  range<O extends Record<string, any>, Key extends string>( tgt:O, prop:Key, min:number, max:number, opts?: InputParams ):Control<O[Key]>
  monitor<O extends Record<string, any>, Key extends string>( tgt:O, prop:Key ):Control<O[Key]>
  addColor<O extends Record<string, any>, Key extends string>( tgt:O, prop:Key ):Control<Color>
  addRotation<O extends Record<string, any>, Key extends string>(tgt: O, prop: Key): Control<quat> 
  addSelect<O extends Record<string, any>, Key extends string>( tgt: O, prop: Key, options:Record<string, O[Key]> | O[Key][] ): Control<O[Key]>
  addRadios<O extends Record<string, any>, Key extends string>( tgt: O, prop: Key, options:Record<string, O[Key]> | O[Key][] ): Control<O[Key]>
  
  btn( name: string, fn:(name?:string)=>void ):Control<undefined>;
  btns( btns:Record<string, (name?:string)=>void>, label?:string ): void;
  select<T>( label: string, o: Record<string, T> | T[]/*, thumbnailResolver?: (v:T)=>string*/ ):Control<T>;
  radios<T>( label: string, o: Record<string, T> | T[]/*, thumbnailResolver?: (v:T)=>string*/ ):Control<T>;

  folder( name: string ): Gui;

  clearTarget( tgt:any ): void;
  clearFolder( name:string ): void;
  clear():void;

  open():this;
  close():this;
}