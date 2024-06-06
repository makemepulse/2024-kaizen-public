import GLArrayBuffer from 'nanogl/arraybuffer'
import Program from 'nanogl/program'
import Node from 'nanogl-node'

import { GLContext } from 'nanogl/types'
import GLState, { LocalConfig } from 'nanogl-state/GLState'
import Camera from 'nanogl-camera'
import { mat4, vec3 } from 'gl-matrix'
import Texture2D from 'nanogl/texture-2d'

const M4 = mat4.create();

const POINT_SIZE = 8.0
const MAX_POINTS = 2048
const FLOAT_PER_VERT = 3

const VERT = `
attribute vec3 aPosition;
uniform mat4 uMVP;
void main(void){
  gl_Position = uMVP * vec4(aPosition, 1.0);
  gl_PointSize = float(${POINT_SIZE});
}`


const FRAG = `
precision lowp float;
uniform sampler2D tTex;
void main(void){
  gl_FragColor = texture2D(tTex, gl_PointCoord);
}`

/**
 * create a 8x8 canvas and draw a white circle with  black border
 */
function getPointTexture(): TexImageSource {
  const ps = POINT_SIZE/2
  const cvs = document.createElement('canvas')
  cvs.width = ps*2
  cvs.height = ps*2
  const ctx = cvs.getContext('2d')
  ctx.fillStyle = 'white'
  ctx.beginPath()
  ctx.arc(ps, ps, ps-1, 0, Math.PI * 2)
  ctx.fill()
  ctx.strokeStyle = 'black'
  ctx.lineWidth = 1
  ctx.stroke()
  return cvs
}

export default class Points extends Node {

  buffer    : GLArrayBuffer
  prg       : Program
  cfg       : LocalConfig
  tex       : Texture2D

  /**
   * current number of points to draw in buffer
   */
  count = 0
  vertices: Float32Array
  colors: Uint32Array

  constructor(private gl:GLContext) {

    super();

    this.vertices = new Float32Array(MAX_POINTS*FLOAT_PER_VERT)
    this.buffer = new GLArrayBuffer(gl, this.vertices )
    this.buffer.attrib('aPosition', 3, gl.FLOAT)

    this.prg = new Program(gl, VERT, FRAG);

    this.cfg = GLState.get(gl).config()
      .enableBlend()
      .blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
      // .enableDepthTest()
      // .depthMask(true)

    this.tex = new Texture2D(gl, gl.RGBA)
    this.tex.fromImage( getPointTexture() )

  }

  reset(){
    this.count = 0
  }

  addPoint( a:vec3 ):void {
    const c = this.count*FLOAT_PER_VERT
    this.vertices[c+0] = a[0]
    this.vertices[c+1] = a[1]
    this.vertices[c+2] = a[2]
    this.count++;
  }


  render(camera : Camera ): void {
    if( this.count === 0 ) return

    this.buffer.subData( this.vertices.subarray(0, this.count*FLOAT_PER_VERT), 0 )

    this.prg.use()
    this.prg.tTex( this.tex )
    camera.modelViewProjectionMatrix(M4, this._wmatrix);

    this.prg.use()
    this.prg.uMVP(M4);

    this.buffer.attribPointer(this.prg)
    this.cfg.apply()
    this.buffer.drawPoints(this.count)

    this.reset()

  }


}