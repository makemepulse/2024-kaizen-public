import GLArrayBuffer from 'nanogl/arraybuffer'
import GLIndexBuffer from 'nanogl/indexbuffer'
import Program from 'nanogl/program'
import Node from 'nanogl-node'

import mat4 from 'gl-matrix/src/gl-matrix/mat4'
import { GLContext } from 'nanogl/types'
import GLState, { LocalConfig } from 'nanogl-state/GLState'
import Camera from 'nanogl-camera'
import { HexColor, HexToTmpVec3 } from '@webgl/core/Color'

const M4 = mat4.create();


const FBUFF = new Float32Array([
  -1.0, 1.0, 1.0,
  -1.0, 1.0, -1.0,
  1.0, 1.0, -1.0,
  1.0, 1.0, 1.0,

  -1.0, -1.0, 1.0,
  -1.0, -1.0, -1.0,
  1.0, -1.0, -1.0,
  1.0, -1.0, 1.0,
])

const IDX = new Uint8Array([
  0, 1,
  1, 2,
  2, 3,
  3, 0,

  4, 5,
  5, 6,
  6, 7,
  7, 4,

  0, 4,
  1, 5,
  2, 6,
  3, 7
])



const VERT = `
attribute vec3 aPosition;
varying vec3 vColor;
uniform mat4 uMVP;
uniform mat4 uFrustumMat;
void main(void){
  vec4 wPos = uFrustumMat * vec4(aPosition, 1.0);
  wPos.xyz /= wPos.w;
  gl_Position = uMVP * vec4(wPos.xyz, 1.0);
}`


const FRAG = `
precision lowp float;
uniform vec3 uColor;
void main(void){
  gl_FragColor = vec4( uColor, 1.0 );
}`


export type FrustumRenderOptions = {
  projection: mat4
  color?: HexColor
}


export default class Frustum extends Node {

  projection: mat4
  buffer    : GLArrayBuffer
  indices   : GLIndexBuffer
  prg       : Program
  cfg       : LocalConfig



  

  constructor(private gl:GLContext) {

    super();

    this.gl = gl;
    this.buffer = new GLArrayBuffer(gl, FBUFF);
    this.buffer.attrib('aPosition', 3, gl.FLOAT);

    this.indices = new GLIndexBuffer(gl, gl.UNSIGNED_BYTE, IDX);

    this.prg = new Program(gl, VERT, FRAG);

    this.cfg = GLState.get(gl).config()
      .enableCullface(false)
      .enableDepthTest()
      .depthMask(true)
      .lineWidth(1);

  }


  render(camera : Camera, options: FrustumRenderOptions ): void {

    if (this.projection === null)
      return;

    this.prg.use()

    this.prg.uMVP(camera._viewProj);

    mat4.invert(M4, options.projection);
    this.prg.uFrustumMat(M4);

    
    this.prg.uColor(HexToTmpVec3(options.color ?? 0 ));

    this.buffer.attribPointer(this.prg)
    this.cfg.apply()
    this.indices.bind();
    this.indices.drawLines();

  }


}