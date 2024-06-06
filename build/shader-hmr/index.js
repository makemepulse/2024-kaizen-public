// const utils = require( 'loader-utils' );

module.exports = function loader(source) {
  // const options = utils.getOptions(this);


  source += `
/// #if DEBUG

fn._hmrListeners = []
fn.onHmr = function(l){
  this._hmrListeners.push( l )
}
fn._triggerHmr = function(){
  for (const l of this._hmrListeners) {
    l( this )
  }
}

if( module.hot ){
  if( module.hot.data && module.hot.data._hmrListeners ){
    fn._hmrListeners = module.hot.data._hmrListeners;
    console.log('Shader updated ', module.id );
    fn._triggerHmr()
  }
  
  // if module is updated but update are not handled
  // so if it's a dependency, the parent glsl module will trigger an HMR update
  if( module.hot.data && module.hot.data._hmrListeners && module.hot.data._hmrListeners.length === 0 ){
    module.hot.invalidate();

  } else {
  
    module.hot.dispose(data => {
      data._hmrListeners = fn._hmrListeners;
    });
    
    module.hot.accept(
      function(e){ console.log( e );} // Function to handle errors when evaluating the new version
      );
    }
  }

/// #else
fn.onHmr = function(){}
/// #endif
`
    
  return source;
}