
import { NodeIO } from '@gltf-transform/core';
import basis from './gltf-transform-basis/basis.mjs';
import sharp from "sharp";
import { textureCompress } from '@gltf-transform/functions';
import { KHRMaterialsUnlit, KHRTextureBasisu, EXTTextureWebP } from '@gltf-transform/extensions';

export default async function optim(_input, _output, _size = 512) {
  const io = new NodeIO();
  _size = Number(_size);

  io.registerExtensions([KHRMaterialsUnlit, KHRTextureBasisu, EXTTextureWebP]);

  const document = await io.read(_input);

  console.log("Texture size : ", _size);
  await document.transform(
    textureCompress({
      encoder: sharp,
      targetFormat: 'png',
      resize: [_size, _size],
      quality: 100,
      lossless: true,
      effort: 100
    }),
    basis({
      slots: [
        'occlusionTexture',
        'baseColorTexture',
        'emissiveTexture',
        'metallicRoughnessTexture'
      ]
    }),

  );

  await io.write(_output, document);
}