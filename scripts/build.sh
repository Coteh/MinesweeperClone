#!/bin/sh

OUTPUT_DIR=./build

./node_modules/.bin/browserify browser_setup.js > bundle.js

mkdir -p $OUTPUT_DIR/pixi
mkdir -p $OUTPUT_DIR/img
mkdir -p $OUTPUT_DIR/img/digits

cp index.html $OUTPUT_DIR
cp style.css $OUTPUT_DIR
cp bundle.js $OUTPUT_DIR/bundle.js
cp pixi/*.min.js $OUTPUT_DIR/pixi
cp -r img $OUTPUT_DIR
