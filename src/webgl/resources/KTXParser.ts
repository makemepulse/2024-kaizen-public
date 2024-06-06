
const MAGIC = new Uint8Array([0xAB, 0x4B, 0x54, 0x58, 0x20, 0x31, 0x31, 0xBB, 0x0D, 0x0A, 0x1A, 0x0A]);


function CheckMagic(f:Uint8Array) {
  for (let i = 0; i < 12; i++) {
    if (f[i] !== MAGIC[i]) return false;
  }
  return true;
}

export default interface TextureDefinition{

  width: number
  height: number
  surfaces: Array<Array<ArrayBufferView>>
  format: GLenum
  internalFormat: GLenum
  type: GLenum
  cubemap: boolean
  
}


export default class KTXParser {


  parse = (source: ArrayBuffer) : TextureDefinition => {
    const magic = new Uint8Array(source, 0, 12);
    if (!CheckMagic(magic)) {
      throw new Error("[KTXParser] Bad Magic");
    }

    // const headerLength = 64; // bytes
    const buffer = new DataView(source);

    const lendian = (buffer.getUint32(12, true) === 0x04030201);

    let ptr = 16;

    const glType                = buffer.getUint32(ptr, lendian); ptr += 4;
    const glTypeSize            = buffer.getUint32(ptr, lendian); ptr += 4;
    const glFormat              = buffer.getUint32(ptr, lendian); ptr += 4;
    const glInternalFormat      = buffer.getUint32(ptr, lendian); ptr += 4;
    const glBaseInternalFormat  = buffer.getUint32(ptr, lendian); ptr += 4;
    const pixelWidth            = buffer.getUint32(ptr, lendian); ptr += 4;
    const pixelHeight           = buffer.getUint32(ptr, lendian); ptr += 4;
    const pixelDepth            = buffer.getUint32(ptr, lendian); ptr += 4;
    const numberOfArrayElements = buffer.getUint32(ptr, lendian); ptr += 4;
    const numberOfFaces         = buffer.getUint32(ptr, lendian); ptr += 4;
    const numberOfMipmapLevels  = buffer.getUint32(ptr, lendian); ptr += 4;
    const bytesOfKeyValueData   = buffer.getUint32(ptr, lendian); ptr += 4;

    glTypeSize;
    glFormat;
    glBaseInternalFormat;
    pixelDepth;

    // skip KeyValueData
    ptr += bytesOfKeyValueData;

    const numMips = (numberOfMipmapLevels > 0) ? numberOfMipmapLevels : 1;
    const numSurfs = (numberOfArrayElements > 0) ? numberOfArrayElements : 1;
    const numFaces = (numberOfFaces > 0) ? numberOfFaces : 1;
    // const pixDepth = (pixelDepth > 0) ? pixelDepth : 1;



    const surfaces : Array<Array<ArrayBufferView>> = [];

    for (let faceIndex = 0; faceIndex < numFaces; faceIndex++) {
      surfaces.push([]);
    }

    for (let i = 0; i < numMips; i++) {
      const imageSize = buffer.getUint32(ptr, lendian); ptr += 4;

      const imageSizeRounded = imageSize & ~3;

      for (let surfIndex = 0; surfIndex < numSurfs; surfIndex++) {

        for (let faceIndex = 0; faceIndex < numFaces; faceIndex++) {

          const byteArray = new Uint8Array(buffer.buffer, ptr, imageSizeRounded);
          ptr += imageSizeRounded;
          surfaces[faceIndex].push(byteArray);

        }

      }

      // mip padding
    }

    // console.log( 'glType                : '+glType                );
    // console.log( 'glTypeSize            : '+glTypeSize            );
    // console.log( 'glFormat              : '+glFormat              );
    // console.log( 'glInternalFormat      : '+glInternalFormat      );
    // console.log( 'glBaseInternalFormat  : '+glBaseInternalFormat  );
    // console.log( 'pixelWidth            : '+pixelWidth            );
    // console.log( 'pixelHeight           : '+pixelHeight           );
    // console.log( 'pixelDepth            : '+pixelDepth            );
    // console.log( 'numberOfArrayElements : '+numberOfArrayElements );
    // console.log( 'numberOfFaces         : '+numberOfFaces         );
    // console.log( 'numberOfMipmapLevels  : '+numberOfMipmapLevels  );
    // console.log( 'bytesOfKeyValueData   : '+bytesOfKeyValueData   );

    return {
      width: pixelWidth,
      height: pixelHeight,
      surfaces: surfaces,
      format: glInternalFormat,
      internalFormat: glInternalFormat,
      type: glType,
      cubemap: false
    } as TextureDefinition;

  }

}