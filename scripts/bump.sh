#!/bin/sh

NEW_VERSION_NUMBER=$1

if [ "$NEW_VERSION_NUMBER" = "" ]; then
    >&2 echo "Please specify version"
    exit 1
fi

echo $NEW_VERSION_NUMBER

# Replace version number in README badge
sed -i.bak "s/\[!\[release \| v[0-9.]*\](https:\/\/img.shields.io\/badge\/release-v[0-9.]*-00b2ff.svg)\](https:\/\/github.com\/Coteh\/MinesweeperClone\/releases\/tag\/v[0-9.]\{1,\})/[![release | v$NEW_VERSION_NUMBER](https:\/\/img.shields.io\/badge\/release-v$NEW_VERSION_NUMBER-00b2ff.svg)](https:\/\/github.com\/Coteh\/MinesweeperClone\/releases\/tag\/v$NEW_VERSION_NUMBER)/g" README.md

if [ $? != 0 ]; then
    >&2 echo "Failure editing README.md"
    exit 1
fi

rm README.md.bak

# Perform npm version bump, using --no-git-tag-version so that everything can be committed together
npm version $NEW_VERSION_NUMBER --no-git-tag-version

git add README.md package.json package-lock.json

git commit -m "Version bump"
