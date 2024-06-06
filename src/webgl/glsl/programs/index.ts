import { GlslModule } from "@webgl/glsl/glslModule"
import Capabilities, { CapabilitiesImpl } from "@webgl/core/Capabilities"
import Program from "nanogl/program"
import { GLContext } from "nanogl/types"
import { CreateProgram } from "@webgl/core/CreateProgram"


/// #if DEBUG
//*
const _modules = require.context( './', true, /shader\.(vert|frag)$/i )
/*/ 
/// #else
const _modules = require.context( './', true, /\.\/(?!debug).+\/shader\.(vert|frag)$/i )
/// #endif
//*/




type ProgramSource = {
  id:string, 
  fragModuleId:string
  vertModuleId:string
  vert:GlslModule, 
  frag:GlslModule
}

const _sources: ProgramSource[] = []


function getPair( id:string ): ProgramSource {
  let res = _sources.find( p=>p.id === id )
  if( res === undefined ){
    res = {
      id, vert:null, frag: null, 
      vertModuleId : null,
      fragModuleId : null
    }
    _sources.push( res )
  }
  return res
}


_modules.keys().forEach( k=>{

  const filepath = k.substring(2, k.length)
  const programId = filepath.split('/')[0]
  
  const pair = getPair(programId)

  if( filepath.endsWith( 'frag' ) ){
    pair.fragModuleId = k 
    pair.frag = _modules(k)
  } else {
    pair.vertModuleId = k 
    pair.vert = _modules(k)
  }
})


for (const pair of _sources) {

  if( pair.vert === null ){
    throw `Program ${pair.id} missing vertex shader`
  }

  if( pair.frag === null ){
    throw `Program ${pair.id} missing fragment shader`
  }
  
}



type PrecisionEnum = 'lowp' | 'mediump' | 'highp'

export class ProgramsLib {

  private _programs: Map<string, Program>;

  highp   : PrecisionEnum = 'lowp'
  mediump : PrecisionEnum = 'lowp'

  version : string
  capabilities: CapabilitiesImpl

  constructor( private gl:GLContext ){

    this.capabilities = Capabilities( gl );

    this.mediump = this.capabilities.hasMediumpPrecision ? 'mediump' : 'lowp'
    this.highp   = this.capabilities.hasHighpPrecision   ? 'highp'   : this.mediump
    this.version = `#version ${this.capabilities.isWebgl2  ? "300 es"  : "100"}`

    this._programs = new Map()

    for (const source of _sources) {

      const p = new Program( gl, source.vert(this), source.frag(this) )

      /// #if DEBUG
      this._handleHMR( source, p )
      /// #endif
      
      this._programs.set( source.id, p )
    }
  }

  create( vert:GlslModule, frag:GlslModule, prefix?:string ): Program {
    return CreateProgram( this.gl, vert, frag, prefix, this )
  }


  get( id:string):Program {
    if( !this._programs.has(id) ){
      throw `Program "${id}" not found`
    }
    return this._programs.get( id )
  }
  
  
  /// #if DEBUG
  _handleHMR(source: ProgramSource, p: Program):void{
    source.vert.onHmr( s=>{
      if( this._validate( s(this), source.frag(this) ) ){
        source.vert = s
        p.compile( source.vert(this), source.frag(this) ) 
      }
    })
    source.frag.onHmr( s=>{
      if( this._validate( source.vert(this), s(this) ) ) {
        source.frag = s
        p.compile( source.vert(this), source.frag(this) ) 
      }
    })
  }

  private _validate(v: string, f: string): boolean {
    const p = new Program( this.gl )
    return p.compile( v, f )
  }

  /// #endif
}


const _instances = new WeakMap<GLContext, ProgramsLib>()

export default function Programs(gl:GLContext ):ProgramsLib {
  let res = _instances.get( gl )
  if( !res ){
    res = new ProgramsLib(gl)
    _instances.set( gl, res )
  }
  return res
}

