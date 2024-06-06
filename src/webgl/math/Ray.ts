import { vec3, mat4 } from "gl-matrix"
import Camera from 'nanogl-camera'

const V1   = vec3.create()
const IMVP = mat4.create()

export default class Ray {

  readonly origin    = vec3.create()
  readonly direction = vec3.create()
  
  unproject( coords:ArrayLike<number>, cam : Camera ){
    mat4.invert( IMVP, cam._viewProj );
    
    V1[0] = coords[0];
    V1[1] = coords[1];
    
    V1[2] = -1
    vec3.transformMat4( this.origin, V1, IMVP );
    
    V1[2] = 1
    vec3.transformMat4( this.direction, V1, IMVP );
    
    vec3.subtract( this.direction, this.direction, this.origin );
    vec3.normalize( this.direction, this.direction );
  }
  
}

