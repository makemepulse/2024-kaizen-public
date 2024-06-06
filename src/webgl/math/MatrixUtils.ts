
import { mat3, vec3, quat, mat4 } from "gl-matrix";


/**
 * Extract translation, rotation and scale from the given matrix
 */
function decompose(m4: mat4, p: vec3, q: quat, s: vec3) {

  p[0] = m4[12];
  p[1] = m4[13];
  p[2] = m4[14];

  s[0] = Math.sqrt(m4[0] * m4[0] + m4[1] * m4[1] + m4[2] * m4[2]);
  s[1] = Math.sqrt(m4[4] * m4[4] + m4[5] * m4[5] + m4[6] * m4[6]);
  s[2] = Math.sqrt(m4[8] * m4[8] + m4[9] * m4[9] + m4[10] * m4[10]);

  M3[0] = m4[0] / s[0];
  M3[1] = m4[1] / s[0];
  M3[2] = m4[2] / s[0];

  M3[3] = m4[4] / s[1];
  M3[4] = m4[5] / s[1];
  M3[5] = m4[6] / s[1];

  M3[6] = m4[8] / s[2];
  M3[7] = m4[9] / s[2];
  M3[8] = m4[10] / s[2];

  quat.fromMat3(q, M3);

}

/**
 * Copy X Vector of the given matrix to out vector
 */
function getXaxis(out: vec3, m: mat4): vec3 {
  out[0] = m[0]
  out[1] = m[1]
  out[2] = m[2]
  return out
}

/**
 * Copy Y Vector of the given matrix to out vector
 */
function getYaxis(out: vec3, m: mat4): vec3 {
  out[0] = m[4]
  out[1] = m[5]
  out[2] = m[6]
  return out
}

/**
 * Copy Z Vector of the given matrix to out vector
 */
function getZaxis(out: vec3, m: mat4): vec3 {
  out[0] = m[8]
  out[1] = m[9]
  out[2] = m[10]
  return out
}

/**
 * Copy Z Vector of the given matrix to out vector
 */
function getOrigin(out: vec3, m: mat4): vec3 {
  out[0] = m[12]
  out[1] = m[13]
  out[2] = m[14]
  return out
}


const P1   = vec3.create();
const R1   = quat.create();
const S1   = vec3.create();

const P2   = vec3.create();
const R2   = quat.create();
const S2   = vec3.create();

/**
 * Lerp two matrices
 */
function mat4Lerp(out: mat4, m1: mat4, m2: mat4, p: number): void {
  
  decompose(m1, P1, R1, S1);
  decompose(m2, P2, R2, S2);
  
  vec3.lerp(P1, P1, P2, p);
  vec3.lerp(S1, S1, S2, p);
  quat.slerp(R1, R1, R2, p);
  
  mat4.fromRotationTranslationScale(out, R1, P1, S1);
  
}


const M4 = mat4.create();

const M4XAxis  = new Float32Array( M4.buffer,  0*4, 3 ) as vec3;
const M4YAxis  = new Float32Array( M4.buffer,  4*4, 3 ) as vec3;
const M4ZAxis  = new Float32Array( M4.buffer,  8*4, 3 ) as vec3;
const M4POS    = new Float32Array( M4.buffer, 12*4, 3 ) as vec3;

const YUP    = vec3.fromValues( 0, 1, 0 )


function mat4LookAt( out:mat4, pos:vec3, tgt:vec3, up : vec3 = YUP ){
  vec3.subtract( M4ZAxis, pos, tgt );
  vec3.cross( M4XAxis, up, M4ZAxis );
  vec3.cross( M4YAxis, M4ZAxis, M4XAxis );
  vec3.normalize( M4XAxis, M4XAxis );
  vec3.normalize( M4YAxis, M4YAxis );
  vec3.normalize( M4ZAxis, M4ZAxis );

  M4POS.set( pos );
  out.set( M4 );

}

/**
 * Normalize scale of the given matrix
 */
function mat4Unscale( out:mat4, m:mat4 ){
  M4.set( m );
  vec3.normalize( M4XAxis, M4XAxis );
  vec3.normalize( M4YAxis, M4YAxis );
  vec3.normalize( M4ZAxis, M4ZAxis );
  out.set( M4 );
}


const M3 = mat3.create();
const M3XAxis = new Float32Array( M3.buffer, 0*4, 3 ) as vec3;
const M3YAxis = new Float32Array( M3.buffer, 3*4, 3 ) as vec3;
const M3ZAxis = new Float32Array( M3.buffer, 6*4, 3 ) as vec3;


function mat3Lookat( mat3 : mat3, dir : vec3 ):void {
  vec3.normalize( M3ZAxis, dir );
  vec3.cross( M3XAxis, YUP, M3ZAxis );
  vec3.normalize( M3XAxis, M3XAxis );
  vec3.cross( M3YAxis, M3ZAxis, M3XAxis );
  mat3.set( M3 );
}


const MatrixUtils = {
  decompose,
  getXaxis,
  getYaxis,
  getZaxis,
  getOrigin,
  mat4Lerp,
  mat4LookAt,
  mat4Unscale,
  mat3Lookat,
}

export default MatrixUtils;