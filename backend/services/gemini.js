/**
 * backend/services/gemini.js
 * ─────────────────────────────────────────────────────────────
 * Gemini integration with STRUCTURED OUTPUT.
 *
 * Key design decisions:
 * 1. Gemini is only responsible for the EXPLANATION layer —
 *    pathfinding is done deterministically in pathfinder.js first.
 * 2. `responseMimeType: "application/json"` + `responseSchema`
 *    guarantees the response is parseable JSON with known fields.
 *    No more fragile text parsing or prompt-engineering hacks.
 * 3. The caller (route.js) owns the fallback — if Gemini fails,
 *    the route still responds with path data and a default message.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { zoneLabels } from '../data/stadium.js';

/**
 * Structured output schema.
 */
const ROUTE_SCHEMA = {
  type: 'object',
  properties: {
    recommendation: {
      type: 'string',
      description: '1–2 sentence route recommendation. Confident system-output tone. Reference specific location NAMES (e.g. "Food Court", "Gate A"), never raw indices. No "I suggest". No disclaimers.',
    },
    avoidZoneLabels: {
      type: 'array',
      items: { type: 'string' },
      description: 'Location names to avoid — use descriptive labels like "Food Court", "Main Entry". NOT raw zone indices.',
    },
    timeSaved: {
      type: 'string',
      description: 'Estimated time saved vs a direct route through congestion, e.g. "~5 min" or "3–5 min".',
    },
    routeReason: {
      type: 'string',
      description: 'One clear sentence explaining WHY this path was chosen, referencing specific congestion zones by name.',
    },
    riskLevel: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      description: 'Overall risk level of the suggested route.',
    },
    confidence: {
      type: 'string',
      enum: ['high', 'medium', 'low'],
      description: 'AI confidence in the recommendation. High = clear optimal path, Low = multiple risky zones unavoidable.',
    },
  },
  required: ['recommendation', 'avoidZoneLabels', 'timeSaved', 'routeReason', 'riskLevel', 'confidence'],
};

// Lazily initialised — we don't throw at module load so the server can
// start without a key and route.js can fall back gracefully.
let _model = null;
function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set. Add it to your .env file.');
  }
  if (!_model) {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    _model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: ROUTE_SCHEMA,
      },
    });
  }
  return _model;
}

/**
 * Build a labeled map string for the prompt so Gemini references
 * real location names, not "Zone 6".
 */
function buildGridDescription(zones) {
  const rows = [];
  for (let r = 0; r < 5; r++) {
    const cells = [];
    for (let c = 0; c < 5; c++) {
      const i = r * 5 + c;
      cells.push(`${zoneLabels[i]} (${zones[i]})`);
    }
    rows.push(`  Row ${r}: ${cells.join(' | ')}`);
  }
  return rows.join('\n');
}

/**
 * Get a structured AI explanation for a pre-computed route.
 * Gemini does NOT do pathfinding — the path is already computed.
 * Gemini only adds the human-readable explanation layer.
 */
export async function getRouteExplanation({
  userLocation,
  destination,
  path,
  zones,
  allHighZones,
}) {
  // Map path indices to location names for the prompt
  const pathNames = path.map(i => zoneLabels[i]);
  const avoidNames = allHighZones.map(z => {
    const idx = parseInt(z.replace('Zone ', ''));
    return isNaN(idx) ? z : zoneLabels[idx];
  });

  const prompt = `
You are the SmartFlow AI — a real-time crowd intelligence engine for stadium operations.

VENUE LAYOUT (5×5 grid, each cell = a named zone with crowd density):
${buildGridDescription(zones)}

ROUTING CONTEXT:
- User is at: ${zoneLabels[userLocation]} (index ${userLocation})
- Destination: ${destination.label} (index ${destination.gridIndex})
- Computed optimal path: ${pathNames.join(' → ')} (${path.length} zones)
- High-congestion areas to avoid: ${avoidNames.join(', ')}

YOUR JOB — generate a smart, structured route briefing:

1. RECOMMENDATION: Write 1–2 sentences as if you are a live operations system displaying on a dashboard. Reference LOCATION NAMES, not indices. Be direct: "Route via West Wing and Section W bypasses Food Court congestion."

2. AVOID ZONES: List the specific high-density LOCATION NAMES the route avoids (e.g., "Food Court", "Main Entry").

3. TIME SAVED: Estimate realistic time savings vs walking through congestion (e.g., "~4 min", "3–5 min").

4. ROUTE REASON: One clear sentence — why THIS path. Mention the specific bottleneck it avoids.

5. RISK LEVEL: Overall crowd-risk of the path (low/medium/high).

6. CONFIDENCE: Your confidence in this being optimal (high/medium/low).

TONE:
- Sound like a live operations display, not a chatbot.
- Never say "I suggest", "I recommend", "please".
- Be specific. Name real locations. Be concise.
`.trim();

  const result = await getModel().generateContent(prompt);
  const text   = result.response.text();

  return JSON.parse(text);
}
