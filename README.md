# ![MinesweeperClone](img/Logo.png "MinesweeperClone Logo")

[![Build Status](https://travis-ci.org/Coteh/MinesweeperClone.svg?branch=master)](https://travis-ci.org/Coteh/MinesweeperClone) [![release | v1.0.1](https://img.shields.io/badge/release-v1.0.1-00b2ff.png)](https://github.com/Coteh/MinesweeperClone/releases/tag/1.0.1) [![Play here](https://img.shields.io/badge/play-here-yellow.png)](http://coteh.github.io/MinesweeperClone/)

Simple clone of the well-known Minesweeper game. Created using Javascript, node.js, and pixi.js.

## ![Smiley](img/Smiley.png "Smiley") Features ![Smiley](img/Smiley.png "Smiley")
- Simple and familiar Minesweeper gameplay
- Ability to initialize a Minesweeper instance with specified height and width of board, and amount of mines
- Game rendering with Pixi.js

## ![Flag](img/Flag.png "Flag") Screenshots ![Flag](img/Flag.png "Flag")
![Title Screen](screenshots/title.png "Title Screen")
![In-Game](screenshots/game.png "In-Game")

## ![Mine](img/Mine.png "Mine") Install ![Mine](img/Mine.png "Mine")
Browserify is used to patch together all the js files linked via require into a single bundle.js file. To do this, run the following:

`browserify browser_setup.js > bundle.js`

If your browser supports loading images, etc. via the file:// protocol, then just load up index.html. Otherwise, run the server via the following command:

`node server/server.js`

Once the server is running, just go to localhost:9000 and it should be there.

## ![Smiley Sad](img/Smiley_sad.png "Smiley_sad") Issues ![Smiley Sad](img/Smiley_sad.png "Smiley_sad")
- Unit and Integration testing is limited
- CLI: Boards of height >= 10 and/or width >= 10 display alignment issues [#1](https://github.com/Coteh/MinesweeperClone/issues/1)
- Stack overflow (RangeError) when recursive revealing boards with dimensions 100x100 or greater [#3](https://github.com/Coteh/MinesweeperClone/issues/3)

## ![Smiley Happy](img/Smiley_proud.png "Smiley_proud") Future Additions ![Smiley Happy](img/Smiley_proud.png "Smiley_proud")
- Microsoft Mode (first click guaranteed not a mine)
- Timed Mode
