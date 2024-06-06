/* eslint-disable @typescript-eslint/no-explicit-any */


declare global {
  interface Dev {
    textureUsage: ()=>void
  }
  interface Window {
    dataLayer: any[],
    dev:Partial<Dev>
  }
}

export {};