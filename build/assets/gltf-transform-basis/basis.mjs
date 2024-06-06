import pLimit from 'p-limit';
import micromatch from 'micromatch';
import tmp from 'tmp'
import fs from 'fs/promises'

import { spawn } from 'child_process';

import { KHRTextureBasisu } from '@gltf-transform/extensions';
import { getTextureChannelMask, listTextureInfo, listTextureSlots } from '@gltf-transform/functions';
import { FileUtils, ImageUtils } from '@gltf-transform/core';
import { formatBytes, waitExit } from './utils.mjs';
import path from 'path';

const MICROMATCH_OPTIONS = { nocase: true, contains: true };

const DEFAULT_OPTIONS = {
  jobs: 1,
  slots: '*'
}

const R = 4096
const G = 256
const B = 16
const A = 1

const LINEAR_MIPMAP_LINEAR = 9987;

tmp.setGracefulCleanup();
const basis = function (options) {

  options = {
    ...DEFAULT_OPTIONS,
    ...options
  };

  return async doc => {
    const logger = doc.getLogger();

    const basisuExtension = doc.createExtension(KHRTextureBasisu).setRequired(true);

    let numCompressed = 0;
    const limit = pLimit(options.jobs);
    const textures = doc.getRoot().listTextures();
    const numTextures = textures.length;
    const promises = textures.map((texture, textureIndex) => limit(async () => {
      const slots = listTextureSlots(texture);
      const channels = getTextureChannelMask(texture);
      const textureLabel = texture.getURI() || texture.getName() || `${textureIndex + 1}/${doc.getRoot().listTextures().length}`;
      const prefix = `toktx:texture(${textureLabel})`;
      logger.debug(`${prefix}: Slots → [${slots.join(', ')}]`); // FILTER: Exclude textures that don't match (a) 'slots' or (b) expected formats.

      if (texture.getMimeType() === 'image/ktx2') {
        logger.debug(`${prefix}: Skipping, already KTX.`);
        return;
      }
      else if (texture.getMimeType() !== 'image/png' && texture.getMimeType() !== 'image/jpeg') {
        logger.warn(`${prefix}: Skipping, unsupported texture type "${texture.getMimeType()}".`);
        return;
      }
      else if (options.slots !== '*' && !slots.find(slot => micromatch.isMatch(slot, options.slots, MICROMATCH_OPTIONS))) {
        logger.debug(`${prefix}: Skipping, excluded by pattern "${options.slots}".`);
        return;
      }

      const image = texture.getImage();
      const size = texture.getSize();

      if (!image || !size) {
        logger.warn(`${prefix}: Skipping, unreadable texture.`);
        return;
      } // PREPARE: Create temporary in/out paths for the 'toktx' CLI tool, and determine
      // necessary commandline flags.


      const extension = texture.getURI() ? FileUtils.extension(texture.getURI()) : ImageUtils.mimeTypeToExtension(texture.getMimeType());
      const tmpInPath = tmp.tmpNameSync({
        tmpdir: "./tmp",
        postfix: '.' + extension
      });
      const tmpOutPath = tmp.tmpNameSync({
        tmpdir: "./tmp",
        postfix: '.ktx2'
      });

      const inPath = path.relative(process.cwd(), tmpInPath)
      const outPath = path.relative(process.cwd(), tmpOutPath)

      const inBytes = image.byteLength;
      await fs.writeFile(inPath, Buffer.from(image));
      const settings = createParams(slots, channels, size, logger, numTextures, options);
      const params = [inPath, '-output_file', outPath, ...settings];
      console.log(`Basis compressing → ${texture.getName()} : ${settings.join(' ')}`)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars

      const [status, stdout, stderr] = await waitExit(spawn('basisu', params));
      if (status !== 0) {
        logger.error(`${prefix}: Failed → \n\n${stderr.toString()}`);
      } else {
        // PACK: Replace image data in the glTF asset.
        texture.setImage(await fs.readFile(outPath)).setMimeType('image/ktx2');

        if (texture.getURI()) {
          texture.setURI(FileUtils.basename(texture.getURI()) + '.ktx2');
        }

        // set default minFilter
        const infos = listTextureInfo(texture);
        for (let i = 0; i < infos.length; i++) {
          const info = infos[i];
          if (!info.getMinFilter()) {
            info.setMinFilter(LINEAR_MIPMAP_LINEAR);
          }
        }

        fs.unlink(inPath)
        fs.unlink(outPath)
        numCompressed++;
      }

      const outBytes = texture.getImage().byteLength;
      logger.debug(`${prefix}: ${formatBytes(inBytes)} → ${formatBytes(outBytes)} bytes`);
    }));
    await Promise.all(promises);

    if (numCompressed === 0) {
      logger.warn('toktx: No textures were found, or none were selected for compression.');
    }

    const usesKTX2 = doc.getRoot().listTextures().some(t => t.getMimeType() === 'image/ktx2');

    if (!usesKTX2) {
      basisuExtension.dispose();
    }
  };
};
/**********************************************************************************************
 * Utilities.
 */

