import GLArrayBuffer from 'nanogl/arraybuffer'
import Program from 'nanogl/program'
import Node from 'nanogl-node'

import { GLContext } from 'nanogl/types'
import GLState, { LocalConfig } from 'nanogl-state/GLState'
import Camera from 'nanogl-camera'
import { mat4, vec3 } from 'gl-matrix'

const M4 = mat4.create();

const MAX_LINES = 2048
const FLOAT_PER_VERT = 4

const VERT = `
attribute vec3 aPosition;
attribute lowp vec4 aColor;
uniform mat4 uMVP;
varying lowp vec4 vColor;
void main(void){
  gl_Position = uMVP * vec4(aPosition, 1.0);
  vColor = aColor.bgra;
}`


const FRAG = `
precision lowp float;
varying vec4 vColor;
void main(void){
  gl_FragColor = vColor;
}`


//rabg

export default class Lines extends Node {

  buffer    : GLArrayBuffer
  prg       : Program
  cfg       : LocalConfig

  /**
   * current number of lines to draw in buffer
   */
  count = 0
  vertices: Float32Array
  colors: Uint32Array

  constructor(private gl:GLContext) {

    super();

    this.vertices = new Float32Array(MAX_LINES*2*FLOAT_PER_VERT)
    this.colors = new Uint32Array( this.vertices.buffer )
    this.buffer = new GLArrayBuffer(gl, this.vertices )
    this.buffer.attrib('aPosition', 3, gl.FLOAT)
    this.buffer.attrib('aColor', 4, gl.UNSIGNED_BYTE, true)

    this.prg = new Program(gl, VERT, FRAG);

    this.cfg = GLState.get(gl).config()
      .enableCullface(false)
      .enableDepthTest()
      .depthMask(true)
      .lineWidth(1);

  }

  reset(){
    this.count = 0
  }

  addLine( a:vec3, b:vec3, hexColor:number ):void {
    const c = this.count*FLOAT_PER_VERT*2
    this.vertices[c+0] = a[0]
    this.vertices[c+1] = a[1]
    this.vertices[c+2] = a[2]
    this.colors[c+3] = hexColor
    this.vertices[c+4] = b[0]
    this.vertices[c+5] = b[1]
    this.vertices[c+6] = b[2]
    this.colors[c+7] = hexColor
    this.count++;
  }


  render(camera : Camera ): void {
    if( this.count === 0 ) return

    this.buffer.subData( this.vertices.subarray(0, this.count*FLOAT_PER_VERT*2), 0 )

    this.prg.use()

    camera.modelViewProjectionMatrix(M4, this._wmatrix);

    this.prg.use()
    this.prg.uMVP(M4);

    this.buffer.attribPointer(this.prg)
    this.cfg.apply()
    this.buffer.drawLines(this.count*2);

    this.reset()

  }


}