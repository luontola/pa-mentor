#!/bin/bash
set -eu
: ${1:? Usage: $0 VERSION}
VERSION="$1"

echo ""
echo "Done. Next steps:"
echo "    Upload version $VERSION from dist/"
echo "    git push origin HEAD"
echo "    git push origin --tags"
echo "    git push prod HEAD"
