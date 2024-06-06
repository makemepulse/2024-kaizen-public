
importScripts('basis_transcoder.js');

let KTXFile = null;

const BASIS_INITIALIZED = BASIS({}).then((module) => {
  KTXFile = module.KTX2File;
  module.initializeBasis();
});


// Copied from enum class transcoder_texture_format in basisu_transcoder.h with minor javascript-ification
const BASIS_FORMAT = {
  // Compressed formats
  // ETC1-2
  cTFETC1_RGB : 0,
  cTFETC2_RGBA : 1,
  // BC1-5, BC7 (desktop, some mobile devices)
  cTFBC1_RGB : 2,
  cTFBC3_RGBA : 3,
  cTFBC4_R : 4,
  cTFBC5_RG : 5,
  cTFBC7_RGBA : 6,
  // PVRTC1 4bpp (mobile, PowerVR devices)
  cTFPVRTC1_4_RGB : 8,
  cTFPVRTC1_4_RGBA : 9,
  // ASTC (mobile, Intel devices, hopefully all desktop GPU's one day)
  cTFASTC_4x4_RGBA : 10,
  // Uncompressed (raw pixel) formats
  cTFRGBA32 : 13,
  cTFRGB565 : 14,
  cTFBGR565 : 15,
  cTFRGBA4444 : 16,
}


const GL_RGBA = 0x1908;
const GL_RGB = 0x1907;
const GL_UNSIGNED_BYTE = 0x1401;
const GL_UNSIGNED_SHORT_5_6_5 = 0x8363;
const GL_UNSIGNED_SHORT_4_4_4_4 = 0x8033;

// WebGL compressed formats types, from:
// http://www.khronos.org/registry/webgl/extensions/

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_s3tc/
const COMPRESSED_RGB_S3TC_DXT1_EXT  = 0x83F0;
const COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83F1;
const COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83F2;
const COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc1/
const COMPRESSED_RGB_ETC1_WEBGL = 0x8D64;

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_etc/
const COMPRESSED_R11_EAC                        = 0x9270;
const COMPRESSED_SIGNED_R11_EAC                 = 0x9271;
const COMPRESSED_RG11_EAC                       = 0x9272;
const COMPRESSED_SIGNED_RG11_EAC                = 0x9273;
const COMPRESSED_RGB8_ETC2                      = 0x9274;
const COMPRESSED_SRGB8_ETC2                     = 0x9275;
const COMPRESSED_RGB8_PUNCHTHROUGH_ALPHA1_ETC2  = 0x9276;
const COMPRESSED_SRGB8_PUNCHTHROUGH_ALPHA1_ETC2 = 0x9277;
const COMPRESSED_RGBA8_ETC2_EAC                 = 0x9278;
const COMPRESSED_SRGB8_ALPHA8_ETC2_EAC          = 0x9279;

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_astc/
const COMPRESSED_RGBA_ASTC_4x4_KHR = 0x93B0;

// https://www.khronos.org/registry/webgl/extensions/WEBGL_compressed_texture_pvrtc/
const COMPRESSED_RGB_PVRTC_4BPPV1_IMG  = 0x8C00;
const COMPRESSED_RGB_PVRTC_2BPPV1_IMG  = 0x8C01;
const COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;
const COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 0x8C03;

// https://www.khronos.org/registry/webgl/extensions/EXT_texture_compression_bptc/
const COMPRESSED_RGBA_BPTC_UNORM_EXT         = 0x8E8C;
const COMPRESSED_SRGB_ALPHA_BPTC_UNORM_EXT   = 0x8E8D;
const COMPRESSED_RGB_BPTC_SIGNED_FLOAT_EXT   = 0x8E8E;
const COMPRESSED_RGB_BPTC_UNSIGNED_FLOAT_EXT = 0x8E8F;


