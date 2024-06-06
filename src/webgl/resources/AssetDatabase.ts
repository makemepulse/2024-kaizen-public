import type { GLContext } from "nanogl/types";
import type {
  ITextureRequest,
  ITextureOptions,
  ITextureRequestSource,
} from "./TextureRequest";
import { TextureResource } from "./TextureResource";

/// #if GENERATE_ASSETS_IDS
import {
  AssetName,
  AssetPath,
  TextureName,
  TexturePath,
} from "./AssetsIdentifiers";
export type AssetIdent = AssetName | AssetPath;
export type TextureIdent = TextureName | TexturePath;
/// #else
/// #code export type AssetIdent = string
/// #code export type TextureIdent = string
/// #endif

type FileInfos = {
  initialPath: string;
  path: string;
  group: string;
  name: string;
  ext: string;
  meta?: string;
  lod: number;
};

function getFileContext() {
  return require.context("@/assets/webgl/", true, /.*/i);
}

const _files = getFileContext();
const _contextId = _files.id;

const _assetsByPath: Map<string, FileInfos> = new Map();
const _assetsByName: Map<string, FileInfos> = new Map();
const _assets: FileInfos[] = [];
const _textures: Map<string, TextureAsset> = new Map();

function parsePath(initialPath: string, path: string): FileInfos {
  initialPath = initialPath.substring(2, initialPath.length);
  const sep = initialPath.lastIndexOf("/");
  const group = initialPath.substring(0, sep);
  const filename = initialPath.substring(sep + 1, initialPath.length);

  const regexp = /^([^.]+)\.(\w+)(\.(.*))?/;
  const r = regexp.exec(filename);

  const lodexp = /(.+)_LOD(\d)/;
  const l = lodexp.exec(r[1]);

  const name = l ? l[1] : r[1];
  const lod = l ? parseInt(l[2]) : 0;
  const ext = r[2];
  const meta = r[4];

  // console.log( filename, lod, r)
  return {
    initialPath,
    path,
    group,
    name,
    ext,
    meta,
    lod,
  };
}

const CODECS_PRIORITY: Record<string, number> = {
  astc: 0,
  pvr: 1,
  dxt: 1,
  etc: 1,
  basis: 2,
  webp: 3,
  std: 4,
};

function getTextureCodec(fileInfos: FileInfos): string {
  switch (fileInfos.meta) {
    case "astc.ktx":
      return "astc";
    case "pvr.ktx":
      return "pvr";
    case "dxt.ktx":
      return "dxt";
    case "etc.ktx":
      return "etc";
    case "basis.ktx2":
      return "basis";
    case "webp":
      return "webp";
    case undefined:
      return "std";
  }
  throw new Error("unsupported file " + fileInfos.initialPath);
}

function sortTexSources(
  sa: ITextureRequestSource,
  sb: ITextureRequestSource
): number {
  return CODECS_PRIORITY[sa.codec] - CODECS_PRIORITY[sb.codec];
}

class TextureAsset implements ITextureRequest {
  options: ITextureOptions;
  sources: ITextureRequestSource[] = [];

  /// #if DEBUG
  _resources: TextureResource[] = [];
  /// #endif

  addSource(fileInfos: FileInfos) {
    const codec = getTextureCodec(fileInfos);
    let requestSource = this.sources.find((s) => s.codec === codec);

    if (!requestSource) {
      requestSource = {
        codec,
        lods: [],
      };
      this.sources.push(requestSource);
    }

    requestSource.lods[fileInfos.lod] = { files: [fileInfos.path] };

    this.sources.sort(sortTexSources);
  }
}

function isTexture(fileInfos: FileInfos) {
  const ext = fileInfos.ext;
  return ext === "jpg" || ext === "png" || ext === "webp";
}

function handleFile(initialPath: string, path: string) {
  const fileInfos = parsePath(initialPath, path);
  _assets.push(fileInfos);
  _assetsByPath.set(fileInfos.initialPath, fileInfos);
  _assetsByName.set(fileInfos.name, fileInfos);
  if (isTexture(fileInfos)) {
    handleTexture(fileInfos);
  }
}

function handleTexture(fileInfos: FileInfos) {
  const resId = fileInfos.group + "/" + fileInfos.name;
  let tex = _textures.get(resId);
  if (!tex) {
    tex = new TextureAsset();
    _textures.set(resId, tex);
  }
  tex.addSource(fileInfos);
}

function getAssetInfos(filenameOrName: AssetIdent | string): FileInfos {
  let res = _assetsByPath.get(filenameOrName);
  if (!res) {
    res = _assetsByName.get(filenameOrName);
    if (!res) {
      console.error(`can't find asset ${filenameOrName}`);
    }
  }
  return res;
}

