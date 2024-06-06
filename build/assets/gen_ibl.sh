#! /bin/sh


# genIbl path/to/exr/file.exr outname
# ================================== 
genIbl(){

  local HDR_SRCPATH=$1
  local OUTDIR=$2

  # basename "$HDR_SRCPATH"
  f="$(basename -- $HDR_SRCPATH)"
  echo "$f"

  local NAME="${f%.*}"

  echo "generating IBL for $HDR_SRCPATH, name: $NAME"


  cmgen -s 1024 --ibl-samples 256 --ibl-min-lod-size 8 --type splitocta --format rgbm --ibl-ld $TMPDIR $HDR_SRCPATH
  for filename in $TMPDIR/$NAME/*.rgbm; do mv "$filename" "${filename}.png"; done;
  magick mogrify -resize 512x256! $TMPDIR/$NAME/*.png
  magick montage $TMPDIR/$NAME/m[0-7].rgbm.png -tile 1x8 -geometry 512x256+0+0 -background none $TMPDIR/$NAME/octa.rgbm.png
  rm $TMPDIR/$NAME/m*.rgbm.png

  cmgen --format rgbm --ibl-min-lod-size 16 --sh-shader --sh-output $TMPDIR/$NAME/sh.txt --ibl-ld $TMPDIR $HDR_SRCPATH
  for filename in $TMPDIR/$NAME/m*.rgbm; do mv "$filename" "${filename}.png"; done;

  magick $TMPDIR/$NAME/*.rgbm.png -set filename:fn "%t" -format webp -quality 90 -define webp:lossless=false -define webp:alpha-compression=1 -define webp:alpha-quality=100 +adjoin "webp:$TMPDIR/$NAME/%[filename:fn].png.webp"

  mkdir $OUTDIR
  mv $TMPDIR/$NAME/* $OUTDIR

}

cubemap(){

  local QUALITY=100
  local FORMATS="jpg,webp"

  while test $# -gt 0; do
    case "$1" in
      -i|--input)   SRCPATH=$2     shift ;;
      -o|--out)     OUTPUT=$2      shift ;;
      -f|--formats) FORMATS=$2     shift ;;
      -q|--quality) QUALITY=$2     shift ;;
      *) shift ;;
    esac
  done




  mkdir $OUTPUT

  PVRTexToolCLI -equi2cube cubic -flip x -o $TMPDIR/tmp.ktx -i $SRCPATH -f r8g8b8,UBN,lRGB -d $TMPDIR/faces.png


  WEBP_OPTS="-define webp:lossless=false -define webp:alpha-compression=0"

  # JPG
  if [[ $FORMATS == *"jpg"* ]]; then
    printf 'jpg'
    printf $OUTPUT/nx.jpg
    convert -quality $QUALITY -format JPG $TMPDIR/faces.png $OUTPUT/nx.jpg
    convert -quality $QUALITY -format JPG $TMPDIR/faces-Face_1.png $OUTPUT/px.jpg
    convert -quality $QUALITY -format JPG $TMPDIR/faces-Face_2.png $OUTPUT/py.jpg
    convert -quality $QUALITY -format JPG $TMPDIR/faces-Face_3.png $OUTPUT/ny.jpg
    convert -quality $QUALITY -format JPG $TMPDIR/faces-Face_4.png $OUTPUT/pz.jpg
    convert -quality $QUALITY -format JPG $TMPDIR/faces-Face_5.png $OUTPUT/nz.jpg
    printf ' ✓ '
  fi

  # WEBP
  if [[ $FORMATS == *"webp"* ]]; then
    printf 'webp'
    magick $TMPDIR/faces.png -quality $QUALITY $WEBP_OPTS $OUTPUT/nx.webp
    magick $TMPDIR/faces-Face_1.png -quality $QUALITY $WEBP_OPTS $OUTPUT/px.webp
    magick $TMPDIR/faces-Face_2.png -quality $QUALITY $WEBP_OPTS $OUTPUT/py.webp
    magick $TMPDIR/faces-Face_3.png -quality $QUALITY $WEBP_OPTS $OUTPUT/ny.webp
    magick $TMPDIR/faces-Face_4.png -quality $QUALITY $WEBP_OPTS $OUTPUT/pz.webp
    magick $TMPDIR/faces-Face_5.png -quality $QUALITY $WEBP_OPTS $OUTPUT/nz.webp
    printf ' ✓ '
  fi
  
  # PVRTC 4BPP
  if [[ $FORMATS == *"pvr"* ]]; then
    printf 'pvr'
    PVRTexToolCLI -equi2cube cubic -q $PVRQUALITY  -o $OUTPUT/cubemap.pvr.ktx  -i $SRCPATH -f PVRTCI_4BPP_RGB,UBN,lRGB -ics lRGB
    printf ' ✓ '
  fi
  
  # ETC1
  if [[ $FORMATS == *"etc"* ]]; then
    printf 'etc'
    PVRTexToolCLI -equi2cube cubic -q $ETCQUALITY  -o $OUTPUT/cubemap.etc.ktx  -i $SRCPATH -f ETC1,UBN,lRGB -ics lRGB
    printf ' ✓ '
  fi

  # ASTC
  if [[ $FORMATS == *"astc"* ]]; then
    printf 'astc'
    PVRTexToolCLI -equi2cube cubic -q $ASTCQUALITY -o $OUTPUT/cubemap.astc.ktx -i $SRCPATH -f ASTC_4x4,UBN,lRGB -ics lRGB
    printf ' ✓ '
  fi
  
  # DXT1
  if [[ $FORMATS == *"dxt"* ]]; then
    printf 'dxt'
    PVRTexToolCLI -equi2cube cubic -q $PVRQUALITY  -o $OUTPUT/cubemap.dxt.ktx  -i $SRCPATH -f BC3,UBN,lRGB -ics lRGB
    printf ' ✓ '
  fi

  # BASIS
  # if [[ $FORMATS == *"basis"* ]]; then
  #   printf 'basis'
  #   printf ' ✓ '
  # fi
  




}


echo "done"
