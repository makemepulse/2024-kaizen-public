// import { GlslModule } from "./GlslModule";


type GlslModule = {
  (o?:unknown):string
  toString():string
  onHmr(cb:(module:GlslModule)=>void):void
}

declare module "*.glsl" {
    const value: GlslModule;
    export default value;
}

declare module "*.frag" {
    const value: GlslModule;
    export default value;
}

declare module "*.vert" {
    const value: GlslModule;
    export default value;
}