const BASIS_WEBGL_FORMAT_MAP = {};
// Compressed formats
BASIS_WEBGL_FORMAT_MAP[ BASIS_FORMAT.cTFBC1_RGB       ] = { format: COMPRESSED_RGB_S3TC_DXT1_EXT     };
BASIS_WEBGL_FORMAT_MAP[ BASIS_FORMAT.cTFBC3_RGBA      ] = { format: COMPRESSED_RGBA_S3TC_DXT5_EXT    };
BASIS_WEBGL_FORMAT_MAP[ BASIS_FORMAT.cTFBC7_RGBA      ] = { format: COMPRESSED_RGBA_BPTC_UNORM_EXT   };
BASIS_WEBGL_FORMAT_MAP[ BASIS_FORMAT.cTFETC1_RGB      ] = { format: COMPRESSED_RGB_ETC1_WEBGL        };
BASIS_WEBGL_FORMAT_MAP[ BASIS_FORMAT.cTFETC2_RGBA     ] = { format: COMPRESSED_RGBA8_ETC2_EAC        };
BASIS_WEBGL_FORMAT_MAP[ BASIS_FORMAT.cTFASTC_4x4_RGBA ] = { format: COMPRESSED_RGBA_ASTC_4x4_KHR     };
BASIS_WEBGL_FORMAT_MAP[ BASIS_FORMAT.cTFPVRTC1_4_RGB  ] = { format: COMPRESSED_RGB_PVRTC_4BPPV1_IMG  };
BASIS_WEBGL_FORMAT_MAP[ BASIS_FORMAT.cTFPVRTC1_4_RGBA ] = { format: COMPRESSED_RGBA_PVRTC_4BPPV1_IMG };
// Uncompressed formats 
BASIS_WEBGL_FORMAT_MAP[ BASIS_FORMAT.cTFRGBA32  ] = { uncompressed: true, format: GL_RGBA, type: GL_UNSIGNED_BYTE          };
BASIS_WEBGL_FORMAT_MAP[ BASIS_FORMAT.cTFRGB565  ] = { uncompressed: true, format: GL_RGB , type: GL_UNSIGNED_SHORT_5_6_5   };
BASIS_WEBGL_FORMAT_MAP[ BASIS_FORMAT.cTFRGBA4444] = { uncompressed: true, format: GL_RGBA, type: GL_UNSIGNED_SHORT_4_4_4_4 };

// Notifies the main thread when a texture has failed to load for any reason.
function fail(id, errorMsg) {
  postMessage({
    id: id,
    error: errorMsg
  });
}

function basisFileFail(id, basisFile, errorMsg) {
  fail(id, errorMsg);
  basisFile.close();
  basisFile.delete();
}

// This utility currently only transcodes the first image in the file.
const IMAGE_INDEX = 0;
const TOP_LEVEL_MIP = 0;


function resolveTextureFormat(supportedFormats, hasAlpha){
  if (hasAlpha) {
    if    (supportedFormats.etc2  ) { return BASIS_FORMAT.cTFETC2_RGBA  ;}
    else if (supportedFormats.bptc  ) { return BASIS_FORMAT.cTFBC7_RGBA   ;}
    else if (supportedFormats.s3tc  ) { return BASIS_FORMAT.cTFBC3_RGBA   ;}
    else if (supportedFormats.astc  ) { return BASIS_FORMAT.cTFASTC_4x4_RGBA;}
    else if (supportedFormats.pvrtc ) { return BASIS_FORMAT.cTFPVRTC1_4_RGBA;}
    else if (supportedFormats.etc1  ) { return BASIS_FORMAT.cTFETC1_RGB   ;}
    else  { return BASIS_FORMAT.cTFRGBA32; }
  }
  else {
    if    (supportedFormats.etc1 ) {return BASIS_FORMAT.cTFETC1_RGB   ;}
    else if (supportedFormats.bptc ) {return BASIS_FORMAT.cTFBC7_RGBA   ;}
    else if (supportedFormats.s3tc ) {return BASIS_FORMAT.cTFBC1_RGB    ;}
    else if (supportedFormats.etc2 ) {return BASIS_FORMAT.cTFETC2_RGBA  ;}
    else if (supportedFormats.astc ) {return BASIS_FORMAT.cTFASTC_4x4_RGBA;}
    else if (supportedFormats.pvrtc) {return BASIS_FORMAT.cTFPVRTC1_4_RGB ;}
    else  { return BASIS_FORMAT.cTFRGB565;}
  }
}

