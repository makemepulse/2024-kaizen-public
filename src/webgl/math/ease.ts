
// no easing, no acceleration
export function linear (t:number):number { return t }

// accelerating from zero velocity
export function easeInQuad (t:number):number { return t*t }

// decelerating to zero velocity
export function easeOutQuad (t:number):number { return t*(2-t) }

// acceleration until halfway, then deceleration
export function easeInOutQuad (t:number):number { return t<.5 ? 2*t*t : -1+(4-2*t)*t }

// accelerating from zero velocity 
export function easeInCubic (t:number):number { return t*t*t }

// decelerating to zero velocity 
export function easeOutCubic (t:number):number { return (--t)*t*t+1 }

// acceleration until halfway, then deceleration 
export function easeInOutCubic (t:number):number { return t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1 }

// accelerating from zero velocity 
export function easeInQuart (t:number):number { return t*t*t*t }

// decelerating to zero velocity 
export function easeOutQuart (t:number):number { return 1-(--t)*t*t*t }

// acceleration until halfway, then deceleration
export function easeInOutQuart (t:number):number { return t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t }

// accelerating from zero velocity
export function easeInQuint (t:number):number { return t*t*t*t*t }

// decelerating to zero velocity
export function easeOutQuint (t:number):number { return 1+(--t)*t*t*t*t }

// acceleration until halfway, then deceleration 
export function easeInOutQuint (t:number):number { return t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t }


export function easeInExpo  (t:number):number { return Math.pow( 2, 10 * (t - 1) ); }


export function easeOutExpo  (t:number):number { return -Math.pow( 2, -10 * t ) + 1; }


export function easeInOutExpo  (t:number):number {
  t *= 2.0;
  return (t < 1.0) ? .5 * Math.pow( 2, 10 * (t - 1) ) : .5 * ( -Math.pow( 2, -10 * (--t)) + 2 );
}

const c1 = 1.70158;
const c2 = c1 * 1.525;
const c3 = c1 + 1;
const c4 = (2 * Math.PI) / 3;
const c5 = (2 * Math.PI) / 4.5;

export function easeInCirc(x: number) {
  return 1 - Math.sqrt(1 - Math.pow(x, 2));
}

export function easeOutCirc(x: number) {
  return Math.sqrt(1 - Math.pow(x - 1, 2));
}

export function easeInOutCirc(x: number) {
  return x < 0.5
    ? (1 - Math.sqrt(1 - Math.pow(2 * x, 2))) / 2
    : (Math.sqrt(1 - Math.pow(-2 * x + 2, 2)) + 1) / 2;
}

export function easeInBack(x: number) {
  return c3 * x * x * x - c1 * x * x;
}

export function easeOutBack(x: number) {
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

export function easeInOutBack(x: number) {
  return x < 0.5
    ? (Math.pow(2 * x, 2) * ((c2 + 1) * 2 * x - c2)) / 2
    : (Math.pow(2 * x - 2, 2) * ((c2 + 1) * (x * 2 - 2) + c2) + 2) / 2;
}

export function easeInElastic(x: number) {
  return x === 0
    ? 0
    : x === 1
    ? 1
    : -Math.pow(2, 10 * x - 10) * Math.sin((x * 10 - 10.75) * c4);
}

export function easeOutElastic(x: number) {
  return x === 0
    ? 0
    : x === 1
    ? 1
    : Math.pow(2, -10 * x) * Math.sin((x * 10 - 0.75) * c4) + 1;
}

export function easeInOutElastic(x: number) {
  return x === 0
    ? 0
    : x === 1
    ? 1
    : x < 0.5
    ? -(Math.pow(2, 20 * x - 10) * Math.sin((20 * x - 11.125) * c5)) / 2
    : (Math.pow(2, -20 * x + 10) * Math.sin((20 * x - 11.125) * c5)) / 2 + 1;
}


export function easeOutBounce(x: number): number {
	const n1 = 7.5625;
	const d1 = 2.75;

	if (x < 1 / d1) {
		return n1 * x * x;
	} else if (x < 2 / d1) {
		return n1 * (x -= 1.5 / d1) * x + 0.75;
	} else if (x < 2.5 / d1) {
		return n1 * (x -= 2.25 / d1) * x + 0.9375;
	} else {
		return n1 * (x -= 2.625 / d1) * x + 0.984375;
	}
}

export function easeInBounce(x: number) {
  return 1 - easeOutBounce(1 - x);
}

export function easeInOutBounce(x: number) {
  return x < 0.5
    ? (1 - easeOutBounce(1 - 2 * x)) / 2
    : (1 + easeOutBounce(2 * x - 1)) / 2;
}





