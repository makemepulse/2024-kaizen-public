import Capabilities from '@webgl/core/Capabilities'
import { InstancingImpl } from '@webgl/core/Instancing'
import { RenderContext } from '@webgl/core/Renderer'
import { vec3, vec4 } from 'gl-matrix'
import GLState, { LocalConfig } from 'nanogl-state/GLState'
import GLArrayBuffer from 'nanogl/arraybuffer'
import Program from 'nanogl/program'
import Texture2D from 'nanogl/texture-2d'
import { GLContext } from 'nanogl/types'



const GLYPHS = `ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:()[]%#@&"'*/-+?!<>{}_`

const GLYPHS_WIDTH = 15
const GLYPHS_HEIGHT = 22
const TEX_WIDTH = 256
const TEX_HEIGHT = 128

const FONT_CFG = "18px 'Source Code Pro'"

const MAX_CHAR = 1024 * 16


const V4 = vec4.create()

type Glyph = {
  readonly char: string
  readonly index: number
  readonly px: number
  readonly py: number
}



class TextureAtlas {

  texture: Texture2D

  glyphs = new Map<string, Glyph>()
  glyphsPerLines: number

  private _isInit = false
  private _isReady = false

  public get isReady() {
    return this._isReady
  }

  constructor(gl: GLContext) {
    this.texture = new Texture2D(gl, gl.RGBA, gl.UNSIGNED_BYTE)
  }

  lazyInit() {
    if (this._isInit) return
    this._isInit = true
    this.generateGlyphs()
  }


  getGlyphIndex(char: string): number {
    return this.glyphs.get(char).index
  }


  hasGlyph(char: string): boolean {
    return this.glyphs.has(char)
  }


  async generateGlyphs() {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    await import("./Text.css")

    await document.fonts.ready

    console.assert(document.fonts.check(FONT_CFG));


    const cvs = document.createElement('canvas')
    cvs.width = TEX_WIDTH
    cvs.height = TEX_HEIGHT

    // cvs.style.position = "absolute"
    // cvs.style.transform = "scale(1)"
    // document.body.appendChild(cvs)
    
    const ctx = cvs.getContext('2d')
    ctx.font = FONT_CFG
    ctx.fillStyle = "white"
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;

    const glyphsPerLines = Math.floor(TEX_WIDTH / GLYPHS_WIDTH)

    for (let index = 0; index < GLYPHS.length; index++) {
      const char = GLYPHS[index];
      const px = (index % glyphsPerLines) * GLYPHS_WIDTH + 2
      const py = Math.floor(index / glyphsPerLines) * GLYPHS_HEIGHT + 18 - 3

      ctx.strokeText(char, px, py, GLYPHS_WIDTH)
      ctx.fillText(char, px, py, GLYPHS_WIDTH)

      this.glyphs.set(char, {char, index, px, py})
    }

    this.glyphsPerLines = glyphsPerLines

    // ctx.lineWidth = 1;
    // ctx.strokeStyle = '#f00';
    // for (let i = 0; i < 25; i++) {
    //   ctx.moveTo(i*GLYPHS_WIDTH, 0);
    //   ctx.lineTo(i*GLYPHS_WIDTH, TEX_HEIGHT);

    //   ctx.moveTo(0, i*GLYPHS_HEIGHT);
    //   ctx.lineTo(TEX_WIDTH, i*GLYPHS_HEIGHT);

    // }
    // ctx.stroke()

    this.texture.fromImage(cvs)

    this._isReady = true
  }
}


class Text {

  readonly pos: vec3

  constructor(readonly str: string, wpos: vec3) {
    this.pos = new Float32Array(3) as vec3
    this.pos.set(wpos )
  }

}






const VERT = `
attribute vec2 aPosition;
attribute vec3 aInstanceData;
uniform vec2 uVpUnit;
uniform float uglyphsPerLines;
varying vec2 vTexCoord;
uniform vec2 vtScale;

void main(void){
  gl_Position = vec4(aPosition*uVpUnit + aInstanceData.xy, 0.0, 1.0);

  float index = aInstanceData.z;
  vec2 baseVt = aPosition;
  baseVt.y = 1.0 - baseVt.y;
  vTexCoord = vtScale * (baseVt + vec2(
    mod(index,uglyphsPerLines),
    floor(index/uglyphsPerLines)
  ));
}`


