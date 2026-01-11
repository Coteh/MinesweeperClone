// Shared constants for double-tap detection
export const DOUBLE_TAP_DELAY_MS = 300; // milliseconds - max time between taps to be considered double-tap
export const DOUBLE_TAP_DISTANCE_PX = 50; // pixels
export const TAP_MOVEMENT_THRESHOLD_PX = 10; // pixels
// Tile action delays - optimized for responsiveness based on tile type
// A typical tap takes ~50-100ms, so these are optimized for responsiveness
export const UNREVEALED_TILE_ACTION_DELAY_MS = 50; // milliseconds - fast response for revealing tiles
export const REVEALED_NUMBERED_TILE_ACTION_DELAY_MS = 50; // milliseconds - fast response for tiles with numbers (chord action)
export const REVEALED_EMPTY_TILE_ACTION_DELAY_MS = 150; // milliseconds - allows double-tap detection on empty revealed tiles
