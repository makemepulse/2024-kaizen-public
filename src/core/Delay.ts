
export default function Delay(ms: number): Promise<void>{
  return new Promise<void>( (resolve)=>{
    setTimeout( resolve, ms )
  })
}