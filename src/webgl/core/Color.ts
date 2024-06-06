import { vec3 } from "gl-matrix";

const V3 = vec3.create();

export type HexColor = number

/**
 * convert a color as int value to fixed float vec3
 * @param hex the int value (eg `0x801010`)
 * @param v3 the vec3 to set the color to
 * @returns return the given out vec3 for convenience
 */
export function HexToVec3( hex:HexColor, out:vec3 ):vec3{
  out[0] = ((hex >> 16) & 0xFF)/0xFF;
  out[1] = ((hex >> 8) & 0xFF)/0xFF;
  out[2] = ( hex & 0xFF )/0xFF;
  return out;
}

export function HexToTmpVec3( hex:HexColor ):vec3{
  return HexToVec3(hex, V3);
}

export function HexToNewVec3( hex:HexColor ):vec3{
  return HexToVec3( hex, vec3.create() );
}

export function Vec3ToHex( v3:vec3 ):HexColor {
  return  Math.round(v3[0] * 0xFF)<<16 |
          Math.round(v3[1] * 0xFF)<<8  |
          Math.round(v3[2] * 0xFF);
}





