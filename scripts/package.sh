#!/bin/bash
set -eu
: ${1:? Usage: $0 VERSION}
VERSION="$1"
FILENAME="PAMentor_v$VERSION.zip"
DEV_SERVER="http://127\.0\.0\.1:8080"
PROD_SERVER="http://pa-mentor.orfjackal.net"
set -x

rm -rf dist/PAMentor
mkdir -p dist
cp -r pamod dist/PAMentor

find dist/PAMentor -type f | xargs sed -i -e "s|$DEV_SERVER|$PROD_SERVER|g"

cd dist
rm -f "$FILENAME"
zip -r "$FILENAME" PAMentor
rm -rf PAMentor
