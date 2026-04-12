/**
 * backend/validators/routeValidator.js
 * ─────────────────────────────────────────────────────────────
 * Zod schema for POST /api/suggest-route request body.
 * Validation lives in its own file so it can be reused and tested
 * independently of Express.
 */

import { z } from 'zod';
import { GRID_SIZE, destinations, coordToIndex } from '../data/stadium.js';

const MAX_INDEX       = GRID_SIZE * GRID_SIZE - 1;
const VALID_DEST_KEYS = destinations.map(d => d.key);

/**
 * userLocation accepts two formats:
 *   - Flat index:    12
 *   - Coordinate:   { "x": 2, "y": 2 }
 *
 * Both are normalised to a flat index before any business logic runs.
 */
const coordSchema = z.object({
  x: z.number().int().min(0).max(GRID_SIZE - 1),
  y: z.number().int().min(0).max(GRID_SIZE - 1),
});

const flatIndexSchema = z
  .number({
    required_error:     'userLocation is required.',
    invalid_type_error: 'userLocation must be a number or {x, y} object.',
  })
  .int('userLocation must be an integer.')
  .min(0, 'userLocation must be >= 0.')
  .max(MAX_INDEX, `userLocation must be <= ${MAX_INDEX}.`);

export const suggestRouteSchema = z.object({
  /**
   * Flat grid index OR {x, y} coordinate object.
   * Both formats are accepted; see normaliseUserLocation() below.
   */
  userLocation: z.union([flatIndexSchema, coordSchema], {
    errorMap: () => ({ message: 'userLocation must be an integer (0–24) or {x, y} coordinate object.' }),
  }),

  /**
   * Destination key from the destinations registry.
   */
  destKey: z
    .string({
      required_error:     'destKey is required.',
      invalid_type_error: 'destKey must be a string.',
    })
    .refine(
      val => VALID_DEST_KEYS.includes(val),
      val => ({ message: `"${val}" is not a valid destKey. Must be one of: ${VALID_DEST_KEYS.join(', ')}.` })
    ),
});

/**
 * Normalise userLocation to a flat grid index regardless of input format.
 * Call this after schema validation passes.
 *
 * @param {number | {x: number, y: number}} userLocation
 * @returns {number} flat grid index
 */
export function normaliseUserLocation(userLocation) {
  if (typeof userLocation === 'number') return userLocation;
  return coordToIndex(userLocation);
}
