/**
 * backend/routes/route.js
 * ─────────────────────────────────────────────────────────────
 * POST /api/suggest-route
 *
 * Request body:
 *   { "userLocation": 12, "destKey": "food", "crowdData": [...], "crowdPercentages": [...] }
 *
 * Response:
 *   {
 *     "path": [12, 11, 10, 5, 4],
 *     "pathCoords": [{ "x": 2, "y": 2 }, ...],
 *     "destination": { "key": "food", "label": "Food Court", "gridIndex": 4 },
 *     "recommendation": "...",
 *     "avoidZoneLabels": ["Food Court", "Main Entry"],
 *     "timeSaved": "~4 minutes",
 *     "routeReason": "...",
 *     "riskLevel": "low",
 *     "confidence": "high"
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

    const { userLocation: rawLocation, destKey, crowdData, crowdPercentages } = parsed.data;
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
        confidence: 'high',
      });
    }

    // ── 3. Pathfinding (deterministic, backend-only) ───────────
    // Use frontend's crowd snapshot if provided, otherwise fall back to static data
    const activeZones = crowdData ?? zones;
    const path = findBestPath(userLocation, destination.gridIndex, activeZones);
    if (path.length === 0) {
      return next(createError(
        'No viable path found between the given locations.',
        'NO_PATH',
        500,
      ));
    }

    const allHighZones = getAllHighDensityZones(activeZones);

    // ── 4. AI explanation (structured, with graceful fallback) ──
    let aiResult;
    try {
      aiResult = await getRouteExplanation({
        userLocation,
        destination,
        path,
        zones: activeZones,
        allHighZones,
        crowdPercentages: crowdPercentages ?? null,
      });
    } catch (aiErr) {
      // Gemini failure must NOT kill the route response.
      // The path is already known — return it with a safe default explanation.
      console.error(`[GEMINI] explanation failed: ${aiErr.message}`);
      aiResult = {
        recommendation: `Optimal path to ${destination.label} computed via ${path.length} zones, bypassing ${allHighZones.length} high-density areas.`,
        avoidZoneLabels: allHighZones,
        timeSaved:   '~3 min',
        routeReason: 'Low-density perimeter route selected by pathfinder.',
        riskLevel:   'low',
        confidence:  'high',
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
