
export interface ITextureOptions {
  /**
   * if true, standard texture use RGBA format instead of RGB
   */
  alpha      : boolean
  smooth     : boolean
  mipmap     : boolean
  miplinear  : boolean
  aniso: 0|2|4|8|16
  wrap: 'repeat'|'clamp'|'mirror'
}

const _DEFAULT_OPTS : Readonly<ITextureOptions> = {
  alpha    : false,
  smooth   : true ,
  mipmap   : false,
  miplinear: false,
  aniso: 0,
  wrap: 'repeat',
}

/**
 * Resolve  complete / default texture options from partial or undefined one
 * @param opts partial options or undefined
 * @returns 
 */
export function resolveTextureOptions( opts?:Partial<ITextureOptions> ): Readonly<ITextureOptions> {
  return Object.assign( {}, _DEFAULT_OPTS, opts || {})
}


export interface ITextureRequestLod {
  files : string[],
  // buffers : ArrayBuffer[],
}

export interface ITextureRequestSource {
  codec : string,
  /*
   * various resolution of the texture, can be used to preload low res and ghost load hi res, or accomodate perf/memory capabilities...
   */
  lods : ITextureRequestLod[],
  // datas : TextureData | null
}


export interface ITextureRequest {
  // options : Partial<ITextureRequestOptions>;
  sources : ITextureRequestSource[];
}


export class TextureSrcSet implements ITextureRequest {

  // options: ITextureRequestOptions;
  sources: ITextureRequestSource[];

  static create( path:string, bbc = false ) : TextureSrcSet {

    const sources: [string, string][] = [
      ['webp',  `${path}.webp`    ],
      ['std' ,  path ]
    ] 

    if( bbc ){
      sources.unshift(
        ['astc' ,  `${path}.astc.ktx` ],
        ['dxt' ,  `${path}.dxt.ktx` ],
        ['etc' ,  `${path}.etc.ktx` ],
        ['pvr' ,  `${path}.pvr.ktx` ],
      )
    }

    return new TextureSrcSet( sources )
  }

  constructor( sources : string | [string, string][] ){

    if( typeof sources === 'string' ){
      sources = [ ['std', sources]]
    } 

    this.sources = []
    for (const codec of sources) {
      const url = codec[1];
      this.sources.push( {
        codec: codec[0],
        lods : [{files:[url]}],
      });
    }
  }

}


export class CubeSrcSet implements ITextureRequest {

  options: ITextureOptions;
  sources: ITextureRequestSource[];

  constructor( sources : Record<string, Array<string>> ){

    this.sources = []
    for (const codec in sources) {

      const lods = [{files: sources[codec]}];

      this.sources.push( {
        codec,
        lods,
      });

    }

  }


}