/**
 * backend/routes/stadium.js
 * GET /api/stadium-state
 *
 * Now returns eventPhase and venueCapacity alongside zone data.
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
  const { zones, crowdPercentages, phase } = generateRandomizedZones();

  // Venue capacity = average occupancy across all zones
  const venueCapacity = Math.round(
    crowdPercentages.reduce((s, p) => s + p, 0) / crowdPercentages.length
  );

  res.json({
    zones,
    zoneLabels,
    crowdPercentages,
    destinations,
    userPos:       DEFAULT_USER_POS,
    gridSize:      GRID_SIZE,
    timestamp:     new Date().toISOString(),
    eventPhase:    phase.key,
    eventPhaseLabel: phase.label,
    venueCapacity,
  });
});

export default router;
