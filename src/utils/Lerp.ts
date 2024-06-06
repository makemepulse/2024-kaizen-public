/**
 * Linear interpolation between two numbers.
 * @param start
 * @param end
 * @param t
 * @returns
 */
export default function lerp(start: number, end: number, t: number): number {
  return start * (1 - t) + end * t;
}

/**
 * Linear interpolation between two angles in radians.
 * @param start
 * @param end
 * @param t
 * @returns
 */
export function lerpAngle(
  start: number,
  end: number,
  t: number
): number {
  const CS = (1 - t) * Math.cos(start) + t * Math.cos(end);
  const SN = (1 - t) * Math.sin(start) + t * Math.sin(end);
  return Math.atan2(SN, CS);
}
