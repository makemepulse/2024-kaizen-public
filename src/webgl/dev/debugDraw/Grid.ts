import Capabilities from "@webgl/core/Capabilities"
import { RenderContext } from "@webgl/core/Renderer"
import Programs from "@webgl/glsl/programs"
import { mat4, vec3 } from "gl-matrix"
import Rect from "nanogl-primitives-2d/rect"
import GLState, { LocalConfig } from 'nanogl-state/GLState'
import Program from "nanogl/program"
import { GLContext } from "nanogl/types"



const M4 = mat4.create()


export enum GridOrientation {
  NONE = 0,
  XY = 1,
  XZ = 2,
  YZ = 4,
}

export default class Grid {

  private rect:Rect
  private prg: Program
  private cfg: LocalConfig

  scale = 50

  color = vec3.fromValues(.5, .5, .5)



  constructor( private gl:GLContext ){
    this.rect = new Rect(gl)

    this.cfg = GLState.get(gl).config()
      .enableDepthTest()
      .depthMask(false)
      .enableBlend()
      .blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA )
      .enablePolygonOffset()
      .polygonOffset(1, 1)

    this.prg = Programs(gl).get('debug-grid')
  }

  draw( orientation : GridOrientation, ctx:RenderContext ):void{
    if( orientation === 0 ) return
    if( !Capabilities(this.gl).hasStandardDerivatives ) return

    this.prg.use()
    this.rect.attribPointer(this.prg)
    
    this.cfg.apply()
    const s = this.scale

    this.prg.uScale( s )
    this.prg.uColor( this.color )
    
    if( orientation & GridOrientation.XY ){
      mat4.identity(M4)
      mat4.scale( M4, M4, vec3.fromValues(s,s,s))
      this.prg.uMVP(ctx.camera.getMVP(M4))
      this.rect.render()
    }
    
    if( orientation & GridOrientation.XZ ){
      mat4.fromXRotation(M4, Math.PI/2)
      mat4.scale( M4, M4, vec3.fromValues(s,s,s))
      this.prg.uMVP(ctx.camera.getMVP(M4))
      this.rect.render()
    }
    
    if( orientation & GridOrientation.YZ ){
      mat4.fromYRotation(M4, Math.PI/2)
      mat4.scale( M4, M4, vec3.fromValues(s,s,s))
      this.prg.uMVP(ctx.camera.getMVP(M4))
      this.rect.render()
    }
  }


}