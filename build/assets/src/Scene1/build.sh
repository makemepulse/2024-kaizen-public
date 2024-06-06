source ./build/assets/config.sh
source ./build/assets/common.sh

SRCDIR=./build/assets/src/Scene1/out
OUTDIR=./src/assets/webgl/scene1
OUTDIRDANDELION=./src/assets/webgl/dandelion
OUTDIRBUTTERFLY=./src/assets/webgl/butterfly


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

$gltfOptim $SRCDIR/scene1.gltf $OUTDIR/scene1.gltf 512
$gltfOptim $SRCDIR/clouds.gltf $OUTDIR/clouds.gltf 512
$gltfOptim $SRCDIR/dandelion.gltf $OUTDIRDANDELION/dandelion.gltf 1024
$gltfOptim $SRCDIR/butterfly3.gltf $OUTDIRBUTTERFLY/butterfly3.gltf 512