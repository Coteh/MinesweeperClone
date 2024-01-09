# ![MinesweeperClone](img/Logo.png "MinesweeperClone Logo")

[![Run Tests](https://github.com/Coteh/MinesweeperClone/actions/workflows/run-tests.yml/badge.svg)](https://github.com/Coteh/MinesweeperClone/actions/workflows/run-tests.yml)
[![release | v1.0.6](https://img.shields.io/badge/release-v1.0.6-00b2ff.svg)](https://github.com/Coteh/MinesweeperClone/releases/tag/v1.0.6)
[![Play here](https://img.shields.io/badge/play-here-yellow.svg)](http://coteh.github.io/MinesweeperClone/)

Simple clone of the well-known Minesweeper game. Created using Javascript, Node.js, and PixiJS.

## Features
- Simple and familiar Minesweeper gameplay
- Ability to initialize a Minesweeper instance with specified height and width of board, and amount of mines
- Game rendering with PixiJS

## Screenshots
![Title Screen](screenshots/title.png "Title Screen")
![In-Game](screenshots/game.png "In-Game")

## Installation
To run the game locally, simply run the following to install dependencies:
```
npm install
```

Then run the following to build the game:
```
npm run build
```

You can then run a local server on the `build` directory and open it on your browser to play. eg:

```
python -m http.server 8000 -d build

# then open http://localhost:8000 to play locally
```

You can also run the following to run the game in development mode:
```
npm run dev
```

## Issues
- Unit and Integration testing is limited
- Stack overflow (RangeError) when recursive revealing boards with dimensions 100x100 or greater [#3](https://github.com/Coteh/MinesweeperClone/issues/3)

## Future Additions
- Microsoft Mode (first click guaranteed not a mine)
- Timed Mode
