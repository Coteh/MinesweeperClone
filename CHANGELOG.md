# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-01-26

### Added

- Fullscreen resolution option

### Changed

- Game settings moved into new submenu

## [1.0.6] - 2024-01-09

### Added

- GitHub Actions deploy workflow to deploy to Pages (986d52d)

### Security

- Bump webpack-bundle-analyzer from 4.9.1 to 4.10.1 (#17)
- Bump terser-webpack-plugin from 5.3.9 to 5.3.10 (#21)
- Bump html-webpack-plugin from 5.5.3 to 5.6.0 (#22)

## [1.0.5] - 2023-11-22

### Changed

- Switch to webpack for bundling (55a0486)
- Pass game version to webpack from package.json (8b3f220)

## [1.0.4] - 2023-11-04

### Added

- Auto-reveal feature (#15)

### Changed

- Only disable context menu if right clicking on a board tile (bcd711b)

## [1.0.3] - 2023-10-29

### Added

- Save game options to storage (#14)

## [1.0.2] - 2023-10-28

### Added

- Option to reveal entire board on loss (#9)
- Version number to the title screen (#12)

### Changed

- Only reveal mines on the board when game over, unless reveal board on loss option is enabled (#8)
- Update PixiJS to 4.3.0 (#10)
- Add a script to download PixiJS (#11)
- Build/deploy scripts updated (#12)
- Travis CI replaced with GitHub Actions (#12)

### Removed

- CLI (#12)

## [1.0.1] - 2016-06-11

### Added

- Asset Loader (#2)
- Preliminary fullscreen support (stretch game screen to bounds of browser window)
- Travis CI integration support

### Changed

- Digits on mine count box now display amount of mines that still need to be flagged instead of amount of mines in total
- Timer now starts when the first tile is clicked

## [1.0.0] - 2015-12-10

Initial Release

[unreleased]: https://github.com/Coteh/MinesweeperClone/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/Coteh/MinesweeperClone/compare/v1.0.6...v1.1.0
[1.0.6]: https://github.com/Coteh/MinesweeperClone/compare/v1.0.5...v1.0.6
[1.0.5]: https://github.com/Coteh/MinesweeperClone/compare/v1.0.4...v1.0.5
[1.0.4]: https://github.com/Coteh/MinesweeperClone/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/Coteh/MinesweeperClone/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/Coteh/MinesweeperClone/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/Coteh/MinesweeperClone/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/Coteh/MinesweeperClone/releases/tag/v1.0.0
