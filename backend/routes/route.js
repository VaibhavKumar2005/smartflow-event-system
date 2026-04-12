/**
 * backend/routes/route.js
 * ─────────────────────────────────────────────────────────────
 * POST /api/suggest-route
 *
 * Request body:
 *   { "userLocation": 12, "destKey": "food" }
 *
 * Response:
 *   {
 *     "path": [12, 11, 10, 5, 4],
 *     "pathCoords": [{ "x": 2, "y": 2 }, ...],
 *     "destination": { "key": "food", "label": "Food Stall Zone A", "gridIndex": 4 },
 *     "recommendation": "...",
 *     "avoidZoneLabels": ["Zone 6 (high)", "Zone 7 (high)"],
 *     "timeSaved": "~4 minutes",
 *     "routeReason": "...",
 *     "riskLevel": "low"
 *   }
 *
 * Error responses always follow: { "error": "ERROR_CODE", "message": "..." }
 */

import { Router } from 'express';
import { zones, getDestinationByKey, indexToCoord } from '../data/stadium.js';
import { findBestPath, getAllHighDensityZones } from '../services/pathfinder.js';
import { getRouteExplanation } from '../services/gemini.js';
import { suggestRouteSchema, normaliseUserLocation } from '../validators/routeValidator.js';
import { createError } from '../middleware/errorHandler.js';

const router = Router();

router.post('/suggest-route', async (req, res, next) => {
  try {
    // ── 1. Validate ────────────────────────────────────────────
    const parsed = suggestRouteSchema.safeParse(req.body);
    if (!parsed.success) {
      return next(createError(
        parsed.error.errors[0].message,
        'INVALID_INPUT',
        400,
        parsed.error.errors,
      ));
    }

    const { userLocation: rawLocation, destKey } = parsed.data;
    // Normalise: accepts both flat index (12) and coordinate ({x:2, y:2})
    const userLocation = normaliseUserLocation(rawLocation);

    // ── 2. Destination lookup ──────────────────────────────────
    const destination = getDestinationByKey(destKey);
    if (!destination) {
      // Should be caught by Zod, but guards against data/stadium.js drift
      return next(createError(
        `Destination key "${destKey}" not found in registry.`,
        'INVALID_DEST',
        400,
      ));
    }

    if (userLocation === destination.gridIndex) {
      return res.json({
        path: [userLocation],
        pathCoords: [indexToCoord(userLocation)],
        destination,
        recommendation: `You are already at ${destination.label}.`,
        avoidZoneLabels: [],
        timeSaved: '0 minutes',
        routeReason: 'No movement required.',
        riskLevel: 'low',
      });
    }

    // ── 3. Pathfinding (deterministic, backend-only) ───────────
    const path = findBestPath(userLocation, destination.gridIndex, zones);
    if (path.length === 0) {
      return next(createError(
        'No viable path found between the given locations.',
        'NO_PATH',
        500,
      ));
    }

    const allHighZones = getAllHighDensityZones(zones);

    // ── 4. AI explanation (structured, with graceful fallback) ──
    let aiResult;
    try {
      aiResult = await getRouteExplanation({
        userLocation,
        destination,
        path,
        zones,
        allHighZones,
      });
    } catch (aiErr) {
      // Gemini failure must NOT kill the route response.
      // The path is already known — return it with a safe default explanation.
      console.error(`[GEMINI] explanation failed: ${aiErr.message}`);
      aiResult = {
        recommendation: `Optimal path to ${destination.label} computed via ${path.length} zones, bypassing ${allHighZones.length} high-density areas.`,
        avoidZoneLabels: allHighZones,
        timeSaved:   '~3 minutes',
        routeReason: 'Low-density perimeter route selected by pathfinder.',
        riskLevel:   'low',
      };
    }

    // ── 5. Respond ─────────────────────────────────────────────
    return res.json({
      path,
      pathCoords: path.map(indexToCoord),
      destination: {
        key:       destination.key,
        label:     destination.label,
        gridIndex: destination.gridIndex,
      },
      ...aiResult,
    });

  } catch (err) {
    next(err);
  }
});

export default router;
