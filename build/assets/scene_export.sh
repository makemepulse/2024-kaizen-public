# Generate glb and thumbs for board assets
# $1: asset name
# $2: texture size (optional, default $TEXTURE_SIZE)

# GLOBALS

# GLB_FOLDER_SRC : source folder for glb
# GLB_FOLDER_OUT : output folder for glb
# TEXTURE_SIZE : texture size for glb

scene_export(){

  local value=$1
  local file=$1
  local src_dir=$GLB_FOLDER_SRC
  local out_dir=$GLB_FOLDER_OUT
  local tex_size=$TEXTURE_SIZE

  if [ -n "$2" ]; then
    tex_size=$2
  fi

  echo "[$file]"

  $gltfOptim $src_dir/$file $out_dir/$file $tex_size

 

  echo "===================="
  
}