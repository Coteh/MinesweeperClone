#!/bin/sh

ENV_ARG="$1"

mkdir -p pixi
cd pixi

PIXI_JS_URL_PREFIX="https://raw.githubusercontent.com/pixijs/pixijs/v4.3.0/dist/pixi"
PIXI_JS_FILTERS_URL_PREFIX="https://raw.githubusercontent.com/pixijs/filters/v1.0.6/bin/filters"
PIXI_JS_PIXELATE_URL_PREFIX="https://raw.githubusercontent.com/pixijs/filters/v1.0.6/bin/pixelate"

if [ "$ENV_ARG" == "prod" ]; then
    MIN_SUFFIX=".min"
fi

curl --remote-name-all "$PIXI_JS_URL_PREFIX$MIN_SUFFIX{.js,.js.map}"
if [ "$ENV_ARG" == "prod" ]; then
    curl --remote-name-all "$PIXI_JS_PIXELATE_URL_PREFIX$MIN_SUFFIX{.js,.js.map}"
else
    curl --remote-name-all "$PIXI_JS_FILTERS_URL_PREFIX{.js,.js.map}"
fi
