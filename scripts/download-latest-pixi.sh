#!/usr/bin/sh

mkdir pixi
cd pixi
curl --remote-name-all http://pixijs.download/release/pixi{.js,.js.map}
if [ $# -gt 0 ] && { [ "$1" = "separate" ] || [ "$1" = "s" ]; }; then
    curl --remote-name-all https://raw.githubusercontent.com/pixijs/pixi-filters/publish/bin/pixelate{.js,.js.map}
else
    curl --remote-name-all https://raw.githubusercontent.com/pixijs/pixi-filters/publish/bin/filters{.js,.js.map}
fi
cd ..
