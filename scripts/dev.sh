#!/bin/sh

./node_modules/.bin/watchify browser_setup.js -o bundle.js -v &

echo "Running server..." && node server/server.js
