/**
 * backend/data/stadium.js
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for stadium layout.
 * Swap `zones` for a DB/sensor feed call when real data is available
 * without touching any route or service file.
 */

export const GRID_SIZE = 5;

/**
 * 5×5 flat array (index = row * GRID_SIZE + col).
 * Values: 'low' | 'medium' | 'high'
 *
 * Visual layout (row 0 = top):
 *   [0]  [1]  [2]  [3]  [4]
 *   [5]  [6]  [7]  [8]  [9]
 *   [10] [11] [12] [13] [14]
 *   [15] [16] [17] [18] [19]
 *   [20] [21] [22] [23] [24]
 */
export const zones = [
  "low",    "medium", "high",   "low",    "medium",
  "low",    "high",   "high",   "medium", "low",
  "low",    "medium", "low",    "high",   "medium",
  "medium", "low",    "high",   "low",    "low",
  "high",   "medium", "low",    "medium", "low",
];

export const destinations = [
  { key: "food",     label: "Food Stall Zone A", gridIndex: 4  },
  { key: "exit",     label: "North Exit Gate",    gridIndex: 2  },
  { key: "washroom", label: "Main Washroom",      gridIndex: 20 },
];

/** Default user starting position (center of grid) */
export const DEFAULT_USER_POS = 12;

// ── Helpers ──────────────────────────────────────────────────

/** Convert flat grid index → { x, y } coordinate */
export function indexToCoord(index) {
  return { x: index % GRID_SIZE, y: Math.floor(index / GRID_SIZE) };
}

/** Convert { x, y } coordinate → flat grid index */
export function coordToIndex({ x, y }) {
  return y * GRID_SIZE + x;
}

/** Check whether an index is valid for the current grid */
export function isValidIndex(index) {
  return Number.isInteger(index) && index >= 0 && index < GRID_SIZE * GRID_SIZE;
}

/** Look up a destination by its key; returns null if not found */
export function getDestinationByKey(key) {
  return destinations.find(d => d.key === key) ?? null;
}
