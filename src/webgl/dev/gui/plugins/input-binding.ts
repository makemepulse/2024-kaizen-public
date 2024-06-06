import { BindingTarget, CompositeConstraint, Constraint, createNumberFormatter, createRangeConstraint, findConstraint, Formatter, getBaseStep, getSuitableDecimalDigits, getSuitableDraggingScale, InputBindingPlugin, ListParamsOptions, NumberInputParams, NumberTextController, ParamsParser, ParamsParsers, parseListOptions, parseNumber, parseParams, RangeConstraint, SliderTextController, ValueMap } from "@tweakpane/core";
import Input, { Constant, Uniform } from "nanogl-pbr/Input";


export function numberFromInput(value: unknown): number {
  console.log("AAAAAAAAAA", value);
  
  if (value instanceof Input ) {
    const param = value.param
    
    if( param instanceof Constant ) {
      return param.value as number
    }
    
    if( param instanceof Uniform ) {
      return param.value[0]
    }
    
  }

	return 0;
}


function createConstraint(
	params: NumberInputParams,
): Constraint<number> {
	const constraints: Constraint<number>[] = [];

	const rc = createRangeConstraint(params);
	if (rc) {
		constraints.push(rc);
	}

	return new CompositeConstraint(constraints);
}

function findRange(
	constraint: Constraint<number>,
): [number | undefined, number | undefined] {
	const c = constraint ? findConstraint(constraint, RangeConstraint) : null;
	if (!c) {
		return [undefined, undefined];
	}

	return [c.minValue, c.maxValue];
}

function estimateSuitableRange(
	constraint: Constraint<number>,
): [number, number] {
	const [min, max] = findRange(constraint);
	return [min ?? 0, max ?? 100];
}

function writeInput(
	target: BindingTarget,
	value: number,
): void {
	const input = target.read() as Input
  const param = input.param
  if( !(param instanceof Uniform) ) {
    input.attachUniform().set(value)
  } else {
    param.set(value)
  }
}


export const InputChunkPlugin: InputBindingPlugin<
  number,
  Input,
  NumberInputParams
> = {

  id: 'input-number',
  
  type: 'input',
  
  accept: (value, params) => {
    if (! (value instanceof Input )) {
      return null;
    }
    
    if( value.size !== 1 ) {
      return null;
    }


    const p = ParamsParsers;
    const result = parseParams<NumberInputParams>(params, {
      format: p.optional.function as ParamsParser<Formatter<number>>,
      max: p.optional.number,
      min: p.optional.number,
      options: p.optional.custom<ListParamsOptions<number>>(parseListOptions),
      step: p.optional.number,
    });
    return result
      ? {
        initialValue: value,
        params: result,
      }
      : null;
  },

  binding: {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    reader: (_args) => numberFromInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    writer: (_args) => writeInput,

    constraint: (args) => createConstraint(args.params),
  },

  controller: (args) => {
    const value = args.value;
    const c = args.constraint;


    const formatter =
      ('format' in args.params ? args.params.format : undefined) ??
      createNumberFormatter(getSuitableDecimalDigits(c, value.rawValue));

    if (c && findConstraint(c, RangeConstraint)) {
      const [min, max] = estimateSuitableRange(c);
      return new SliderTextController(args.document, {
        baseStep: getBaseStep(c),
        parser: parseNumber,
        sliderProps: ValueMap.fromObject({
          maxValue: max,
          minValue: min,
        }),
        textProps: ValueMap.fromObject({
          draggingScale: getSuitableDraggingScale(c, value.rawValue),
          formatter: formatter,
        }),
        value: value,
        viewProps: args.viewProps,
      });
    }

    return new NumberTextController(args.document, {
      baseStep: getBaseStep(c),
      parser: parseNumber,
      props: ValueMap.fromObject({
        draggingScale: getSuitableDraggingScale(c, value.rawValue),
        formatter: formatter,
      }),
      value: value,
      viewProps: args.viewProps,
    });
  },
};
