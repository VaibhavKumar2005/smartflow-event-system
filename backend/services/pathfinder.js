/**
 * backend/services/pathfinder.js
 * ─────────────────────────────────────────────────────────────
 * Dijkstra pathfinder for a square grid of crowd-density zones.
 * Moved server-side so AI explanation and visual path are always
 * computed from the same run — never drift apart.
 */

import { zones as defaultZones, GRID_SIZE } from '../data/stadium.js';

/** Travel-cost weights per density level. High gets a near-infinite
 *  penalty so it is only traversed when there is literally no
 *  other path. */
const WEIGHTS = { low: 1, medium: 3, high: 99 };

/**
 * Find the minimum-cost path from `startIndex` to `destIndex`
 * on a square grid where each cell's cost is determined by its
 * crowd-density level.
 *
 * @param {number}   startIndex  Flat grid index (0 … n²-1)
 * @param {number}   destIndex   Flat grid index
 * @param {string[]} grid        Zone density array (defaults to live stadium data)
 * @returns {number[]}           Ordered list of flat indices from start → dest,
 *                               or [] if no path exists.
 */
export function findBestPath(startIndex, destIndex, grid = defaultZones) {
  const total = GRID_SIZE * GRID_SIZE;
  const distances = new Array(total).fill(Infinity);
  const previous  = new Array(total).fill(null);
  const unvisited = new Set(Array.from({ length: total }, (_, i) => i));

  distances[startIndex] = 0;

  while (unvisited.size > 0) {
    // Pick the unvisited node with lowest tentative distance
    let current = null;
    for (const node of unvisited) {
      if (current === null || distances[node] < distances[current]) {
        current = node;
      }
    }

    if (current === null || distances[current] === Infinity) break; // remaining nodes unreachable
    if (current === destIndex) break; // reached destination

    unvisited.delete(current);

    for (const neighbor of getNeighbors(current)) {
      if (!unvisited.has(neighbor)) continue;
      const alt = distances[current] + WEIGHTS[grid[neighbor]] ?? WEIGHTS.high;
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt;
        previous[neighbor]  = current;
      }
    }
  }

  // Reconstruct path by walking `previous` pointers backwards
  const path = [];
  let cur = destIndex;
  if (previous[cur] === null && cur !== startIndex) return []; // no route

  while (cur !== null) {
    path.unshift(cur);
    cur = previous[cur];
  }

  return path;
}

/**
 * Return the 4-directional (up/down/left/right) neighbours of `index`,
 * respecting grid boundaries so we never wrap around row edges.
 *
 * @param {number} index
 * @returns {number[]}
 */
function getNeighbors(index) {
  const neighbors = [];
  const row = Math.floor(index / GRID_SIZE);
  const col  = index % GRID_SIZE;

  if (row > 0)              neighbors.push(index - GRID_SIZE); // up
  if (row < GRID_SIZE - 1)  neighbors.push(index + GRID_SIZE); // down
  if (col > 0)              neighbors.push(index - 1);          // left
  if (col < GRID_SIZE - 1)  neighbors.push(index + 1);          // right

  return neighbors;
}

/**
 * Classify zones along a given path as high-density.
 * The route handler uses this to tell Gemini which zones to call out.
 *
 * @param {number[]} path
 * @param {string[]} grid
 * @returns {string[]}  e.g. ["Zone 6 (high)", "Zone 7 (high)"]
 */
export function getHighDensityOnPath(path, grid = defaultZones) {
  return path
    .filter(i => grid[i] === 'high')
    .map(i => `Zone ${i} (high)`);
}

/**
 * All high-density zones in the full grid, regardless of path.
 * Passed to Gemini so it can mention what to avoid globally.
 *
 * @param {string[]} grid
 * @returns {string[]}
 */
export function getAllHighDensityZones(grid = defaultZones) {
  return grid
    .map((level, i) => ({ i, level }))
    .filter(z => z.level === 'high')
    .map(z => `Zone ${z.i}`);
}
