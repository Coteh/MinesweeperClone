# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

Use pnpm for dependency installation and running scripts in this project.

```bash
pnpm install         # Install dependencies
pnpm run dev         # Start dev server (localhost:5173)
pnpm run build       # Production build (output: /build)
pnpm run serve       # Preview production build (localhost:4173)
pnpm run lint        # ESLint
pnpm run format      # Prettier formatting
pnpm run format:check # Prettier formatting check
pnpm run type-check  # TypeScript type check
pnpm test            # Run Jest unit tests
pnpm run cypress     # Run Cypress E2E tests (requires dev server running)
```

## Quality Gates

Before completing any work, run lint, type check, and format checks and ensure they all pass:

```bash
pnpm run lint
pnpm run type-check
pnpm run format:check
```

To run a single Jest test:
```bash
node --experimental-vm-modules ./node_modules/jest-cli/bin/jest.js test/board-setup.test.ts
```

## Architecture

This is a browser-based Minesweeper clone built with vanilla TypeScript, PixiJS for background rendering, and Howler.js for audio. No UI framework — the game UI is DOM-based with manual rendering functions.

### Core Modules

- **`src/game.ts`** — Game logic engine. Manages board state (`gameState`), persistent data (`persistentState` for highscores/unlockables), and dispatches events (`init`, `draw`, `reveal`, `flag`, `win`, `lose`, etc.) to a registered callback handler. All game rules and board operations live here.
- **`src/render.ts`** — DOM rendering. Translates game state into HTML updates for the board, dialogs, and UI elements.
- **`src/index.ts`** — Frontend entry point. Wires together game events, managers, subsystems, and UI. Acts as the event dispatcher between game logic and rendering.
- **`src/preferences.ts`** — Thin key-value wrapper around storage for user preferences (theme, difficulty, audio settings).

### Manager Pattern (`src/manager/`)

Managers are singletons that own specific subsystems:

- **ThemeManager** (`theme.ts`) — Theme switching, color management
- **BackgroundManager** (`background/`) — PixiJS-rendered animated backgrounds (ocean, desert, cloudy, dustfield, classic, basic)
- **AssetManager** (`asset.ts`) — Preloads images and sounds with progress tracking
- **AudioManager** (`audio.ts`) — Sound effects via Howler.js
- **TransformManager** (`transform.ts`) — Board pan/zoom transformations
- **FullscreenManager** (`fullscreen.ts`) — Fullscreen API wrapper

### Subsystems (`src/subsystem/`)

- **interaction.ts** — Keyboard, mouse, and touch input handling
- **settings.ts** — Settings UI and preference binding
- **debug.ts** — Debug HUD (enabled via `VITE_DEBUG_ENABLED` env var)

### State Management

No state library. Module-level globals in `game.ts` (`gameState`, `persistentState`) with an event-driven callback pattern. Storage is abstracted via an interface in `src/storage/` with a browser localStorage implementation and a CLI fallback.

### Configuration

- Game difficulties and themes are defined in `src/config/` (loaded from `config.json`)
- Constants and theme names in `src/consts/`

## Code Style

- Prettier with single quotes, 4-space indent, 100-char print width
- TypeScript strict mode
- ES2020 target
