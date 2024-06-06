/**
 * User: plepers
 * Date: 16/09/15 14:22
 */

var HDR = require('hdr'),
    fs = require('fs'),
    jpeg = require( 'jpeg-js'),
    PNG  = require( 'pngjs').PNG,

    xyzUtils = require('xyz-utils');
    when = require( 'when' );

function clamp(n){
  return Math.max( 0.0, Math.min( 1.0, n ) )
}
function process( src, dest, expo, gamma ) {
  var deferred = when.defer();

  var invgamma = 1.0/gamma;

  hdrFile = fs.createReadStream( src );

  var hdrloader = new HDR.loader();

  // console.log( 'process lum hdr')

  hdrloader.on( 'error', function( code)
  {
    console.log( 'HDR loading error', code)
  })

  hdrloader.on( 'load', function()
  {
    // console.log( 'HDR loaded ')
    
    //-- this.headers  - object with header names as keys
    //-- this.comments - array with any comment headers
    //-- this.width    - image width in pixels
    //-- this.height   - image height in pixels
    //-- this.data     - Float32Array of pixel colors with length = width*height*3
    //--                 in non-planar [X, Y, Z, X, Y, Z, ...] pixel layout

    var w = this.width,
        h = this.height,
        fdata = this.data,
        npix = w*h;

    var ldata = new Uint8Array( npix * 4 )
    var xyz = [.0,.0,.0]
    var rgb = [.0,.0,.0]
    for( var i = 0; i<npix; i++ ){

      xyz[0] = fdata[i*3+0]
      xyz[1] = fdata[i*3+1]
      xyz[2] = fdata[i*3+2]

      xyzUtils.toRGB( xyz, rgb )

      var lr = expo * Math.pow( rgb[0], invgamma );
      var lg = expo * Math.pow( rgb[1], invgamma );
      var lb = expo * Math.pow( rgb[2], invgamma );

      ldata[i*4+0] = clamp(lr) * 0xFF;
      ldata[i*4+1] = clamp(lg) * 0xFF;
      ldata[i*4+2] = clamp(lb) * 0xFF;
      ldata[i*4+3] = 0xFF;
    }



    var binaryOutput;

    if( false ) {
      var rawImageData = {
        data: ldata,
        width: w,
        height: h
      };
      var jpegBin = jpeg.encode(rawImageData, 100);
      binaryOutput = jpegBin.data;
    }
    else {
      var png = new PNG({
        width : w,
        height : h
      });
      png.data = ldata;
      binaryOutput = PNG.sync.write(png, { colorType: 6 });
    }


    fs.writeFile( dest, binaryOutput, function(err){
      if(err)
        deferred.reject( err )
      deferred.resolve()
    })


  });

  //-- Start piping in image data from filesystem/http request/ect.:
  hdrFile.pipe(hdrloader);

  return deferred.promise;
}


module.exports = process;


