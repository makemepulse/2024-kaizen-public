import GLArrayBuffer from 'nanogl/arraybuffer'
import GLIndexBuffer from 'nanogl/indexbuffer'
import Program from 'nanogl/program'
import Node from 'nanogl-node'

import { GLContext } from 'nanogl/types'
import GLState, { LocalConfig } from 'nanogl-state/GLState'
import Camera from 'nanogl-camera'
import CircleGuizmo from './CircleGuizmo'
import { mat4, vec3 } from 'gl-matrix'

const M4 = mat4.create();
const SVEC = vec3.create();

const FBUFF = new Float32Array([
   0,  0, 0 , // origin
   0,  0, 1 , // target
   1,  0, 1 ,// top
  -1,  0, 1 , // bottom
   0, -1, 1 , // left
   0,  1, 1 ,// right
])

const IDX = new Uint8Array([
  0, 1,
  0, 2,
  0, 3,
  0, 4,
  0, 5,
])



const VERT = `
attribute vec3 aPosition;
varying vec3 vColor;
uniform mat4 uMVP;
uniform mat4 uFrustumMat;
uniform vec2 uParams;
void main(void){
  vec3 pos = aPosition;
  pos.xy *= uParams.y; // height
  pos.z *= uParams.x; // height
  gl_Position = uMVP * vec4(pos, 1.0);
}`


const FRAG = `
precision lowp float;
uniform vec3 uColor;
void main(void){
  gl_FragColor = vec4( uColor, 1.0 );
}`


export default class ConeGuizmo extends Node {

  buffer    : GLArrayBuffer
  indices   : GLIndexBuffer
  prg       : Program
  cfg       : LocalConfig
  circle    : CircleGuizmo

  height = 1
  angle = Math.PI/2

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
    
    this.circle = new CircleGuizmo(gl)
    this.circle.z = 1
    this.add( this.circle )
    
  }


  render(camera : Camera ): void {

    camera.modelViewProjectionMatrix(M4, this._wmatrix);

    this.prg.use()
    this.prg.uMVP(M4);

    this.prg.uColor(1.0, 0, 0, 1);
    const xyScale = this.height*Math.tan(this.angle)
    this.prg.uParams(this.height, xyScale);

    this.buffer.attribPointer(this.prg)
    this.cfg.apply()
    this.indices.bind();
    this.indices.drawLines();
    
    SVEC[0] = xyScale
    SVEC[1] = xyScale
    SVEC[2] = 1
    const cm = this.circle._wmatrix
    mat4.scale(cm, this._wmatrix, SVEC )
    cm[12] += cm[8] * this.height
    cm[13] += cm[9] * this.height
    cm[14] += cm[10] * this.height
    this.circle.render(camera)



  }


}