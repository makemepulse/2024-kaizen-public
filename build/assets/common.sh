#!/bin/bash

GLOB=$1
if [ -z "$GLOB" ]
  then
    GLOB=''
fi

source ./build/assets/config.sh
source ./build/assets/gen_ibl.sh
source ./build/assets/scene_export.sh


match(){
  ID=$1
  if [[ $ID == $GLOB || $GLOB == $ID || $GLOB == "" ]]; then
    # echo "matching"
    return 0
  else
    echo "skip $ID"
    return 1
  fi
}


levelToResize(){
  local level=$1
  local resize=100

  while [ $level -gt 0 ]; do
    resize=$(bc <<< "scale=3;$resize/2")
    let level-=1
  done

  echo $resize%

}

# convert input to tga if not already tga
# ========================================

toTGA(){
  local NAME=$1
  local SUFF=$2


  if [ -e $SRCDIR/$NAME.tga ]
  then
    echo $SRCDIR/$NAME.tga
  elif [ -e $SRCDIR/$NAME.psd ]
  then
    convert -format tga $SRCDIR/$NAME.psd[0] $TMPDIR/tmpc$SUFF.tga
    echo $TMPDIR/tmpc$SUFF.tga
  elif [ -e $SRCDIR/$NAME.png ]
  then
    convert -format tga $SRCDIR/$NAME.png $TMPDIR/tmpc$SUFF.tga
    echo $TMPDIR/tmpc$SUFF.tga
  else
    echo "no file $NAME"
    exit 1
  fi 

}


argtest(){

  local IS_NORMAL=false
  local IS_DATA=false
  local FLIP_Y=false
  local MIPS=false
  local SUBSCALE=0

  while test $# -gt 0; do
    case "$1" in
      -n|--normal) IS_NORMAL=true shift ;;
      -d|--data)   IS_DATA=true   shift ;;
      -f|--flipy)  FLIP_Y=true    shift ;;
      -m|--mipmap)   MIPS=true      shift ;;
      -s|--scale)  SUBSCALE=$2    shift ;;
      *) shift ;;
    esac
  done

  echo is normal $IS_NORMAL is data $IS_DATA mips $MIPS flipy $FLIP_Y subscale $SUBSCALE

}

compress(){ 
  local NAME=$1
  local INPUT_TGA=$2
  local OUTPUT=$3
  local MIPS=$4
  local FLIP=$5
  local IS_NORMAL=$6
  local FORMATS=$7
  local QUALITY=$8


  if $MIPS  ; then mips=-m;      else mips=; fi

  if [ -z "$FLIP" ]
    then
      FLIP=true
  fi

  if $FLIP  ; then PFLIP="-flip";        else PFLIP=; fi
  if $FLIP  ; then GFLIP="-flip y";    else GFLIP=; fi # for pvrtc

  # if $IS_NORMAL  ; then DXT_TYPE="-normal"; fi

  WEBP_OPTS="-define webp:lossless=false -define webp:alpha-compression=0"

  printf "> $NAME    "

  # JPG
  if [[ $FORMATS == *"jpg"* ]]; then
    printf 'jpg'
    convert -quality $QUALITY -format JPG $PFLIP $INPUT_TGA $OUTPUT
    printf ' ✓ '
  fi

  # WEBP
  if [[ $FORMATS == *"webp"* ]]; then
    printf 'webp'
    magick $INPUT_TGA -quality $QUALITY $PFLIP $WEBP_OPTS $OUTPUT.webp
    printf ' ✓ '
  fi
  
  # PVRTC 4BPP
  if [[ $FORMATS == *"pvr"* ]]; then
    printf 'pvr'
    PVRTexToolCLI -shh $mips -square $GFLIP -q $PVRQUALITY -mfilter cubic -f PVRTCI_4BPP_RGB,UBN,lRGB -ics lRGB -o $OUTPUT.pvr.ktx -i $INPUT_TGA
    printf ' ✓ '
  fi
  
  # ETC1
  if [[ $FORMATS == *"etc"* ]]; then
    printf 'etc'
    PVRTexToolCLI -shh $mips $GFLIP -q $ETCQUALITY -mfilter cubic -f ETC1,UBN,lRGB -ics lRGB -o $OUTPUT.etc.ktx -i $INPUT_TGA
    printf ' ✓ '
  fi

  # ASTC
  if [[ $FORMATS == *"astc"* ]]; then
    printf 'astc'
    PVRTexToolCLI -shh $mips $GFLIP -q $ASTCQUALITY -mfilter cubic -f ASTC_4x4,UBN,lRGB -ics lRGB -o $OUTPUT.astc.ktx -i $INPUT_TGA
    printf ' ✓ '
  fi
  
  # DXT1
  if [[ $FORMATS == *"dxt"* ]]; then
    printf 'dxt'
    PVRTexToolCLI -shh $mips $GFLIP -q $DXTQUALITY -mfilter cubic -f BC1,UBN,lRGB -ics lRGB -o $OUTPUT.dxt.ktx -i $INPUT_TGA 
    printf ' ✓ '
  fi

  # BASIS
  if [[ $FORMATS == *"basis"* ]]; then
    printf 'basis'
    PVRTexToolCLI -shh $mips $GFLIP -q $BASISQUALITY -mfilter cubic -f BASISU_UASTC,UBN,sRGB -o $OUTPUT.basis.ktx2 -i $INPUT_TGA
    printf ' ✓ '
  fi
  
  printf '\n'
}


