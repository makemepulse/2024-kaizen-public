
/// #if DEBUG

import TextureData, {TextureDataType} from "@webgl/resources/TextureData";
import { BaseTextureResource } from "@webgl/resources/TextureResource";


interface TextureEntry {
  url : string
  bbc : boolean
  w : number
  h : number
  mipmap : boolean
  weight : number
  uptime : number
  cube : boolean
}

const _texsProfile : TextureEntry[] = []

let tstart = 0;
let lastptime = 0;

function markPerfIn():void{
  tstart = performance.now();
}

function markPerfOut():void{
  lastptime = performance.now()-tstart;
}


function add( resource : BaseTextureResource, data : TextureData, lod : number ): void{
  const source = data.sources[lod]


  let weight = 0;

  if( data.datatype === TextureDataType.IMAGE ) 
  {
    const mips = data.sources[lod].surfaces[0]
    const bpp = 3
    for( const mip of mips ){
      const w = mip.width;
      const h = mip.height;
      weight += w*h*bpp;
    }
  } 
  else 
  {
    const mips = data.sources[lod].surfaces[0]
    for( const mip of mips ){
      weight += mip.data.buffer.byteLength;
    }
  }
  

  const entry : TextureEntry = {
    url : resource.request.sources[0].lods[0].files[0],
    bbc : (data.datatype == TextureDataType.RAW_COMPRESSED ),
    w : source.surfaces[0][0].width,
    h : source.surfaces[0][0].height,
    mipmap : source.surfaces[0].length > 1,
    weight : weight,
    uptime :lastptime,
    cube : false
  }

  _texsProfile.push( entry );

}


function report(): void{ 
  const a = []
  let memTotal = 0;
  let procTotal = 0;
  for ( const tp of _texsProfile ){

    const o = {
      url : tp.url,
      dimensions : tp.w+'x'+tp.h,
      compressed : tp.bbc,
      'memory (Mo)' : (Math.round( (tp.weight / (1024*1024))*1000 )/1000),
      'upload time(ms)' : (Math.round( tp.uptime*100 )/100),
    }

    if(tp.mipmap) o.dimensions += ' (mips)'
    if(tp.cube) o.dimensions += ' (cube)'

    memTotal += tp.weight;
    procTotal += tp.uptime
    a.push( o );
  }

  memTotal = (Math.round( (memTotal / (1024*1024))*100 )/100)
  procTotal = (Math.round( procTotal*10 )/10),
  console.log( 'total memory '+memTotal )
  console.log( 'total process '+procTotal )
  console.table( a )
}



const TextureProfiler = {
  markPerfIn,
  markPerfOut,
  add,
  report
}


export default TextureProfiler;



// reports


/// #endif