# minesweeper-clone

See `README.md` for what the game does and how to run it. The thing to know before editing:
this is a browser-only game in vanilla TypeScript built by Vite, with no UI framework — the
board and every dialog are hand-built DOM. PixiJS renders the animated background behind the
board, Howler plays the sound effects, and `src/game.ts` holds the rules and pushes typed
events at a single handler in `src/index.ts`.

## Commands

`README.md` → **Installation** covers `pnpm install`, `pnpm run build`, `pnpm run serve`, and
`pnpm run dev`. Read it rather than guessing; what follows is only what it does not say.

- `pnpm install` — pnpm 10. `.tool-versions` pins Node 24, and every CI job runs Node 24.
- `pnpm test` — jest unit tests in `test/`. Takes a few seconds; run it on every change. A
  single file is `pnpm test test/board-setup.test.ts`; the `--experimental-vm-modules` flag
  the ESM setup needs is already in the script, so there is no reason to spell out a path
  into `node_modules` by hand.
- The quality gate is `pnpm run lint`, `pnpm run type-check:test`, and `pnpm run
  format:check`. Use `type-check:test`, not `type-check` — `tsconfig.json` only includes
  `src`, so plain `type-check` will not see a type error in a spec, and that is exactly what
  CI checks.
- `pnpm run format` before committing. Unlike a repo where formatting is advisory, a
  Prettier diff fails CI here.
- Cypress expects the dev server on 5173 (`baseUrl` in `cypress.config.ts`), so the e2e suite
  needs `pnpm run dev` — not `pnpm run serve`, which previews the build on 4173.
  `pnpm run cypress:run` runs the specs in Chrome; CI runs them in Edge.
- `scripts/bump.sh <version>` does a release bump (README badge, `package.json`, commit).
  `scripts/screenshot.sh` regenerates `screenshots/game.png` and needs both a real Cypress
  binary and ImageMagick.

## Project layout

- `index.html` — the whole page shell. Every pane, dialog, and `<template>` lives here as
  markup, and the modules reach it with `document.querySelector`. Adding UI is usually markup
  here plus a query in the module that owns it.
- `src/game.ts` — game rules and board state. Module-level `gameState` and `persistentState`,
  one `EventHandler` registered through `initGame`, and events typed by `GameEventDataMap`
  (`init`, `draw`, `reveal`, `flag`, `win`, `lose`, …). Keep this file free of DOM access.
- `src/index.ts` — the one event handler. It constructs the managers, subsystems, and
  components, then turns each game event into rendering. There is no `src/render.ts`.
- `src/components/` — the rendering layer (`board`, `dialog`, `digits`, `notification`,
  `prompt-dialog`). Each exports a `create*Component(deps)` factory that closes over its
  dependencies and returns a `Component`; `src/components/index.ts` types the map of them.
- `src/manager/` — singletons owning a subsystem: `theme`, `background/` (the PixiJS
  backgrounds), `asset` (preloading with progress), `audio` (Howler), `transform` (board
  pan/zoom), `fullscreen`, `action-icon`.
- `src/subsystem/` — `interaction.ts` (keyboard, mouse, touch), `settings.ts` (settings UI
  bound to preferences), `debug.ts` (the debug HUD, gated on `VITE_DEBUG_ENABLED`).
- `src/storage/` — an `IGameStorage` interface with `browser.ts` (localStorage) and `cli.ts`
  (filesystem) behind it. Nothing imports `cli.ts` today; it exists so the interface stays
  frontend-agnostic. `src/preferences.ts` is the key-value layer on top of it.
- `src/config.json` — difficulties and themes. `src/config/index.ts` fetches it from
  `/config.json` at runtime and falls back to a small hardcoded config if that fails.
- `src/consts/` — the preference, setting, difficulty, and theme key strings.
- `src/assets/base/` and `src/assets/themes/<theme>/` — `manager/theme-assets.ts` globs both
  with `import.meta.glob` and overlays the theme's files onto the base set by logical path,
  so a themed asset is just the same filename under the theme directory.
- `plugins/` — two local Vite plugins wired up in `vite.config.ts`: one renders `CHANGELOG.md`
  to `CHANGELOG.html`, one strips the canonical link outside production.

Three things in here will waste an afternoon if you do not know them:

- `src/config.json` sits next to `src/config/`, so a value import of `'../config'` resolves to
  the JSON, not the module. Import values as `'../config/index'`; type-only imports from
  `'../config'` are fine, since they never reach the bundler.
- `public/config.json` is a stale duplicate that carries the difficulties and no themes.
  `vite-plugin-static-copy` puts `src/config.json` at the site root in both `pnpm run dev` and
  `pnpm run build`, so the public copy never wins and editing it changes nothing.
- `manager/theme.ts` additionally imports `src/config.json` at compile time, but only to
  derive the `Theme` union type. Theme data at runtime still comes from the fetched config.

## Code style

Prettier 3 with the repo's `.prettierrc`: single quotes, 4-space indent, 100 column width,
2-space for `package*.json` and `pnpm*.yaml`. It is a dependency and `format:check` is a CI
gate, so run `pnpm run format` and let it decide. `.prettierignore` excludes `.github`,
`*.html`, `*.md`, and `*.yml`, so `index.html` is hand-formatted — match the surrounding
markup there.