texture(){

  local NAME=$1

  local IS_NORMAL=false
  local IS_DATA=false
  local FLIP_Y=false
  local MIPS=false
  local SUBSCALE=0
  local QUALITY=100
  local FORMATS="jpg,webp"

  while test $# -gt 0; do
    case "$1" in
      -n|--normal)  IS_NORMAL=true shift ;;
      -d|--data)    IS_DATA=true   shift ;;
      -x|--flip)    FLIP_Y=true    shift ;;
      -m|--mipmap)  MIPS=true      shift ;;
      -s|--scale)   SUBSCALE=$2    shift ;;
      -f|--formats) FORMATS=$2     shift ;;
      -q|--quality) QUALITY=$2     shift ;;
      *) shift ;;
    esac
  done


  match $NAME.tga || return 0
  
  local INPUT_TGA=$(toTGA $NAME)

  if [ $SUBSCALE -eq 0 ] ; then        

    local OUTPUT=$OUTDIR/$NAME.jpg
    compress $NAME $INPUT_TGA $OUTPUT $MIPS $FLIP_Y $IS_NORMAL $FORMATS $QUALITY
    
  else

    local RESIZE=$(levelToResize $SUBSCALE)
    
    local TEMP_INPUT=$TMPDIR/tmp.tga
    convert -resize $RESIZE -format TGA $INPUT_TGA $TEMP_INPUT
    OUTPUT=$OUTDIR/$NAME.jpg
    compress $NAME $TEMP_INPUT $OUTPUT $MIPS $FLIP_Y $IS_NORMAL $FORMATS $QUALITY
    
  fi


}


toPng(){

  local NAME=$1
  
  local FLIP_Y=false
  local SUBSCALE=0

  while test $# -gt 0; do
    case "$1" in
      -f|--flip)   FLIP_Y=true    shift ;;
      -s|--scale)  SUBSCALE=$2    shift ;;
      *) shift ;;
    esac
  done




  match $NAME.tga || return 0

  local INPUT_TGA=$(toTGA $NAME)


  if $FLIP_Y  ; then PFLIP="-flip";        else PFLIP=; fi

  local RESIZE=$(levelToResize $SUBSCALE)

  local OUTPUT=$OUTDIR/$NAME.png
  convert $PFLIP -resize $RESIZE -format PNG -define png:color-type=6 $INPUT_TGA $OUTPUT
  
}


combine(){
  local CHANNELS=""
  local OUT_TEX=""
  local MODE=""

  if [ -z "$4" ]; 
    then OUT_TEX=$3;
    else OUT_TEX=$4;
  fi


  match $OUT_TEX || return 0

  local C1=$(toTGA $1 _R)
  local C2=$(toTGA $2 _G)


  if [ -z "$4" ]
    then
      CHANNELS="$C1 $C2"
      MODE=RG
    else
      local C3=$(toTGA $3 _B)
      CHANNELS="$C1 $C2 $C3"
      MODE=RGB
  fi
  
  convert $CHANNELS\
    -background black -channel $MODE \
    -combine \
    $SRCDIR/$OUT_TEX
}


lodTex(){

  local NAME=$1

  local IS_NORMAL=false
  local IS_DATA=false
  local FLIP_Y=false
  local MIPS=false
  local SUBSCALE=0
  local NUMLEVELS=3

  while test $# -gt 0; do
    case "$1" in
      -n|--normal) IS_NORMAL=true shift ;;
      -d|--data)   IS_DATA=true   shift ;;
      -f|--flip)   FLIP_Y=true     shift ;;
      -m|--mipmap) MIPS=true      shift ;;
      -s|--scale)  SUBSCALE=$2    shift ;;
      -l|--levels) NUMLEVELS=$2   shift ;;
      *) shift ;;
    esac
  done




  match $NAME.tga || return 0

  local INPUT_TGA=$(toTGA $NAME)

  local VL0=_L0
  local VL1=_L1

  local TEMP_INPUT=$TMPDIR/tmp.tga


  

  local RESIZE=$(levelToResize $SUBSCALE)


  local CURR_LEVEL=0
  while [ $CURR_LEVEL -lt $NUMLEVELS ]; do

    local CURR_SUBSCALE=$(($SUBSCALE+$NUMLEVELS-1-$CURR_LEVEL))
    local CURR_RESIZE=$(levelToResize $CURR_SUBSCALE)
    
    local CURR_MIPS=false
    if [ $CURR_LEVEL -eq 0 ]; then
      CURR_MIPS=true
    fi

    local INPUT=""
    
    if [ $CURR_SUBSCALE -eq 0 ] ; then        
      INPUT=$INPUT_TGA
    else
      INPUT=$TEMP_INPUT
      convert -resize $CURR_RESIZE -format TGA $INPUT_TGA $TEMP_INPUT
    fi

    local SUFF=''
    if [ $CURR_LEVEL -eq 0 ] ; then        
      SUFF=''
    else
      SUFF=_L$CURR_LEVEL
    fi

    local OUTPUT=$OUTDIR/$NAME$SUFF.jpg
    compress $NAME $INPUT $OUTPUT $CURR_MIPS $FLIP_Y

    echo $INPUT 
    echo $CURR_RESIZE
    echo $CURR_MIPS

    let CURR_LEVEL+=1 

  done

}




namedfbx(){
  NAME=$1
  SCALE=$2

  match $NAME.fbx || return 0

  if [ -z "$2" ]
    then
      SCALE=1
  fi
  # ./assets/fbx2awd_skin -s $SCALE -o $TMPDIR/tmp.awd  $SRCDIR/$NAME.fbx
  fbx2awd -s $SCALE $3 -o $TMPDIR/tmp.awd  $SRCDIR/$NAME.fbx
  ./build/process-awd -o $OUTDIR/$NAME.awd  $TMPDIR/tmp.awd
}


fbx(){
  namedfbx $1/scene $2 $3
}



assetsInit(){
  mkdir $TMPDIR
  mkdir $OUTDIR
}
