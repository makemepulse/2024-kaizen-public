import { vec3 } from "gl-matrix";
import Ray from "./Ray";


const V1 = vec3.create();

export default function rayPointDistance( ray:Ray, point:vec3 ):number {
  vec3.sub( V1, point, ray.origin );
  vec3.cross( V1, ray.direction, V1 );
  return vec3.length( V1 );
}