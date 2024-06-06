
#!/bin/sh

INPUT=$1
OUTPUT_FOLDER=$2
SIZE=$3
TMPDIR=./tmp

source ./build/config.sh

echo $OUTPUT_FOLDER

mkdir $OUTPUT_FOLDER


cmft --input $INPUT \
     --outputNum 1 \
     --dstFaceSize $SIZE \
     --output0 $TMPDIR/cube \
     --output0params tga,bgr8,facelist

mogrify -flip -flop $TMPDIR/cube_posy.tga
mogrify -flip -flop $TMPDIR/cube_negy.tga

# .pvr
PVRTexToolCLI -cube -legacypvr -q $PVRQUALITY -f PVRTC1_2_RGB,UBN,lRGB -o $OUTPUT_FOLDER/tex.pvr -i \
$TMPDIR/cube_posx.tga,\
$TMPDIR/cube_negx.tga,\
$TMPDIR/cube_posy.tga,\
$TMPDIR/cube_negy.tga,\
$TMPDIR/cube_posz.tga \
$TMPDIR/cube_negz.tga,\


# .ktx
PVRTexToolCLI  -cube -q $ETCQUALITY -f ETC1,UBN,lRGB -o $OUTPUT_FOLDER/tex.ktx -i \
$TMPDIR/cube_posx.tga,\
$TMPDIR/cube_negx.tga,\
$TMPDIR/cube_posy.tga,\
$TMPDIR/cube_negy.tga,\
$TMPDIR/cube_posz.tga \
$TMPDIR/cube_negz.tga,\

# .jpg
convert $TMPDIR/cube_negx.tga $OUTPUT_FOLDER/negx.jpg
convert $TMPDIR/cube_negy.tga $OUTPUT_FOLDER/posy.jpg
convert $TMPDIR/cube_negz.tga $OUTPUT_FOLDER/negz.jpg
convert $TMPDIR/cube_posx.tga $OUTPUT_FOLDER/posx.jpg
convert $TMPDIR/cube_posy.tga $OUTPUT_FOLDER/negy.jpg
convert $TMPDIR/cube_posz.tga $OUTPUT_FOLDER/posz.jpg

# .dds
nvassemble -cube \
  $TMPDIR/cube_negx.tga \
  $TMPDIR/cube_posy.tga \
  $TMPDIR/cube_negz.tga \
  $TMPDIR/cube_posx.tga \
  $TMPDIR/cube_negy.tga \
  $TMPDIR/cube_posz.tga \
  -o $OUTPUT_FOLDER/tex.jpg.dds



rm -rf $TMPDIR/cube_*.tga

nvcompress -nomips -bc1 $OUTPUT_FOLDER/tex.jpg.dds $OUTPUT_FOLDER/tex.dds
rm -rf $OUTPUT_FOLDER/tex.jpg.dds