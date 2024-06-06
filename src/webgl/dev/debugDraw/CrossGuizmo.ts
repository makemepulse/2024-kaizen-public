import GLArrayBuffer from 'nanogl/arraybuffer'
import Program from 'nanogl/program'
import Node from 'nanogl-node'

import mat4 from 'gl-matrix/src/gl-matrix/mat4'
import { GLContext } from 'nanogl/types';
import GLState, { LocalConfig } from 'nanogl-state/GLState';
import Camera from 'nanogl-camera';

const M4 = mat4.create();

const BUFF = new ArrayBuffer(6 * 4 * 4)

const FBUFF = new Float32Array(BUFF)
FBUFF[4] = 1.0
FBUFF[13] = 1.0
FBUFF[22] = 1.0

const IBUFF = new Uint32Array(BUFF);
IBUFF[3] = IBUFF[7] = 0x000000FF
IBUFF[11] = IBUFF[15] = 0x0000FF00
IBUFF[19] = IBUFF[23] = 0x00FF0000


const VERT = `
attribute vec3 aPosition;
attribute vec3 aColor;
varying vec3 vColor;
uniform mat4 uMVP;
void main(void){
  gl_Position = uMVP * vec4(aPosition, 1.0);
  vColor = aColor;
}`


const FRAG = `
precision lowp float;
varying vec3 vColor;
void main(void){
  gl_FragColor = vec4( vColor, 1.0 );
}`


class Guizmo extends Node {

  buffer: GLArrayBuffer;
  prg   : Program      ;
  cfg   : LocalConfig  ;


  constructor(private gl:GLContext) {

    super()

    this.buffer = new GLArrayBuffer(gl, BUFF);
    this.buffer.attrib('aPosition', 3, gl.FLOAT);
    this.buffer.attrib('aColor', 3, gl.UNSIGNED_BYTE, true);
    this.buffer.attrib('pad', 1, gl.BYTE);

    this.prg = new Program(gl, VERT, FRAG);

    this.cfg = GLState.get(gl).config()
      .enableCullface(false)
      .enableDepthTest()
      .depthMask(true)
      .lineWidth(1);

  }


  render(camera : Camera ):void {

    camera.modelViewProjectionMatrix(M4, this._wmatrix);

    this.prg.use()
    this.prg.uMVP(M4);

    this.buffer.attribPointer(this.prg)
    this.cfg.apply()
    this.buffer.drawLines();

  }

}

export default Guizmo;