const FRAG = `
precision lowp float;
uniform sampler2D tAtlas;
varying vec2 vTexCoord;
void main(void){
  gl_FragColor = texture2D( tAtlas, vTexCoord );
}`




export default class TextRenderer {

  prg: Program;

  atlas: TextureAtlas

  quadBuffer: GLArrayBuffer
  instBuffer: GLArrayBuffer
  instData: Float32Array

  instancing: InstancingImpl

  texts: Text[] = []
  cfg: LocalConfig

  constructor(private gl: GLContext) {

    this.atlas = new TextureAtlas(gl)

    this.prg = new Program(gl, VERT, FRAG);

    this.instancing = Capabilities(gl).instancing

    this.quadBuffer = new GLArrayBuffer(gl, new Float32Array([
      0, 0,
      0, 1,
      1, 0,
      1, 1,
    ]))

    this.quadBuffer.attrib('aPosition', 2, gl.FLOAT)
    this.instData = new Float32Array(MAX_CHAR * 3)

    this.instBuffer = new GLArrayBuffer(gl, this.instData)
    this.instBuffer.attrib('aInstanceData', 3, gl.FLOAT)

    this.cfg = GLState.get(gl).config()
      .enableBlend()
      .blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)


  }

  add(txt: string, wpos: vec3): void {
    this.texts.push(new Text(txt, wpos))
  }

  clear(): void {
    this.texts.length = 0
  }

  draw( ctx:RenderContext ): void {
    if (this.texts.length === 0) return;

    this.atlas.lazyInit()

    if (!this.atlas.isReady) return;

    const renderScale = .5

    const dpi = 2

    const vpw = ctx.viewport.width / dpi
    const vph = ctx.viewport.height / dpi

    const wu = 2 / vpw
    const hu = 2 / vph

    const charw = wu * (GLYPHS_WIDTH-2) * renderScale// reduce letter-spacing by 1px
    const charh = hu * (GLYPHS_HEIGHT) * renderScale

    let c = 0
    const data = this.instData
    const camera = ctx.camera

    for (let i = 0; i < this.texts.length; i++) {
      const text = this.texts[i];
      V4.set( text.pos )
      V4[3] = 1

      vec4.transformMat4(V4, V4, camera._viewProj)


      let x = V4[0]/V4[3]
      let y = V4[1]/V4[3]
      
      if( V4[3] < 0 ) continue
      
      for (let j = 0; j < text.str.length; j++) {
        const char = text.str[j];
        if( char == '\n' ) {
          x = V4[0]/V4[3]
          y -= charh
        } else if (this.atlas.hasGlyph(char)) {
          data[c * 3 + 0] = x
          data[c * 3 + 1] = y
          data[c * 3 + 2] = this.atlas.getGlyphIndex(char)
          c++
          x += charw
        } else {
          x += charw
        }
      }

    }


    this.instBuffer.subData(new Float32Array(this.instData.buffer, 0, c * 3), 0)


    this.prg.use()
    this.prg.uVpUnit(wu * GLYPHS_WIDTH * renderScale, hu * GLYPHS_HEIGHT * renderScale)
    this.prg.uglyphsPerLines(this.atlas.glyphsPerLines)
    this.prg.vtScale(GLYPHS_WIDTH / TEX_WIDTH, GLYPHS_HEIGHT / TEX_HEIGHT)
    this.prg.tAtlas(this.atlas.texture)

    this.quadBuffer.attribPointer(this.prg)
    this.instBuffer.attribPointer(this.prg)

    this.instancing.vertexAttribDivisor(this.prg.aInstanceData(), 1)

    this.cfg.apply()

    this.instancing.drawArraysInstanced(
      this.gl.TRIANGLE_STRIP,
      0,             // offset
      this.quadBuffer.length,   // num vertices per instance
      c,  // num instances
    );

    this.instancing.vertexAttribDivisor(this.prg.aInstanceData(), 0)

  }

}

