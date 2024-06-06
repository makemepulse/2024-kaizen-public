import { GLContext, isWebgl2 } from "nanogl/types";
import Texture2D from "nanogl/texture-2d";
import Fbo from "nanogl/fbo";
import RenderBuffer from "nanogl/renderbuffer";


export class MsaaFbo {

  readonly gl: GLContext;
  readonly _useMsaa : boolean;

  renderFbo : Fbo;
  blitFbo   : Fbo;


  constructor( gl : GLContext, samples : number ){
    
    this.gl = gl;
    this._useMsaa = isWebgl2(gl) && samples > 1


    this.renderFbo = new Fbo( gl );
    this.renderFbo.bind();
    
    if( isWebgl2(gl) && this._useMsaa )
    {
      this.renderFbo.attach( gl.COLOR_ATTACHMENT0, new RenderBuffer(gl, gl.RGBA8, samples ) );
      this.renderFbo.attach( gl.DEPTH_ATTACHMENT, new RenderBuffer(gl, gl.DEPTH_COMPONENT16, samples ) );
      this.blitFbo = new Fbo( gl );
      this.blitFbo.attachColor( gl.RGBA, gl.UNSIGNED_BYTE );
    } else 
    {
      this.renderFbo.attach( gl.COLOR_ATTACHMENT0, new Texture2D( gl, gl.RGBA, gl.UNSIGNED_BYTE) );
      this.renderFbo.attach( gl.DEPTH_ATTACHMENT, new RenderBuffer(gl, gl.DEPTH_COMPONENT16 ) );
      this.blitFbo = this.renderFbo;
    }
    
    
  }


  blitMsaa(){
    if( this._useMsaa ) {
      const gl : WebGL2RenderingContext = this.gl as WebGL2RenderingContext;
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.renderFbo.fbo );
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.blitFbo.fbo);
      gl.clearBufferfv(gl.COLOR, 0, [0.0, 0.0, 0.0, 1.0]);
      gl.blitFramebuffer(
        0, 0, this.renderFbo.width, this.renderFbo.height,
        0, 0, this.renderFbo.width, this.renderFbo.height,
        gl.COLOR_BUFFER_BIT, gl.NEAREST
      );
    }
  }


  getColorTexture() : Texture2D {
    return this.blitFbo.getColorTexture();
  }


  setSize( w: number, h: number): void{
    this.renderFbo.resize(w,h);
    this.blitFbo.resize(w,h);
  }

}