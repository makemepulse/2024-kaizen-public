const validate = require('schema-utils');
const fs = require('fs');

// schema for options object
const schema = {
  type: 'object',
  properties: {
    output: {
      type: "string"
    },
  },
  additionalProperties: false
}


const TapId = "GenerateAssetsIds"
const RequestToMatch = "@/assets/webgl/"

function isTexture(fileInfos) {
  const ext = fileInfos.ext
  return ext === 'jpg' || ext === 'png' || ext === 'webp'
}

function parsePath(initialPath) {

  initialPath    = initialPath.substring(2, initialPath.length)
  const sep      = initialPath.lastIndexOf('/')
  const group    = initialPath.substring(0, sep)
  const filename = initialPath.substring(sep + 1, initialPath.length)

  const regexp = /^([^.]+)\.(\w+)(\.(.*))?/
  const r = regexp.exec(filename)

  const lodexp = /(.+)_LOD(\d)/
  const l = lodexp.exec(r[1])

  const name = l ? l[1] : r[1]
  const lod = l ? parseInt(l[2]) : 0
  const ext = r[2]
  const meta = r[4]

  return {
    initialPath,
    group,
    name,
    ext,
    meta,
    lod,
  }

}

function resolveAssetsIds(assets) {
  const ids = assets.map(e => e.name)
  ids.sort((a, b) => a.localeCompare(b))
  return Array.from(new Set(ids).values())
}

function resolveAssetsPaths(assets) {
  const ids = assets.map(e => e.initialPath )
  ids.sort((a, b) => a.localeCompare(b))
  return Array.from(new Set(ids).values())
}

function genStringEnum(type, names) {
  if (names.length === 0) return `export type ${type} = "";\n\n`
  return `export type ${type} = 
${names.map(n => `  "${n}"`).join(' | \n')}
;\n\n`
}


class GenerateAssetsIds {

  constructor(options = {}) {
    validate(schema, options, {});
    this.options = options
  }

  apply(compiler) {
    const files = []

    compiler.hooks.contextModuleFactory.tap(TapId, (f) => {
      f.hooks.alternativeRequests.tap(TapId, (requests, data) => {
        if (data.request === RequestToMatch) {
          files.push(...requests.map(r => r.request))
        }
      })
    })

    compiler.hooks.run.tap(TapId, () => {
      files.length = 0
    })

    compiler.hooks.watchRun.tap(TapId, () => {
      files.length = 0
    })

    compiler.hooks.done.tap(TapId, () => {

      if (files.length) {
        const entries = files.map(parsePath)

        const textures = entries.filter(e => isTexture(e)).filter(e => !e.initialPath.includes("archives") && !e.initialPath.includes("brushes") && !e.initialPath.includes("transitions"))
        const others = entries.filter(e => !isTexture(e)).filter(e => !e.initialPath.includes("archives") && !e.initialPath.includes("brushes") && !e.initialPath.includes("transitions"))

        const TextureNameType = genStringEnum("TextureName", resolveAssetsIds(textures) );
        const TexturePathType = genStringEnum("TexturePath", resolveAssetsPaths(textures) );

        const OtherNameType = genStringEnum("OtherAssetName", resolveAssetsIds(others) );
        const OtherPathType = genStringEnum("OtherAssetPath", resolveAssetsPaths(others) );

        const outputString = `
${TextureNameType}
${TexturePathType}
${OtherNameType}
${OtherPathType}
export type AssetName = TextureName | OtherAssetName;
export type AssetPath = TexturePath | OtherAssetPath;
`
        const actual = fs.readFileSync(this.options.output, 'utf8')
        if( actual !== outputString ) {
          fs.writeFileSync(this.options.output, outputString, "utf8");
        }
      }
    })


  }
}

module.exports = GenerateAssetsIds;