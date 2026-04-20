/**
 * backend/services/gemini.js
 * Gemini integration with STRUCTURED OUTPUT + event phase context.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { zoneLabels } from '../data/stadium.js';

const ROUTE_SCHEMA = {
  type: 'object',
  properties: {
    recommendation: {
      type: 'string',
      description: '2-3 concise sentences. Clear recommendation. Mention areas to avoid. Include time estimate. Include confidence level. Do NOT ask questions. Do NOT mention missing data. Do NOT explain like a chatbot. Do NOT add disclaimers.',
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
      description: 'AI confidence in the recommendation.',
    },
  },
  required: ['recommendation', 'avoidZoneLabels', 'timeSaved', 'routeReason', 'riskLevel', 'confidence'],
};

let _model = null;
function getModel() {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set.');
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

function buildGridDescription(zones, percentages) {
  const rows = [];
  for (let r = 0; r < 5; r++) {
    const cells = [];
    for (let c = 0; c < 5; c++) {
      const i   = r * 5 + c;
      const pct = percentages?.[i] != null ? ` ${percentages[i]}%` : '';
      cells.push(`${zoneLabels[i]} (${zones[i]}${pct})`);
    }
    rows.push(`  Row ${r}: ${cells.join(' | ')}`);
  }
  return rows.join('\n');
}

/** Phase-specific context inserted into the AI prompt for more actionable output */
const PHASE_CONTEXT = {
  PRE_GAME:  'The event has not started yet. Gates and entries are the primary bottlenecks as attendees arrive.',
  IN_GAME_1: 'First half is in progress. Seating areas are at peak capacity. Concourses and food areas are quiet.',
  HALFTIME:  'HALFTIME IS ACTIVE. This is peak pressure on food courts, restrooms, and concourses. All concession zones are critically congested.',
  IN_GAME_2: 'Second half is underway. Seating areas have refilled. Early leavers may start heading to exits.',
  POST_GAME: 'The event has ended. ALL exits, parking areas, and concourses are surging simultaneously. This is the highest-risk routing window.',
};

export async function getRouteExplanation({
  userLocation,
  destination,
  path,
  zones,
  allHighZones,
  crowdPercentages,
  eventPhase,
}) {
  const pathNames  = path.map(i => zoneLabels[i]);
  const avoidNames = allHighZones.map(z => {
    const idx = parseInt(z.replace('Zone ', ''));
    return isNaN(idx) ? z : zoneLabels[idx];
  });

  const phaseCtx = PHASE_CONTEXT[eventPhase] ?? 'Event is in progress.';

  const prompt = `
You are the SmartFlow AI — a real-time crowd intelligence engine for stadium operations.
You speak in an operations-center tone: assertive, precise, zero filler.

EVENT PHASE: ${eventPhase?.replace('_', ' ')}
${phaseCtx}

VENUE LAYOUT (5×5 grid, each cell = named zone with density and capacity %):
${buildGridDescription(zones, crowdPercentages)}

ROUTING CONTEXT:
- User is at: ${zoneLabels[userLocation]} (zone ${userLocation})
- Destination: ${destination.label} (zone ${destination.gridIndex})
- Computed optimal path: ${pathNames.join(' → ')} (${path.length} zones)
- High-congestion zones to avoid: ${avoidNames.join(', ') || 'none'}

YOUR JOB — generate a structured route briefing that is specific to the current event phase:

1. RECOMMENDATION: 2–3 sentences. Name the route. Reference the event phase context. Mention congestion areas to avoid.
2. AVOID ZONES: Specific high-density location names.
3. TIME SAVED: Realistic savings vs direct path (e.g. "~4 min"). During halftime/post-game, be more conservative (add 1–2 min).
4. ROUTE REASON: One sentence — why THIS path given CURRENT phase conditions.
5. RISK LEVEL: low/medium/high — factor in event phase (halftime/post-game = inherently higher risk).
6. CONFIDENCE: high/medium/low.

STRICT RULES:
- Do NOT ask questions or hedge
- Reference the event phase explicitly (halftime, post-game, etc.)
- Be direct and operational
`.trim();

  const result = await getModel().generateContent(prompt);
  return JSON.parse(result.response.text());
}
