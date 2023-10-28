#!/bin/sh

./node_modules/.bin/browserify browser_setup.js > bundle.js && echo "Game has been built. Now running server." && node server/server.js
