// Shared constants for double-tap detection
export const DOUBLE_TAP_DELAY_MS = 300; // milliseconds - max time between taps to be considered double-tap
export const DOUBLE_TAP_DISTANCE_PX = 50; // pixels
export const TAP_MOVEMENT_THRESHOLD_PX = 10; // pixels
// Tile action delay only needs to be long enough to detect if second tap has started
// A typical tap takes ~50-100ms, so 150ms is enough to know if user is double-tapping
export const TILE_ACTION_DELAY_MS = 150; // milliseconds - delay before executing tile action
