/**
 * backend/data/stadium.js
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for stadium layout.
 *
 * Each zone has a human-readable label so the heatmap and AI
 * explanations reference real locations, not abstract indices.
 *
 * Visual layout (row 0 = top):
 *   [Gate A]     [North Stands] [Main Entry]   [North Stands] [Gate B]
 *   [West Wing]  [Food Court]   [Food Court]   [Merch Store]  [East Wing]
 *   [Section W]  [Concourse W]  [Center Court] [Concourse E]  [Section E]
 *   [West Lower] [Restrooms]    [South Stands] [First Aid]    [East Lower]
 *   [Exit W]     [Parking W]    [South Exit]   [Parking E]    [Exit E]
 */

export const GRID_SIZE = 5;

/** Human-readable label for each zone cell, indexed 0–24 */
export const zoneLabels = [
  'Gate A',       'North Stands', 'Main Entry',   'North Stands', 'Gate B',
  'West Wing',    'Food Court',   'Food Court',   'Merch Store',  'East Wing',
  'Section W',    'Concourse W',  'Center Court', 'Concourse E',  'Section E',
  'West Lower',   'Restrooms',    'South Stands', 'First Aid',    'East Lower',
  'Exit W',       'Parking W',    'South Exit',   'Parking E',    'Exit E',
];

/**
 * 5×5 density grid. Designed with realistic congestion:
 * - Food Court area (6, 7) = high (everyone eats)
 * - Main Entry (2) = high (bottleneck)
 * - South Exit (22) = medium (halftime rush)
 * - Perimeter wings = mostly low (escape routes)
 */
export const zones = [
  'low',    'medium', 'high',   'medium', 'low',
  'low',    'high',   'high',   'medium', 'low',
  'low',    'medium', 'low',    'high',   'medium',
  'medium', 'low',    'medium', 'low',    'low',
  'high',   'medium', 'low',    'medium', 'low',
];

export const destinations = [
  { key: 'food',     label: 'Food Court',      gridIndex: 6  },
  { key: 'exit',     label: 'Main Entry',      gridIndex: 2  },
  { key: 'restroom', label: 'Restrooms',       gridIndex: 16 },
  { key: 'merch',    label: 'Merchandise Store', gridIndex: 8  },
  { key: 'south',    label: 'South Exit',      gridIndex: 22 },
];

/** Default user starting position (Center Court) */
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
