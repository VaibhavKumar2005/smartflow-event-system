/**
 * backend/routes/stadium.js
 * ─────────────────────────────────────────────────────────────
 * GET /api/stadium-state
 *
 * Returns all the data the frontend needs to bootstrap:
 * the zone grid, destination registry, default user position,
 * crowd percentages, and grid dimensions.
 *
 * Each call returns a fresh randomized snapshot to simulate
 * real-time crowd sensor data.
 */

import { Router } from 'express';
import {
  zoneLabels,
  destinations,
  DEFAULT_USER_POS,
  GRID_SIZE,
  generateRandomizedZones,
} from '../data/stadium.js';

const router = Router();

router.get('/stadium-state', (req, res) => {
  const { zones, crowdPercentages } = generateRandomizedZones();

  res.json({
    zones,
    zoneLabels,
    crowdPercentages,
    destinations,
    userPos:  DEFAULT_USER_POS,
    gridSize: GRID_SIZE,
    timestamp: new Date().toISOString(),
  });
});

export default router;
