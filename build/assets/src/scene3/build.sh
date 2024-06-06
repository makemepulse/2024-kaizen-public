source ./build/assets/config.sh
source ./build/assets/common.sh

SRCDIR=./build/assets/src/scene3/out
OUTDIR=./src/assets/webgl/scene3


resize(){
  local SIZE=$1
  local INPUT=$SRCDIR/$2
  magick mogrify -resize $SIZE $INPUT
}

webp(){
  local INPUT=$SRCDIR/$1
  magick $INPUT -quality 90 -define webp:lossless=false -define webp:alpha-compression=1 -define webp:alpha-quality=100 $INPUT.webp
  cp -a  $INPUT.webp $OUTDIR/$1.webp
}

$gltfOptim $SRCDIR/rocks.gltf $OUTDIR/rocks.gltf 512
$gltfOptim $SRCDIR/lilypads.gltf $OUTDIR/lilypads.gltf 512
$gltfOptim $SRCDIR/water.gltf $OUTDIR/water.gltf 512
$gltfOptim $SRCDIR/clouds.gltf $OUTDIR/clouds.gltf 512
$gltfOptim $SRCDIR/frog.gltf $OUTDIR/frog.gltf 512
$textureBasis $SRCDIR/tex-basis $OUTDIR 512