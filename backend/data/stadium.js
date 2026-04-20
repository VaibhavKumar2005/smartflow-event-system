/**
 * backend/data/stadium.js
 * ─────────────────────────────────────────────────────────────
 * Single source of truth for stadium layout + live simulation engine.
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

// ── Event Phase Engine ────────────────────────────────────────────────────────
//
// Cycles through a realistic 20-minute window (demo-friendly).
// Real deployment: replace minute-modulo logic with actual event schedule API.
//
// Phase map (minute % 20):
//   0–3   → PRE_GAME   Gates/entries surge, seating areas filling up
//   4–11  → IN_GAME_1  Seating high, concourses clearing, gates quiet
//   12–14 → HALFTIME   Food/concessions/restrooms spike hard
//   15–18 → IN_GAME_2  Back to seats, concourses clear again
//   19    → POST_GAME  All exits, parking, concourses surge simultaneously

const PHASES = {
  PRE_GAME: {
    key:   'PRE_GAME',
    label: 'Pre-Game',
    // Zone multipliers: >1 = surge, <1 = quieter than base
    // Gates (0,4,20,24), entries (2), north stands (1,3)
    hotZones: new Map([
      [0, 1.9], [2, 2.0], [4, 1.9],  // Top gates/entry surge
      [1, 1.6], [3, 1.6],             // North stands filling
      [5, 1.4], [9, 1.4],             // Wings used as entry channels
      [6, 0.5], [7, 0.5],             // Food court quiet (not open yet)
      [12, 0.3],                       // Center court still empty
      [20, 0.8], [24, 0.8],           // Exits barely used
    ]),
  },
  IN_GAME_1: {
    key:   'IN_GAME_1',
    label: 'In-Game',
    hotZones: new Map([
      [12, 1.9],                       // Center court packed
      [1, 1.8], [3, 1.8],             // Stands full
      [17, 1.7],                       // South stands watching
      [6, 0.4], [7, 0.4],             // Food court emptied out
      [16, 0.3],                       // Restrooms quiet
      [0, 0.4], [4, 0.4],             // Gates deserted
      [20, 0.3], [24, 0.3],           // Exits deserted
    ]),
  },
  HALFTIME: {
    key:   'HALFTIME',
    label: 'Halftime',
    hotZones: new Map([
      [6, 2.0], [7, 2.0],             // Food court overwhelmed
      [16, 1.9],                       // Restrooms peak
      [11, 1.7], [13, 1.7],           // Concourses congested
      [8, 1.6],                        // Merch store busy
      [5, 1.5], [9, 1.5],             // Wings used as overflow
      [12, 0.5],                       // Pitch/court empty
      [1, 0.6], [3, 0.6],             // Stands clearing
      [0, 0.4], [4, 0.4],             // Gates closed
    ]),
  },
  IN_GAME_2: {
    key:   'IN_GAME_2',
    label: 'In-Game',
    hotZones: new Map([
      [12, 1.8],                       // Center court full again
      [1, 1.7], [3, 1.7],
      [17, 1.6],
      [6, 0.5], [7, 0.5],
      [16, 0.4],
      [0, 0.3], [4, 0.3],
      [20, 1.2], [24, 1.2],           // Exits starting to trickle (early leavers)
    ]),
  },
  POST_GAME: {
    key:   'POST_GAME',
    label: 'Post-Game',
    hotZones: new Map([
      [20, 2.0], [24, 2.0],           // Exits overwhelmed
      [22, 1.9],                       // South exit maxed
      [21, 1.8], [23, 1.8],           // Parking full
      [0, 1.7], [4, 1.7],             // Gates used as exits
      [11, 1.5], [13, 1.5],           // Concourses channeling crowd
      [12, 0.3],                       // Pitch empty
      [6, 0.4], [7, 0.4],             // Food court closing
      [1, 0.5], [3, 0.5],             // Stands emptying
    ]),
  },
};

/**
 * Determine current event phase from real time (20-minute cycle).
 * @returns {{ key: string, label: string, hotZones: Map }}
 */
export function getEventPhase() {
  const m = new Date().getMinutes() % 20;
  if (m < 4)  return PHASES.PRE_GAME;
  if (m < 12) return PHASES.IN_GAME_1;
  if (m < 15) return PHASES.HALFTIME;
  if (m < 19) return PHASES.IN_GAME_2;
  return PHASES.POST_GAME;
}

// ── Base state (resting crowd distribution) ──────────────────────────────────

const BASE_PERCENTAGES = [
  20, 45, 70, 45, 18,
  22, 60, 65, 48, 20,
  25, 40, 35, 55, 42,
  38, 22, 42, 18, 15,
  55, 40, 22, 38, 15,
];

/**
 * Generate phase-aware randomized zone data.
 * Phase multipliers shift the base percentages to mirror real crowd behaviour.
 * ±12% jitter added on top for natural variation.
 *
 * @returns {{ zones: string[], crowdPercentages: number[], phase: object }}
 */
export function generateRandomizedZones() {
  const phase = getEventPhase();
  const zones = [];
  const percentages = [];

  for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
    const base       = BASE_PERCENTAGES[i];
    const multiplier = phase.hotZones.get(i) ?? 1.0;
    const jitter     = Math.floor((Math.random() - 0.5) * 24); // ±12%
    const pct        = Math.max(5, Math.min(99, Math.round(base * multiplier) + jitter));

    percentages.push(pct);

    if      (pct >= 65) zones.push('high');
    else if (pct >= 35) zones.push('medium');
    else                zones.push('low');
  }

  return { zones, crowdPercentages: percentages, phase };
}

// ── Static fallback & metadata ────────────────────────────────────────────────

export const zones = [
  'low',    'medium', 'high',   'medium', 'low',
  'low',    'high',   'high',   'medium', 'low',
  'low',    'medium', 'low',    'high',   'medium',
  'medium', 'low',    'medium', 'low',    'low',
  'high',   'medium', 'low',    'medium', 'low',
];

export const destinations = [
  { key: 'food',     label: 'Food Court',        gridIndex: 6  },
  { key: 'exit',     label: 'Main Entry',         gridIndex: 2  },
  { key: 'restroom', label: 'Restrooms',          gridIndex: 16 },
  { key: 'merch',    label: 'Merchandise Store',  gridIndex: 8  },
  { key: 'south',    label: 'South Exit',         gridIndex: 22 },
];

export const DEFAULT_USER_POS = 12;

// ── Helpers ──────────────────────────────────────────────────────────────────

export function indexToCoord(index) {
  return { x: index % GRID_SIZE, y: Math.floor(index / GRID_SIZE) };
}

export function coordToIndex({ x, y }) {
  return y * GRID_SIZE + x;
}

export function isValidIndex(index) {
  return Number.isInteger(index) && index >= 0 && index < GRID_SIZE * GRID_SIZE;
}

export function getDestinationByKey(key) {
  return destinations.find(d => d.key === key) ?? null;
}
