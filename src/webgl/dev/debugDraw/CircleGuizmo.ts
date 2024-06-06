import GLArrayBuffer from 'nanogl/arraybuffer'
import Program from 'nanogl/program'
import Node from 'nanogl-node'

import { GLContext } from 'nanogl/types'
import GLState, { LocalConfig } from 'nanogl-state/GLState'
import Camera from 'nanogl-camera'
import { mat4 } from 'gl-matrix'

const M4 = mat4.create();

const CircleSegs = 32;

const Circle: number[] = []
for (let i = 0; i < CircleSegs; i++) {
  const a = i / CircleSegs * Math.PI * 2
  Circle.push( Math.cos(a), Math.sin(a) );
}

const FBUFF = new Float32Array(Circle)



const VERT = `
attribute vec2 aPosition;
uniform mat4 uMVP;
uniform float uRadius;
void main(void){
  gl_Position = uMVP * vec4(aPosition * uRadius, 0.0, 1.0);
}`


const FRAG = `
precision lowp float;
uniform vec3 uColor;
void main(void){
  gl_FragColor = vec4( uColor, 1.0 );
}`


export default class CircleGuizmo extends Node {

  buffer    : GLArrayBuffer
  prg       : Program
  cfg       : LocalConfig

  radius = 1

  constructor(private gl:GLContext) {

    super();

    this.gl = gl;
    this.buffer = new GLArrayBuffer(gl, FBUFF);
    this.buffer.attrib('aPosition', 2, gl.FLOAT);

    this.prg = new Program(gl, VERT, FRAG);

    this.cfg = GLState.get(gl).config()
      .enableCullface(false)
      .enableDepthTest()
      .depthMask(true)
      .lineWidth(1);

  }


  render(camera : Camera ): void {

    this.prg.use()


    camera.modelViewProjectionMatrix(M4, this._wmatrix);

    this.prg.use()
    this.prg.uMVP(M4);
    this.prg.uRadius(this.radius);


    this.prg.uColor(1.0, 0, 0, 1);

    this.buffer.attribPointer(this.prg)
    this.cfg.apply()
    this.buffer.drawLineLoop();

  }


}