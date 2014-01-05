#!/bin/bash
set -eu
: ${1:? Usage: $0 RELEASE_VERSION}
SCRIPTS=`dirname "$0"`

RELEASE_VERSION="$1"
if [[ ! "$RELEASE_VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Error: RELEASE_VERSION must be in X.Y.Z format, but was $RELEASE_VERSION"
    exit 1
fi

function contains-line() {
    grep --line-regexp --quiet --fixed-strings -e "$1"
}

function demand-file-contains-line() {
    local file="$1"
    local expected="$2"
    cat "$file" | contains-line "$expected" || (echo "Add this line to $file and try again:"; echo "$expected"; exit 1)
}

function assert-file-contains-substring() {
    local file="$1"
    local expected="$2"
    cat "$file" | grep --quiet --fixed-strings -e "$expected" || (echo "Error: file $file did not contain $expected"; exit 1)
}

function update-json() {
    local key="$1"
    local value="$2"
    local file="$3"
    sed -i -r -e "s|^(.*\"$key\": \").+(\".*)\$|\1$value\2|" "$file"
    assert-file-contains-substring "$file" "\"$key\": \"$value\""
}

function set-project-version() {
    local file="pamod/modinfo.json"
    local version="$1"
    local build=`cat "$PA_HOME/version.txt" | tr -d ' '`
    local date=`date '+%Y/%m/%d'`
    update-json "version" "$version" "$file"
    update-json "build" "$build" "$file"
    update-json "date" "$date" "$file"
}

function next-snapshot-version() {
    local prefix=`echo $1 | sed -n -r 's/([0-9]+\.[0-9]+\.)[0-9]+/\1/p'`
    local suffix=`echo $1 | sed -n -r 's/[0-9]+\.[0-9]+\.([0-9]+)/\1/p'`
    ((suffix++))
    echo "$prefix$suffix-SNAPSHOT"
}

APP_NAME="PA Mentor"
NEXT_VERSION=`next-snapshot-version $RELEASE_VERSION`

demand-file-contains-line README.md "### $APP_NAME $RELEASE_VERSION (`date --iso-8601`)"

set -x

set-project-version "$RELEASE_VERSION"
git add -u
git commit -m "Release $RELEASE_VERSION"
git tag -s -m "$APP_NAME $RELEASE_VERSION" "v$RELEASE_VERSION"

$SCRIPTS/package.sh "$RELEASE_VERSION"

set-project-version "$NEXT_VERSION"
git add -u
git commit -m "Prepare for next development iteration"

$SCRIPTS/publish.sh "$RELEASE_VERSION"
