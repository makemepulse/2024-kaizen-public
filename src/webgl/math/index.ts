import { vec3 } from "gl-matrix";

const PI2 = Math.PI * 2.0;

export const DEG2RAD = Math.PI / 180.0;

export const RAD2DEG = 1.0 / DEG2RAD;

export function clamp01(n: number): number {
  return Math.min(1.0, Math.max(0.0, n));
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function sign(n: number): number {
  return n < 0.0 ? -1.0 : 1.0;
}

export function mix(a: number, b: number, m: number): number {
  return a * (1.0 - m) + b * m;
}

export function smoothstep(min: number, max: number, value: number) {
  const x = Math.max(0, Math.min(1, (value - min) / (max - min)));
  return x * x * (3 - 2 * x);
}

export function map(
  num: number,
  min1: number,
  max1: number,
  min2: number,
  max2: number
): number {
  const num1 = (num - min1) / (max1 - min1);
  const num2 = num1 * (max2 - min2) + min2;
  return num2;
}

export function mapUnit(p: number, s: number, e: number): number {
  const r = e - s;
  return clamp01(p / r - s / r);
}

export function randomFloat(minValue: number, maxValue: number): number {
  return Math.min(minValue + Math.random() * (maxValue - minValue), maxValue);
}

export function randomUnitVector(out: vec3) {
  const u = Math.random();
  const v = Math.random();
  const theta = 2 * Math.PI * u;
  const phi = Math.acos(2 * v - 1);
  out[0] = Math.sin(phi) * Math.cos(theta);
  out[1] = Math.sin(phi) * Math.sin(theta);
  out[2] = Math.cos(phi);
}

/**
 * Wrap an angle between 0 and 2*PI
 * @param a the angle to wrap
 * @returns
 */
export function normalizeAngle(a: number): number {
  while (a >= PI2) a -= PI2;
  while (a < 0.0) a += PI2;
  return a;
}

/**
 * Avoid 360 wrap around when update an angle. Usefull when angle value is smoothed
 * Eg : if angle is 350 and dest is 10, return 370 (this function use radians though)
 * @param angle the initial angle in radians
 * @param dest the destination angle in radians
 * @returns the destination angle, eventually modified to avoid 360 wrap around
 */
export function normalizeDeltaAngle(angle: number, dest: number): number {
  let d0 = dest - angle;
  const d1 = d0 - PI2;
  const d2 = d0 + PI2;

  if (Math.abs(d1) < Math.abs(d0)) {
    d0 = d1;
  }
  if (Math.abs(d2) < Math.abs(d0)) {
    d0 = d2;
  }

  return angle + d0;
}

export function mod(v: number, n: number): number {
  return ((v % n) + n) % n;
}
