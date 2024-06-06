import { GlslModule } from "@webgl/glsl/glslModule";
import Program from "nanogl/program";
import { GLContext } from "nanogl/types";

/// #if DEBUG

/**
 * Wrap a glsl import module to a GlslModule which return up to date code when HMR is triggered
 * @param glslModule 
 * @returns 
 */
export default function CreateShader(glslModule:GlslModule ): GlslModule {
  let uptodateModule = glslModule
  glslModule.onHmr(m=>uptodateModule=m)
  const fn:GlslModule = function(o?:unknown){
    return uptodateModule(o)
  }
  fn.toString=fn;
  fn.onHmr= (l)=>uptodateModule.onHmr(l);
  return fn
}

/**
 * Return a program which automatically recompile when one of its shader is updated by HMR.
 * @param gl 
 * @param vert 
 * @param frag 
 * @param prefix 
 * @returns 
 */
export function CreateProgram( gl:GLContext, vert:GlslModule, frag:GlslModule, prefix?:string, datas?: unknown ): Program {
  const prg = new Program(gl)
  const lv = CreateShader(vert)
  const lf = CreateShader(frag)
  const compile = ()=>prg.compile(lv(datas), lf(datas), prefix)
  compile()
  lv.onHmr(compile)
  lf.onHmr(compile)
  return prg
}


/// #else

/// #code export default function CreateShader(glslModule:GlslModule ): GlslModule { return glslModule }
/// #code export function CreateProgram( gl:GLContext, vert:GlslModule, frag:GlslModule, defs?:string, datas?: unknown ): Program { return new Program(gl, vert(datas), frag(datas), defs); }

/// #endif