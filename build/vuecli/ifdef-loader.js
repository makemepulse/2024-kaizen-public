/**
 * pass all "VUE_APP_XXX" vars in process.env as XXX defines  to ifdef-loader
 */
const defs = {}

function parseVal(v){
  if( v === 'true' ) return true
  if( v === 'false' ) return false
  return v
}

for (const key in process.env) {
  if ( key.startsWith('VUE_APP') && Object.hasOwnProperty.call(process.env, key)) {
    const val = process.env[key];
    defs[key.substring(8)] = parseVal(val)
  }
}

const ifdefLoaderOptions = {
  ...defs,
  "ifdef-uncomment-prefix": "/// #code "
}


module.exports = ifdefLoaderOptions

function tapIfdefLoader( rule ){

  rule
    .use('ifdef-loader')
    .loader('ifdef-loader')
    .options(ifdefOpts)
    .end()
  return rule 
}
