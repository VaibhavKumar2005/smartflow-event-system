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
 * Base densities — the "resting state" of the stadium.
 * Used as center of gravity for randomization so results stay realistic.
 */
const BASE_ZONES = [
  'low',    'medium', 'high',   'medium', 'low',
  'low',    'high',   'high',   'medium', 'low',
  'low',    'medium', 'low',    'high',   'medium',
  'medium', 'low',    'medium', 'low',    'low',
  'high',   'medium', 'low',    'medium', 'low',
];

/** Base crowd percentages (realistic for a live stadium event) */
const BASE_PERCENTAGES = [
  15, 45, 82, 48, 12,
  18, 88, 91, 55, 14,
  20, 42, 22, 78, 52,
  48, 18, 45, 15, 12,
  85, 52, 18, 48, 10,
];

/** Structural hotspots — zones that tend to stay congested */
const STICKY_HIGH = new Set([2, 6, 7, 13, 20]);

/**
 * Generate randomized zone data simulating real-time crowd movement.
 * Structural hotspots remain sticky-high ~75% of the time.
 * Crowd percentages correlate with density classification.
 *
 * @returns {{ zones: string[], crowdPercentages: number[] }}
 */
export function generateRandomizedZones() {
  const zones = [];
  const percentages = [];

  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    const basePct = BASE_PERCENTAGES[i];
    const jitter  = Math.floor((Math.random() - 0.5) * 25);
    let pct = Math.max(5, Math.min(99, basePct + jitter));

    // Structural hotspots stay high most of the time
    if (STICKY_HIGH.has(i) && Math.random() < 0.75) {
      zones.push('high');
      percentages.push(Math.max(65, pct));
    } else if (pct < 30) {
      zones.push('low');
      percentages.push(pct);
    } else if (pct < 60) {
      zones.push('medium');
      percentages.push(pct);
    } else {
      zones.push('high');
      percentages.push(pct);
    }
  }

  return { zones, crowdPercentages: percentages };
}

/** Static fallback zones (used by pathfinder when no crowd snapshot is provided) */
export const zones = [...BASE_ZONES];

export const destinations = [
  { key: 'food',     label: 'Food Court',        gridIndex: 6  },
  { key: 'exit',     label: 'Main Entry',        gridIndex: 2  },
  { key: 'restroom', label: 'Restrooms',         gridIndex: 16 },
  { key: 'merch',    label: 'Merchandise Store',  gridIndex: 8  },
  { key: 'south',    label: 'South Exit',        gridIndex: 22 },
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