ESLint (`eslint.config.mjs`) is the recommended sets plus one override: unused variables are a
warning rather than an error, and ones prefixed with `_` are ignored entirely. That is why
deliberately unused parameters are written `_gameStorage`, `_config`, `_e`. TypeScript is
strict and also sets `noUnusedLocals` and `noUnusedParameters`, so an unused import fails the
type check even though lint only shrugs at it.

Prefer the idioms already in the file over a "better" pattern imported from elsewhere.

Comment only what the code cannot say, and keep it to one line per section. Skip anything a
well-named call, the symmetry with nearby code, or the very next line already makes clear. The
comments that earn their place explain why code sits where it does, or a constraint that is
invisible on the page. Reasoning about why one approach beat another belongs in the commit
message, where it will not go stale.

## Testing

- Board setup and movement, reveal and flag rules, mine counts, scalability, theme labels,
  audio behaviour → jest unit tests in `test/`.
- `testEnvironment` is `node` and there is no jsdom. A spec that needs the DOM assigns its own
  `global.document` stub (see `test/theme.test.ts` and `test/audio.test.ts`), and anything
  that reaches PixiJS or Howler has to be mocked out — `jest.mock('../src/manager/background',
  …)` — or the import itself blows up under node.
- Jest runs as ESM, so every spec imports `describe`, `it`, `expect`, and `jest` explicitly
  from `@jest/globals`. Those imports resolve because `pnpm-workspace.yaml` public-hoists
  `@jest/globals` and `jest-mock`; leave that hoist list alone.
- `initGame` starts a timer, so call `cleanupGame()` in `afterEach`. Without it jest reports
  an open handle and the run does not settle. Every existing spec does this.
- `test/util.ts` provides `MockGameStorage` and `NonexistentMockGameStorage` implementing
  `IGameStorage`. Use those instead of stubbing localStorage.
- Anything touching real DOM, input handling, dialogs, rendering, or state that has to survive
  a reload → e2e coverage in `cypress/e2e/`. `cypress/support/commands/` has the helpers:
  `cy.waitForGameReady`, `cy.verifyBoardMatches`, `cy.selectDifficulty`, `cy.selectTheme`,
  `cy.changeDifficulty`, `cy.waitUntilDialogAppears`, `cy.shouldBeInViewport`,
  `cy.shouldNotBeActionable`. A new command also needs its signature in
  `cypress/support/index.d.ts`, or `type-check:test` fails.
- `cypress/fixtures/` holds the config and game-state fixtures for specs that need a specific
  board. `cypress/e2e/misc/screenshot.cy.ts` exists to regenerate the README screenshot, not
  to assert behaviour.

## CI

Three workflows run on every push:

- `.github/workflows/ci.yml` — `test-game-logic` (`pnpm run test-ci`, jest with the JUnit
  reporter) and `cypress-run` (the real Cypress suite in Edge against `pnpm run dev`), then
  `publish-test-results` merges both JUnit XMLs into a check.
- `.github/workflows/code-quality.yml` — `type-check:test`, `lint`, `format:check`.
- `.github/workflows/deploy_dev.yml` — builds and publishes to Cloudflare Pages on every push.
  `deploy.yml` publishes to GitHub Pages, but only for `v1*` tags until v2 ships.

Keep the CI and code-quality workflows green before asking for review.

## Commits and pull requests

Match the existing history: a short imperative subject line, usually with a conventional
prefix (`fix:`, `feat:`, `refactor:`, `test:`, `docs:`), then body paragraphs explaining what
was wrong and why the fix works.

`CHANGELOG.md` follows Keep a Changelog under an `[Unreleased]` heading. Only user-facing
changes belong there, and it is updated in its own commits, not alongside every fix. Version
bumps go through `scripts/bump.sh`.

Never carry agent metadata into the repository: no agent session links, no "Generated with
<tool>" footers, no session or co-author trailers naming an assistant, and no model names
(`claude-*`, `gpt-*`, `gemini-*`, and the like) in commit messages, PR titles, PR
descriptions, or any file pushed to the repository.

## Agent instruction files

This file is the source of truth, and every rule belongs here. `CLAUDE.md` exists only because
Claude Code reads `CLAUDE.md` and not `AGENTS.md`; it is a single `@AGENTS.md` import line.
Keep it that way — do not let an `/init`-style command copy this file's contents into it,
since duplicated instructions drift apart and nothing says which copy is current.

## Environment gotchas

- Cypress binaries download from `download.cypress.io`, which is blocked in some sandboxed
  agent environments, so `pnpm run cypress:run` cannot run there. Install with
  `CYPRESS_INSTALL_BINARY=0` to get the rest of the dependencies, run jest and the quality
  gates, and drive the app in a real browser by hand to check behaviour. CI runs the real
  suite. Where the sandbox ships Chromium and Playwright — Claude Code web sessions have them,
  with the browsers at `PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` — pointing Playwright at
  `pnpm run dev` on 5173 is how DOM and input-handling changes get verified.
- `pnpm-workspace.yaml` turns off pnpm's side-effects cache because it conflicts with
  Cypress's own cache. Leave that off.
- `vite.config.ts` shells out to `git rev-parse --short HEAD` while loading, so a build needs a
  real git checkout. It and the package version become the `COMMIT_HASH` and `GAME_VERSION`
  compile-time defines declared in `src/vite-env.d.ts`.
- `.env` files are gitignored; `.env.example` lists what they hold. `VITE_DEBUG_ENABLED` turns
  on debug logging and the HUD, and `DEPLOY_ENV=DEV` also drops the canonical link from the
  page.
