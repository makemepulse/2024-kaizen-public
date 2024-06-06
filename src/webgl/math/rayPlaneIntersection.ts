import { vec3 } from "gl-matrix";
import Ray    from "./Ray";
import Plane  from "./Plane";

const V1 = vec3.create();

export default function rayPlaneIntersection( out:vec3, ray:Ray, plane:Plane ) : boolean {

  const denom = vec3.dot( plane.normal, ray.direction );

  if ( Math.abs( denom ) > 1e-6) { 

    vec3.sub( V1, plane.origin, ray.origin );
    const t = vec3.dot( V1, plane.normal ) / denom; 
    if( t < 0 ) return false;

    vec3.scaleAndAdd( out, ray.origin, ray.direction, t );

    return true;
  }

  return false;

}