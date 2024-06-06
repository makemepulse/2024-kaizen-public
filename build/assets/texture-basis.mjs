import fs from 'fs';
import tmp from 'tmp'
import path from 'path';
import { spawn } from 'child_process';
import { waitExit } from './gltf-transform-basis/utils.mjs';

tmp.setGracefulCleanup();

export default async function toBasis(_inputFolder, _dstFolder, _size = '1024') {
  const files = fs.readdirSync(_inputFolder);

  const promises = files.map(async (file) => {
    const inPath = _inputFolder + "/" + file;
    const [name, extension] = file.split(".");

    if (!name) return;

    const outPath = _dstFolder + "/" + name + ".ktx2";

    // RESIZE

    const tmpPath = tmp.tmpNameSync({
      tmpdir: "./tmp",
      postfix: `.${extension}`
    });
    const tmpOutPath = path.relative(process.cwd(), tmpPath);

    const resizeParams = [];

    resizeParams.push(inPath);
    resizeParams.push('-resize');
    resizeParams.push(`${_size}x${_size}`);
    resizeParams.push(tmpOutPath);

    console.log(`Resizing image → ${name} : ${_size}x${_size}`);

    const [status, stdout, stderr] = await waitExit(spawn('magick', resizeParams));

    if (status !== 0) {
      console.error(`magick: Failed → \n\n${stderr.toString()}`);
      fs.promises.unlink(tmpOutPath);
      return;
    }

    // COMPRESS

    const compressParams = [];

    compressParams.push(tmpOutPath);

    compressParams.push('-output_file');

    compressParams.push(outPath);

    const settings = [];
    settings.push('-ktx2');
    settings.push('-mipmap');
    settings.push('-q'); settings.push('255');

    console.log(`Basis compressing → ${name} : ${settings.join(' ')}`);

    const [status2, stdout2, stderr2] = await waitExit(
      spawn('basisu', [...compressParams, ...settings])
    );
    fs.promises.unlink(tmpOutPath);

    if (status2 === 0) return;

    console.error(`basisu: Failed → \n\n${stderr2.toString()}`);
  })

  await Promise.all(promises);
}