/* eslint-disable @typescript-eslint/no-explicit-any */
import { Color, InputBindingPlugin, ColorController, BindingTarget, createColorStringParser } from "@tweakpane/core";
import { BindingWriter } from "@tweakpane/core/dist/cjs/common/binding/binding";
import { ColorComponents3, ColorComponents4 } from "@tweakpane/core/dist/cjs/input-binding/color/model/color-model";
import { parseColorInputParams } from "@tweakpane/core/dist/cjs/input-binding/color/util";
import { ColorInputParams } from "tweakpane";


function shouldSupportAlpha(
  initialValue: Float32Array,
): boolean {
  return initialValue.length === 4;
}



function writeRgbaColorObject(target: BindingTarget, value: Color): void {
  const obj = value.toRgbaObject();
  target.writeProperty('0', obj.r/255.0);
  target.writeProperty('1', obj.g/255.0);
  target.writeProperty('2', obj.b/255.0);
  target.writeProperty('3', obj.a);
}

function writeRgbColorObject(target: BindingTarget, value: Color): void {
  const obj = value.toRgbaObject();
  target.writeProperty('0', obj.r/255.0);
  target.writeProperty('1', obj.g/255.0);
  target.writeProperty('2', obj.b/255.0);
}

function isVecColor(v: any): v is Float32Array {
  return (v.constructor === Float32Array && (v.length === 3 || v.length === 4))
}


function createColorObjectWriter(
  supportsAlpha: boolean,
): BindingWriter<Color> {
  return supportsAlpha ? writeRgbaColorObject : writeRgbColorObject;
}

function colorFromVec(v: unknown): Color {
  
  if(!isVecColor(v)){
    if( Color.isColorObject(v) ){
      return Color.fromObject(v)
    }
    return Color.black()
    // return new Color([0, 1, 0], 'rgb');
  }

  const comps:ColorComponents3 | ColorComponents4 = v.length===4 ? [v[0]*255.0, v[1]*255.0, v[2]*255.0, v[3]] : [v[0]*255.0, v[1]*255.0, v[2]*255.0];
  
  return new Color(comps, 'rgb');
}


function fixComp(n:number):string{
  return (n/255.0).toPrecision(4)
}

function colorToVecRgbaString( c:Color, prefix = '' ):string{
  const rgbaComps = c.getComponents('rgb');
  return `${prefix}[${fixComp(rgbaComps[0])}, ${fixComp(rgbaComps[1])}, ${fixComp(rgbaComps[2])}, ${rgbaComps[3].toPrecision(4 )} ]`
}

function colorToVecRgbString( c:Color, prefix = '' ):string{
  const rgbaComps = c.getComponents('rgb');
  return `${prefix}[${fixComp(rgbaComps[0])}, ${fixComp(rgbaComps[1])}, ${fixComp(rgbaComps[2])}]`
}

/**
 * @hidden
 */
export const VecColorInputPlugin: InputBindingPlugin<
  Color,
  Float32Array,
  ColorInputParams
> = {
  id: 'input-color-object',
  type: 'input',
  accept: (value, params) => {
    if (!isVecColor(value)) {
      return null;
    }
    const result = parseColorInputParams(params);
    return result
      ? {
        initialValue: value,
        params: result,
      }
      : null;
  },
  binding: {
    reader: () => colorFromVec,
    equals: Color.equals,
    writer: (args) =>
      createColorObjectWriter(shouldSupportAlpha(args.initialValue)),
  },
  controller: (args) => {
    const supportsAlpha = shouldSupportAlpha(args.initialValue);
    const expanded =
      'expanded' in args.params ? args.params.expanded : undefined;
    const picker = 'picker' in args.params ? args.params.picker : undefined;
    const formatter = supportsAlpha
      ? colorToVecRgbaString
      : colorToVecRgbString;
    return new ColorController(args.document, {
      colorType: 'float',
      expanded: expanded ?? false,
      formatter: formatter,
      parser: createColorStringParser('float'),
      pickerLayout: picker ?? 'popup',
      supportsAlpha: supportsAlpha,
      value: args.value,
      viewProps: args.viewProps,
    });
  },
};