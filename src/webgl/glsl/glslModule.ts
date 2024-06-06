
export type GlslModule = {
  (o?:unknown):string
  onHmr : (l?:(s:GlslModule)=>void)=>void
  toString():string
}