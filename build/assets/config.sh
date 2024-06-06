#!/bin/bash

TMPDIR=./tmp
BLIB=./build/assets

FBX2glTF=$BLIB/bin/FBX2glTF
gltfOptim=$BLIB/gltf-optim-cli
hdr2pngExe=$BLIB/bin/hdr2png
textureBasis=$BLIB/texture-basis-cli

EXPORT_BBC=true

TEX_FMT_PVR=true
TEX_FMT_ETC=true
TEX_FMT_ASTC=true
TEX_FMT_DXT=true




# ============= FAST

# PVRQUALITY=pvrtcfastest
# ETCQUALITY=etcfast

# ============= PROD

# PVRQUALITY=pvrtchigh
PVRQUALITY=PVRTCBEST
ETCQUALITY=ETCSLOW
ASTCQUALITY=ASTCTHOROUGH
DXTQUALITY=ASTCTHOROUGH
BASISQUALITY=BASISUBEST

# ============= SUPER HI

# PVRQUALITY=pvrtcbest
# ETCQUALITY=etcslowperceptual
