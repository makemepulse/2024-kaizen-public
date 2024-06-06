source ./build/assets/config.sh
source ./build/assets/common.sh

SRCDIR=./build/assets/src/scene4/out
OUTDIR=./src/assets/webgl/scene4


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

# $gltfOptim $SRCDIR/clouds_01.gltf $OUTDIR/clouds_01.gltf 512
# $gltfOptim $SRCDIR/clouds_02.gltf $OUTDIR/clouds_02.gltf 512
$gltfOptim $SRCDIR/crane.gltf $OUTDIR/crane.gltf 512
$gltfOptim $SRCDIR/crane_2.gltf $OUTDIR/crane_2.gltf 512