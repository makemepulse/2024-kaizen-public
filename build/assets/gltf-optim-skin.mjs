import { NodeIO } from '@gltf-transform/core';
import { merge } from '@gltf-transform/cli';
import splitmesh from './gltf-transform-splitmesh/index.mjs';
import { prune } from '@gltf-transform/functions';
import skinop from './gltf-transform-skinopt/index.mjs';

export default async function optim(_input, _output) {
  const io = new NodeIO();
  const document = await io.read(_input);
  await document.transform(
    splitmesh(),
    skinop(),
    prune(),
    // merge({
    //   io,
    //   paths: [_input.replace('.gltf', '_hierarchy.gltf')],
    //   partition: false,
    //   mergeScenes: false
    // })
  );
  await io.write(_output, document);
}

