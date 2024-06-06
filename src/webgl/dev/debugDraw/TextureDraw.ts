import { GLContext } from "nanogl/types";
import Rect from 'nanogl-primitives-2d/rect'
import Program from "nanogl/program";
import Texture2D from "nanogl/texture-2d";
import GLState, { LocalConfig } from 'nanogl-state/GLState';
import { RenderContext } from "@webgl/core/Renderer";

const VERT = `
attribute vec2 aPosition;
attribute vec2 aTexCoord;
varying vec2 vTexCoord0;
uniform vec4 uScaleTranslate;
void main( void ){
  gl_Position = vec4( aPosition*uScaleTranslate.xy+uScaleTranslate.zw, 0.0, 1.0 );
  gl_Position.y *= -1.0;
  vTexCoord0 = aTexCoord;
}
`


const FRAG = `
precision lowp float;
varying vec2 vTexCoord0;
uniform sampler2D tTex;
void main(void){
  gl_FragColor = texture2D( tTex, vTexCoord0 );
}
`


export type TextureDrawCommand = {
  tex : Texture2D
  x:number
  y:number
  w:number
  h:number,
  flipY? :boolean
}


export default class TextureDraw {

  rect : Rect
  prg: Program;
  cfg: LocalConfig;

  constructor( private gl:GLContext ){

    this.prg = new Program(gl, VERT, FRAG);

    this.cfg = GLState.get(gl).config()
      .enableCullface(false)
      .enableDepthTest(false)
      .depthMask(false)
      
    this.rect = new Rect( gl )
    this.rect.attribPointer( this.prg )
  }
  

  draw( command: TextureDrawCommand, ctx:RenderContext ):void{
    let {x,y,w,h} = command
    
    const vpw = ctx.viewport.width
    const vph = ctx.viewport.height
    
    x /= vpw
    y /= vph
    w /= vpw
    h /= vph
  
    // if( command.tex.format === this.gl.DEPTH_COMPONENT ){
    
    // }
    

    this.prg.use()
    this.rect.attribPointer( this.prg )
    this.cfg.apply()

    this.prg.tTex( command.tex )

    const ty = ( command.flipY === true) ? -h : h
    this.prg.uScaleTranslate( w, ty, (x*2)-1+w, (y*2)-1+h)
    this.rect.render()
  }

}