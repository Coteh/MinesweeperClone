#!/bin/sh

mkdir pixi
cd pixi
curl --remote-name-all https://raw.githubusercontent.com/pixijs/pixijs/v4.3.0/dist/pixi{.js,.js.map}
if [ $# -gt 0 ] && { [ "$1" = "separate" ] || [ "$1" = "s" ]; }; then
    curl --remote-name-all https://raw.githubusercontent.com/pixijs/filters/v1.0.6/bin/pixelate{.js,.js.map}
else
    curl --remote-name-all https://raw.githubusercontent.com/pixijs/filters/v1.0.6/bin/filters{.js,.js.map}
fi
cd ..
