#!/usr/bin/sh

browserify browser_setup.js > bundle.js && echo "Game has been built. Now running server." && node server.js
