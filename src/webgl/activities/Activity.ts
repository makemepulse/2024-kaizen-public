import { RenderContext } from "@webgl/core/Renderer";

export interface Activity {

  load(): Promise<void>
  unload(): void

  start(): void
  stop(): void

  preRender(): void
  rttPass(): void

  render(context: RenderContext): void

}
