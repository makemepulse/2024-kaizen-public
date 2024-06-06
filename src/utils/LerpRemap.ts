export default function lerpRemap(start : number, end: number, targetStart: number, targetEnd: number, value: number) {
  const t = (value - start) / (end - start);
  return targetStart + (targetEnd - targetStart) * t;
}