function transcode(id, arrayBuffer, supportedFormats, allowSeparateAlpha=false) {

  let basisData = new Uint8Array(arrayBuffer);
  let ktx2File = new KTXFile(basisData);

  if ( !ktx2File.isValid() ) {
    basisFileFail(id, ktx2File, 'invalid file');
    return;
  }

  const pbasisFormat  = ktx2File.isUASTC() ? 'UASTC_4x4' : 'ETC1S';
  const width         = ktx2File.getWidth          ();
  const height        = ktx2File.getHeight         ();
  const hasAlpha      = ktx2File.getHasAlpha       ();
  const dfdTransferFn = ktx2File.getDFDTransferFunc();
  const dfdFlags      = ktx2File.getDFDFlags       ();
  let   levels        = ktx2File.getLevels         ();

  if (!levels) {
    basisFileFail(id, ktx2File, 'Invalid Basis data');
    return;
  }

  if (!ktx2File.startTranscoding()) {
    basisFileFail(id, ktx2File, 'startTranscoding failed');
    return;
  }

  let basisFormat = resolveTextureFormat(supportedFormats, hasAlpha);
  if (basisFormat === undefined) {
    basisFileFail(id, ktx2File, 'No supported transcode formats');
    return;
  }

  let webglFormat = BASIS_WEBGL_FORMAT_MAP[basisFormat];

  // If we're not using compressed textures it'll be cheaper to generate
  // mipmaps on the fly, so only transcode a single level.
  if (webglFormat.uncompressed) {
    levels = 1;
  }

  // Gather information about each mip level to be transcoded.
  let mipLevels = [];
  let totalTranscodeSize = 0;

  for (let mipLevel = 0; mipLevel < levels; ++mipLevel) {

    const levelInfo = ktx2File.getImageLevelInfo( mipLevel, 0, 0 );
    const mipWidth = levelInfo.origWidth;
    const mipHeight = levelInfo.origHeight;
    let transcodeSize = ktx2File.getImageTranscodedSizeInBytes(mipLevel, IMAGE_INDEX, 0, basisFormat);
    
    mipLevels.push({
      level: mipLevel,
      offset: totalTranscodeSize,
      size: transcodeSize,
      width: mipWidth,
      height: mipHeight,
    });
    totalTranscodeSize += transcodeSize;
  }
  
  // Allocate a buffer large enough to hold all of the transcoded mip levels at once.
  let transcodeData = new Uint8Array(totalTranscodeSize);
  //   let alphaTranscodeData = needsSecondaryAlpha ? new Uint8Array(totalTranscodeSize) : null;

  // Transcode each mip level into the appropriate section of the overall buffer.
  for (let mipLevel of mipLevels) {
    let levelData = new Uint8Array(transcodeData.buffer, mipLevel.offset, mipLevel.size);
    if (!ktx2File.transcodeImage(levelData, mipLevel.level, 0, 0, basisFormat, 0, -1, -1)) {
      basisFileFail(id, ktx2File, 'transcodeImage failed');
      return;
    }
    // if (needsSecondaryAlpha) {
    //   let alphaLevelData = new Uint8Array(alphaTranscodeData.buffer, mipLevel.offset, mipLevel.size);
    //   if (!ktx2File.transcodeImage(alphaLevelData, IMAGE_INDEX, mipLevel.level, 0, basisFormat, 1, -1, -1)) {
    //     basisFileFail(id, ktx2File, 'alpha transcodeImage failed');
    //     return;
    //   }
    // }
  }

  ktx2File.close();
  ktx2File.delete();

  //   if (needsSecondaryAlpha) {
  //     transferList.push(alphaTranscodeData.buffer);
  //   }

  const response = {
    id: id,
    buffer: transcodeData.buffer,
    // alphaBuffer: needsSecondaryAlpha ? alphaTranscodeData.buffer : null,
    alphaBuffer: null,
    webglFormat: webglFormat,
    mipLevels: mipLevels,
    hasAlpha: hasAlpha,
  };
  
  
  postMessage(response, [transcodeData.buffer]);
}

onmessage = (msg) => {
  // Each call to the worker must contain:
  const {buffer, allowSeparateAlpha, supportedFormats, id } = msg.data;
  BASIS_INITIALIZED.then(() => {
    transcode(id, buffer, supportedFormats, allowSeparateAlpha)
  })

}