export default class AssetDatabase {
  static getAssets(): FileInfos[] {
    return _assets.concat();
  }

  static getAssetPath(filename: AssetIdent): string;
  static getAssetPath(filename: string): string;
  static getAssetPath(filename: AssetIdent | string): string {
    return getAssetInfos(filename).path;
  }

  static getTexture(
    filename: TextureIdent,
    gl: GLContext,
    options?: Partial<ITextureOptions>
  ): TextureResource;
  static getTexture(
    filename: string,
    gl: GLContext,
    options?: Partial<ITextureOptions>
  ): TextureResource;
  static getTexture(
    filename: TextureIdent | string,
    gl: GLContext,
    options?: Partial<ITextureOptions>
  ): TextureResource {
    const infos = getAssetInfos(filename);
    const res = _textures.get(infos.group + "/" + infos.name);
    if (!res) {
      console.error(`can't find texture ${filename}`);
    }

    const tr = new TextureResource(res, gl, options);

    /// #if DEBUG
    res._resources.push(tr);
    /// #endif

    return tr;
  }

  /**
   * Debug only, print informations on assets available in WebglAssets
   */
  static printAssets(): void {
    /// #if DEBUG
    const tables: Record<string, FileInfos> = {};
    for (const asset of _assets) {
      tables[asset.name] = asset;
    }
    console.table(_assets);
    console.log(_assetsByPath.keys());
    /// #endif
  }
}

const deps: string[] = [];

_files.keys().filter(f => !f.includes("archives") && !f.includes("brushes") && !f.includes("transitions") && !f.includes("scene1") && !f.includes("scene2") && !f.includes("scene4")).forEach((k) => {
  deps.push(k);
  handleFile(k, _files(k).default);
});

// validate Texture Sources
// check if lods are missing
for (const tex of _textures.values()) {
  tex.sources.forEach((s) => {
    if (s.lods.includes(undefined)) {
      console.error(`texture has missing lods`, s.lods);
    }
  });
}

export function handlerest() {
  _files.keys().filter(f =>
    f.includes("archives") ||
    f.includes("brushes") ||
    f.includes("transitions") ||
    f.includes("scene1") ||
    f.includes("scene2") ||
    f.includes("scene4")).forEach((k) => {
      deps.push(k);
      handleFile(k, _files(k).default);
    });

  // validate Texture Sources
  // check if lods are missing
  for (const tex of _textures.values()) {
    tex.sources.forEach((s) => {
      if (s.lods.includes(undefined)) {
        console.error(`texture has missing lods`, s.lods);
      }
    });
  }
}

// console.log(_assetsByName);
// console.log( Array.from(_assetsByName.values()).map(i=>i.initialPath) )

// =============================================================================
//                  ==============  HMR  ================
// =============================================================================

/// #if DEBUG

const _texToReload = new Set<TextureResource>();
let _texReloadTimeout: number;
function scheduleTextureReload(r: TextureResource[]) {
  r.forEach((t) => _texToReload.add(t));
  clearTimeout(_texReloadTimeout);
  _texReloadTimeout = setTimeout(() => {
    _texToReload.forEach(reloadTexture);
    _texToReload.clear();
  }, 10);
}

function reloadTexture(t: TextureResource) {
  t.request.sources = t.request.sources.filter((s) => s.codec === "std");
  t.doLoad();
}

function handleTextureUpdate(asset: TextureAsset, fileInfos: FileInfos) {
  //const codec = getTextureCodec( fileInfos )
  // reload only jpg
  const codec = "std"; //getTextureCodec( fileInfos )
  const source = asset.sources.find((s) => s.codec === codec);
  source.lods[0].files[0] = fileInfos.path;
  scheduleTextureReload(asset._resources);
}

function handleFileUpdate(initialPath: string, path: string) {
  const fileInfos = parsePath(initialPath, path);
  if (!_assetsByPath.has(fileInfos.initialPath)) {
    console.error("asset update on non existing asset ", fileInfos.initialPath);
  }
  if (_assetsByPath.get(fileInfos.initialPath).path !== fileInfos.path) {
    console.log("asset " + fileInfos.initialPath + " has changed");
    if (isTexture(fileInfos)) {
      handleTextureUpdate(
        _textures.get(fileInfos.group + "/" + fileInfos.name),
        fileInfos
      );
    }
  }
}

if (module.hot) {
  module.hot.accept([_contextId], () => {
    const reloadedFiles = getFileContext();
    reloadedFiles.keys().forEach((k) => {
      handleFileUpdate(k, reloadedFiles(k).default);
    });
  });
}

/// #endif
