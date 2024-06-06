import { GLContext, isWebgl2 } from "nanogl/types";



export interface InstancingImpl {
  readonly isSupported: boolean
  drawArraysInstanced(mode: GLenum, first: GLint, count: GLsizei, instanceCount: GLsizei): void;
  drawElementsInstanced(mode: GLenum, count: GLsizei, type: GLenum, offset: GLintptr, instanceCount: GLsizei): void;
  vertexAttribDivisor(index: GLuint, divisor: GLuint): void;
}


class Webgl2Implementation implements InstancingImpl {
  readonly isSupported = true
  constructor( private gl : WebGL2RenderingContext ){}
  drawArraysInstanced(mode: GLenum, first: GLint, count: GLsizei, instanceCount: GLsizei): void{
    this.gl.drawArraysInstanced( mode, first, count, instanceCount )
  }
  drawElementsInstanced(mode: GLenum, count: GLsizei, type: GLenum, offset: GLintptr, instanceCount: GLsizei): void{
    this.gl.drawElementsInstanced( mode, count, type, offset, instanceCount)
  }
  vertexAttribDivisor(index: GLuint, divisor: GLuint): void{
    this.gl.vertexAttribDivisor( index, divisor )
  }
}

class ExtImplementation implements InstancingImpl {

  readonly isSupported = true
  constructor( private ext : ANGLE_instanced_arrays ){}

  drawArraysInstanced(mode: GLenum, first: GLint, count: GLsizei, instanceCount: GLsizei): void{
    this.ext.drawArraysInstancedANGLE( mode, first, count, instanceCount )
  }

  drawElementsInstanced(mode: GLenum, count: GLsizei, type: GLenum, offset: GLintptr, instanceCount: GLsizei): void{
    this.ext.drawElementsInstancedANGLE( mode, count, type, offset, instanceCount)
  }

  vertexAttribDivisor(index: GLuint, divisor: GLuint): void{
    this.ext.vertexAttribDivisorANGLE( index, divisor )
  }

}

class NoopImplementation implements InstancingImpl {
  readonly isSupported = false
  drawArraysInstanced(): void {0}
  drawElementsInstanced(): void {0}
  vertexAttribDivisor(): void {0}
}



export default function getInstancingImplementation( gl : GLContext ) : InstancingImpl {
  
  if (isWebgl2(gl)) {
    return new Webgl2Implementation(gl)
  } 
  
  const ext = gl.getExtension( "ANGLE_instanced_arrays" )
  if( ext ){
    return new ExtImplementation(ext)
  } 

  return new NoopImplementation()
}

