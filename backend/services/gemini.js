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

/**
 * Structured output schema.
 * Using string literals ('OBJECT', 'STRING', etc.) for maximum
 * compatibility across SDK patch versions.
 */
const ROUTE_SCHEMA = {
  type: 'object',
  properties: {
    recommendation: {
      type: 'string',
      description: '1–2 sentence route recommendation in confident, system-output tone. No "I suggest". No disclaimers.',
    },
    avoidZoneLabels: {
      type: 'array',
      items: { type: 'string' },
      description: 'Specific zone labels to avoid, e.g. ["Zone 6 (high)", "Zone 7 (high)"]',
    },
    timeSaved: {
      type: 'string',
      description: 'Estimated time saved vs direct route, e.g. "~4 minutes"',
    },
    routeReason: {
      type: 'string',
      description: 'One-sentence technical reason for the path choice.',
    },
    riskLevel: {
      type: 'string',
      enum: ['low', 'medium', 'high'],
      description: 'Overall risk level of the suggested route.',
    },
  },
  required: ['recommendation', 'avoidZoneLabels', 'timeSaved', 'routeReason', 'riskLevel'],
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
 * Get a structured AI explanation for a pre-computed route.
 * Gemini does NOT do pathfinding — the path is already computed.
 * Gemini only adds the human-readable explanation layer.
 *
 * @param {object} params
 * @param {number}   params.userLocation    Start grid index
 * @param {object}   params.destination     { key, label, gridIndex }
 * @param {number[]} params.path            Computed optimal path
 * @param {string[]} params.zones           Full zone density array
 * @param {string[]} params.allHighZones    All high-density zone labels in stadium
 * @returns {Promise<{recommendation, avoidZoneLabels, timeSaved, routeReason, riskLevel}>}
 */
export async function getRouteExplanation({
  userLocation,
  destination,
  path,
  zones,
  allHighZones,
}) {
  const prompt = `
You are a real-time AI routing module embedded in SmartFlow, a stadium crowd management system.

SYSTEM STATE:
- User grid index: ${userLocation}
- Destination: ${destination.label} (grid index ${destination.gridIndex})
- Computed optimal path (indices): [${path.join(', ')}] — ${path.length} zones
- High-density zones in stadium: [${allHighZones.join(', ')}]
- Full grid (25 zones, index 0–24): ${JSON.stringify(zones)}

PATHFINDING IS ALREADY DONE. Your ONLY job:
1. Write a confident, direct 1–2 sentence system-output recommendation.
2. Name the high-density zones that the route avoids or that the user should be aware of.
3. Estimate time saved versus the direct route.
4. Give a brief technical reason for the chosen path.
5. Assess the overall route risk level.

STRICT TONE RULES:
- Sound like a live operations system, not a chatbot or assistant.
- Do NOT use "I suggest", "I recommend", "please", or any hedging language.
- Do NOT add disclaimers or caveats.
- Be specific (mention zone indices, density levels).
- Be concise.
`.trim();

  const result = await getModel().generateContent(prompt);
  const text   = result.response.text();

  // With responseMimeType: "application/json", this is always valid JSON.
  // If somehow not, let the error propagate — route.js handles it.
  return JSON.parse(text);
}
