
import {AbortError, AbortSignal as AzureAbortSignal, AbortSignalLike} from '@azure/abort-controller';

let nativeAbortSignal: ( azureSignal: AzureAbortSignal ) => AbortSignal;


if( window.AbortController ){
  nativeAbortSignal = ( azureSignal: AzureAbortSignal ): AbortSignal => {
    const nativeCtrl = new AbortController()
    azureSignal.addEventListener('abort', ()=>{
      nativeCtrl.abort()
    })
    return nativeCtrl.signal
  }
} else {
  nativeAbortSignal = (): AbortSignal => {
    return undefined
  }
}


/**
 * provide a native AbortSignal from Azure AbortController signal
 * If native AbortController is not supported, return undefined
 * @param azureSignal AzureAbortController's signal to convert to native AbortSignal
 */
export default nativeAbortSignal

/**
 * throw an AbortErro if the signal is aborted
 */
export function throwIfAborted( signal: AbortSignalLike ){
  if( signal.aborted ){
    throw new AbortError('Aborted')
  }
}

/**
 * wrap a promise, and a return a proxy promise wich resolve with the same value, but reject with AbortError if the signal is aborted
 * @param promise the promise to wrap
 * @param signal the abort signal to listen to
 * @returns 
 */
export async function wrapAbort<T>( promise: Promise<T>, signal: AbortSignalLike ): Promise<T> {
  const val: T = await promise
  if( signal.aborted ){
    throw new AbortError('Aborted')
  }
  return val
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function catchIfAbortError( e: any ){
  if( !isAbortError(e) ){
    throw e
  }
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function catchAbortError<T=any>( p: Promise<T> ):Promise<void|T>{
  return p.catch( catchIfAbortError )
}

/**
 * return true if error is AbortError
 * @param e 
 * @returns 
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isAbortError( e: any ){
  return ( e.name === 'AbortError' || e.message === 'Aborted' )
}
