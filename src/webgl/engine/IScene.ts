
import { RenderContext } from "@webgl/core/Renderer"


export interface IScene {
  load():Promise<void>
  unload():void

  preRender():void 
  rttPass():void 
  render(context: RenderContext):void 
}
