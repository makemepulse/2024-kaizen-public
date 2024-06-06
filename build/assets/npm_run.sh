#!/bin/bash

FOLDER=$1
GLOB=$2

SCRIPT_PATH="./build/assets/src/$FOLDER/build.sh"
if [ -e $SCRIPT_PATH ]
then
  $SCRIPT_PATH $GLOB
else
  echo FAIL : \"./build/assets/src/$FOLDER/build.sh\" doesn\'t exist
  exit
fi 

