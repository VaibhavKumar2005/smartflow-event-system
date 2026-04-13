/**
 * backend/routes/stadium.js
 * ─────────────────────────────────────────────────────────────
 * GET /api/stadium-state
 *
 * Returns all the data the frontend needs to bootstrap:
 * the zone grid, destination registry, default user position,
 * and grid dimensions. The frontend never has hardcoded state.
 */

import { Router } from 'express';
import {
  zones,
  zoneLabels,
  destinations,
  DEFAULT_USER_POS,
  GRID_SIZE,
} from '../data/stadium.js';

const router = Router();

router.get('/stadium-state', (req, res) => {
  res.json({
    zones,
    zoneLabels,
    destinations,
    userPos:  DEFAULT_USER_POS,
    gridSize: GRID_SIZE,
  });
});

export default router;
