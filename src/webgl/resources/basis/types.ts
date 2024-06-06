import { GLContext } from "nanogl/types"


export type SupportedFormats = {
  s3tc :boolean
  etc1 :boolean
  etc2 :boolean
  pvrtc:boolean
  astc :boolean
  bptc :boolean
}



export type DecodingResponseFormat = { 
  format: number
  uncompressed?: boolean
  type?: number 
}

export type DecodingResponseLevel = {
  level : number
  offset: number
  size  : number
  width : number
  height: number
}


export type DecodingResponse = {
  id: number,
  buffer: ArrayBuffer,
  alphaBuffer: ArrayBuffer | null,
  webglFormat: DecodingResponseFormat,
  mipLevels: DecodingResponseLevel[],
  hasAlpha: boolean,
}

export type DecodingError = {
  id: number
  error: string
}

export type WorkerResponse = DecodingResponse | DecodingError

export interface IBasisDecoder {
  decode(gl : GLContext, buffer: ArrayBuffer) : Promise<DecodingResponse>
}
