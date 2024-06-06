
let dt = 1 / 60;
let time = -1;
let scaledDt = 1 / 60;
let scaledTime = 0;
let stableDt = 1;
let stableDtTotal = 60;
let countDt = 0;
export const targetFps = 60;

const timeScale = 1;

/**
 * Limit frame dt
 * @param dt 
 * @returns 
 */
function clampDt(dt: number): number {
  if (dt > 1000 / 5 || dt < 1000 / 180) {
    dt = 1000 / 60;
  }
  return dt;
}

/**
 * TODO: not static , create an instance in renderer instead
 */
const Time = {

  get dt(): number {
    return dt;
  },

  get time(): number {
    return time;
  },

  get scaledDt(): number {
    return scaledDt;
  },

  get scaledTime(): number {
    return scaledTime;
  },

  set timeScale(v: number) {
    this.timeScale = v;
  },

  get timeScale() {
    return timeScale;
  },

  get stableDt() {
    return stableDt;
  },

  enterFrame(): void {
    const now = performance.now();
    const delta = now - time;

    if (time > 0) dt = clampDt(delta);

    time = now;

    scaledDt = dt * timeScale;

    stableDtTotal += scaledDt / (1000 / targetFps);
    countDt++;
    if (countDt > 60) {
      stableDt = stableDtTotal / countDt;
      countDt = 0;
      stableDtTotal = 0;
    }
    scaledTime += scaledDt;
  }

};

export default Time;
