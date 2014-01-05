#!/bin/bash
set -eu
: ${1:? Usage: $0 VERSION}
VERSION="$1"
FILENAME="PAMentor_v$VERSION.zip"
set -x

rm -rf dist/PAMentor
mkdir -p dist
cp -r pamod dist/PAMentor

cd dist
rm -f "$FILENAME"
zip -r "$FILENAME" PAMentor
rm -rf PAMentor
