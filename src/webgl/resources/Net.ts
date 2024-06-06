import nativeAbortSignal from "@/core/AbortSignalUtils";
import Deferred from "@/core/Deferred";
import { Resource } from "./Resource";


const _domParser = new DOMParser();



function validateResponse(response: Response): void {
  if (!response.ok) {
    throw new Error(`NetworkError: status : ${response.status} ${response.statusText}, url : ${response.url}`)
  }
}

/**
 * fetch equivalent which reject if status is not OK
 * 
 * The Promise returned from fetch() won’t reject on HTTP error status even if the response is an HTTP 404 or 500. 
 * Instead, it will resolve normally (with ok status set to false), and it will only reject on network failure or
 * if anything prevented the request from completing.
 */
export async function fetchSafe(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const response = await fetch(input, init);
  validateResponse(response);
  return response;
}




abstract class AbstractFetchResource<T=unknown> extends Resource<T> {
  
  readonly url      : RequestInfo;
  readonly init     : RequestInit;


  constructor( url:RequestInfo, init: RequestInit = {} ){
    super();
    this.url = url;
    this.init = init;
  }
  
  
  async doLoad() : Promise<T> {
    const init = Object.assign( {}, this.init, {signal : nativeAbortSignal(this.abortSignal) });
    const response = await fetchSafe(this.url, init);
    return this.parseResponse( response );
  }
  
  doUnload() : void {
    0
  }

  abstract parseResponse( response : Response ) : Promise<T>;

}



export class FetchResource extends AbstractFetchResource<Response> {
  parseResponse(response: Response): Promise<Response> {
    return Promise.resolve(response);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class JsonResource extends AbstractFetchResource<any> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parseResponse(response: Response): Promise<any> {
    return response.json();
  }
}

export class BlobResource extends AbstractFetchResource<Blob> {
  parseResponse(response: Response): Promise<Blob> {
    return response.blob();
  }
}

export class TextResource extends AbstractFetchResource<string> {
  parseResponse(response: Response): Promise<string> {
    return response.text();
  }
}

export class BytesResource extends AbstractFetchResource<ArrayBuffer> {
  parseResponse(response: Response): Promise<ArrayBuffer> {
    return response.arrayBuffer();
  }
}

export class XmlResource extends AbstractFetchResource<Document> {
  async parseResponse(response: Response): Promise<Document> {
    const t = await response.text();
    return _domParser.parseFromString(t, "application/xml");
  }
}


export class ImageResource extends AbstractFetchResource<HTMLImageElement> {

  doUnload() : void {
    super.doUnload();
    
    const img = this.value;
    if( img ) {
      img.src = '';
    }
  }

  async parseResponse(response: Response): Promise<HTMLImageElement> {
    const blob = await response.blob();
    
    const src = URL.createObjectURL(blob);    
    const img = new Image();
  
    const def = new Deferred<Event>();
    img.onload  = def.resolve;
    img.onerror = def.reject;
    img.src = src;
    
    try{
      await def.promise
    } finally {
      URL.revokeObjectURL(src);
    }
  
    await img.decode();
    return img;

  }

}


export async function loadText(url: RequestInfo, init?: RequestInit): Promise<string> {
  return new TextResource(url, init).load()
}


// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function loadJson(url: RequestInfo, init?: RequestInit): Promise<any> {
  return new JsonResource(url, init).load()
}


export async function loadBytes(url: RequestInfo, init?: RequestInit): Promise<ArrayBuffer> {
  return new BytesResource(url, init).load()
}


export async function loadBlob(url: RequestInfo, init?: RequestInit): Promise<Blob> {
  return new BlobResource(url, init).load()
}


export async function loadXml(url: RequestInfo, init?: RequestInit): Promise<Document> {
  return new XmlResource(url, init).load()
}


export async function loadImage( url:RequestInfo, init?: RequestInit ) : Promise<HTMLImageElement> {
  return new ImageResource( url, init ).load();
}




