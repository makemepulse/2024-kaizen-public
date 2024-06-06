source ./build/assets/config.sh
source ./build/assets/common.sh

SRCDIR=./build/assets/src/scene2/out
OUTDIR=./src/assets/webgl/scene2


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

# $gltfOptim $SRCDIR/ring.glb $OUTDIR/ring.glb 2048
# $gltfOptim $SRCDIR/clouds.glb $OUTDIR/clouds.glb 2048
# $gltfOptim $SRCDIR/Fish.gltf $OUTDIR/Fish.gltf 2048
# $gltfOptim $SRCDIR/foam.glb $OUTDIR/foam.glb 2048
# $gltfOptim $SRCDIR/lily.glb $OUTDIR/lily.glb 512
# $gltfOptim $SRCDIR/nenupharSpawnPoints.gltf $OUTDIR/nenupharSpawnPoints.gltf 2048
$gltfOptim $SRCDIR/reeds.glb $OUTDIR/reeds.glb 512
# $gltfOptim $SRCDIR/ring.glb $OUTDIR/ring.glb 2048
# $gltfOptim $SRCDIR/ripple.gltf $OUTDIR/ripple.gltf 2048
# $gltfOptim $SRCDIR/rock_1.gltf $OUTDIR/rock_1.gltf 2048
# $gltfOptim $SRCDIR/rocks_positions.gltf $OUTDIR/rocks_positions.gltf 2048
$gltfOptim $SRCDIR/rocks.glb $OUTDIR/rocks.glb 512
# $gltfOptim $SRCDIR/sphere.glb $OUTDIR/sphere.glb 2048
# $gltfOptim $SRCDIR/Water_02.glb $OUTDIR/Water_02.glb 2048
# $gltfOptim $SRCDIR/waterdrop.glb $OUTDIR/waterdrop.glb 2048
$gltfOptim $SRCDIR/Fish.gltf $OUTDIR/Fish.gltf 512
$gltfOptim $SRCDIR/splash.glb $OUTDIR/splash.glb 512