/** Create CLI parameters from the given options. Attempts to write only non-default options. */

function createParams(slots, channels, size, logger, numTextures, options) {
  const params = [];
  params.push('-ktx2');

  // params.push('-uastc');
  params.push('-mipmap');
  params.push('-q'); params.push('255');

  if (slots.find(slot => micromatch.isMatch(slot, '*normal*', MICROMATCH_OPTIONS))) {
    params.push('-normal_map');
    params.push('-uastc_level'); params.push('4');
  }

  // if (slots.length && !slots.find(slot => micromatch.isMatch(slot, '*{color,emissive}*', MICROMATCH_OPTIONS))) {
  //   // See: https://github.com/donmccurdy/glTF-Transform/issues/215
  //   params.push('--assign_oetf', 'linear', '--assign_primaries', 'none');
  // }

  // if (channels === R) {
  //   params.push('--target_type', 'R');
  // } else if (channels === G || channels === (R | G)) {
  //   params.push('--target_type', 'RG');
  // } // Minimum size on any dimension is 4px.
  // See: https://github.com/donmccurdy/glTF-Transform/issues/502


  let width;
  let height;

  if (options.powerOfTwo) {
    width = preferredPowerOfTwo(size[0]);
    height = preferredPowerOfTwo(size[1]);
  } else {
    if (!isPowerOfTwo(size[0]) || !isPowerOfTwo(size[1])) {
      logger.warn(`basisu: Texture dimensions ${size[0]}x${size[1]} are NPOT, and may` + ' fail in older APIs (including WebGL 1.0) on certain devices.');
    }

    width = isMultipleOfFour(size[0]) ? size[0] : ceilMultipleOfFour(size[0]);
    height = isMultipleOfFour(size[1]) ? size[1] : ceilMultipleOfFour(size[1]);
  }

  if (width !== size[0] || height !== size[1]) {
    if (width > 4096 || height > 4096) {
      logger.warn(`basisu: Resizing to nearest power of two, ${width}x${height}px. Texture dimensions` + ' greater than 4096px may not render on some mobile devices.' + ' Resize to a lower resolution before compressing, if needed.');
    }

    params.push('-resample', `${width}x${height}`);
  }


  return params;
}



function isPowerOfTwo(value) {
  if (value <= 2) return true;
  return (value & value - 1) === 0 && value !== 0;
}

function preferredPowerOfTwo(value) {
  if (value <= 4) return 4;
  const lo = floorPowerOfTwo(value);
  const hi = ceilPowerOfTwo(value);
  if (hi - value > value - lo) return lo;
  return hi;
}

function floorPowerOfTwo(value) {
  return Math.pow(2, Math.floor(Math.log(value) / Math.LN2));
}

function ceilPowerOfTwo(value) {
  return Math.pow(2, Math.ceil(Math.log(value) / Math.LN2));
}

function isMultipleOfFour(value) {
  return value % 4 === 0;
}

function ceilMultipleOfFour(value) {
  if (value <= 4) return 4;
  return value % 4 ? value + 4 - value % 4 : value;
}

export default basis