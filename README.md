# SmartFlow — AI-Powered Stadium Crowd Intelligence

> **Real-time crowd routing for large-scale sporting events.**  
> SmartFlow uses live GPS tracking, AI-driven pathfinding, and event-phase simulation to guide attendees through congested venues — reducing wait times, preventing crowd crushes, and improving the overall live event experience.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://smartflow-event-system.vercel.app)
[![Backend](https://img.shields.io/badge/API-Render-46E3B7?logo=render)](https://smartflow-backend.onrender.com)

---

## The Problem

Large sporting venues face three critical crowd management failures:

| Problem | Impact |
|---|---|
| Unpredictable crowd surges | Bottlenecks at gates, food courts, exits |
| No real-time routing | Attendees walk into congestion blindly |
| Static operations | Staff can't react to halftime / post-game surges |

---

## The Solution

SmartFlow is an **AI-powered crowd intelligence dashboard** that:

1. **Tracks live location** via browser GPS — maps each attendee to a stadium grid zone in real time
2. **Computes optimal routes** using Dijkstra pathfinding that avoids high-density zones
3. **Generates AI explanations** via Google Gemini, with context about the current event phase
4. **Simulates realistic crowd patterns** driven by event phases (Pre-Game → In-Game → Halftime → Post-Game)
5. **Detects surges** — alerts fire when a zone's density jumps 25%+ in a single 8-second tick

---

## Live Features

| Feature | Technology |
|---|---|
| Live GPS tracking | `navigator.geolocation.watchPosition()` |
| Automatic GPS → grid mapping | Stadium bounding box coordinate math |
| GPS simulation fallback | 8-second walk cycle (for indoor demos) |
| Real-time heatmap (8s refresh) | Express REST API + React polling |
| Event phase crowd simulation | 5-phase engine with zone multipliers |
| Crowd surge detection | Δ≥25% between snapshots triggers alert |
| AI route explanation | Google Gemini 2.5 Flash (structured JSON output) |
| Phase-aware AI prompts | Halftime / Post-game context injected into Gemini |
| Dijkstra pathfinding | Weighted graph with density-based edge costs |

---

## System Architecture

```
Browser (React + Vite + Tailwind)
│
├── useGeolocation()      ← GPS watchPosition → grid cell index
├── useStadiumState()     ← 8s polling loop, surge detection, KPIs
│
├── GET  /api/stadium-state   → zones, crowdPercentages, eventPhase, venueCapacity
└── POST /api/suggest-route   → path, recommendation, timeSaved, riskLevel

Express Backend (Node.js ESM)
├── data/stadium.js       ← 5-phase crowd engine with zone multipliers
├── services/pathfinder   ← Dijkstra weighted by density
├── services/gemini.js    ← Structured output + event phase context
├── validators/           ← Zod schema validation
└── middleware/           ← Helmet, CORS, rate-limit, Morgan
```

---

## Event Phase Engine

The crowd simulation cycles through 5 realistic phases every 20 minutes (real-time clock):

| Phase | Duration | Crowd Behaviour |
|---|---|---|
| **Pre-Game** | 0–3 min | Gates surge, seating fills, food courts quiet |
| **In-Game (1st)** | 4–11 min | Stands packed, concourses clear |
| **Halftime** | 12–14 min | Food courts + restrooms overwhelmed |
| **In-Game (2nd)** | 15–18 min | Stands refill, early exit trickle starts |
| **Post-Game** | 19 min | All exits + parking surge simultaneously |

Each phase applies zone-level multipliers to the base crowd percentages. The AI prompt receives the current phase as explicit context, so Gemini's routing advice is phase-specific.

---

## GPS Tracking System

```js
// Jawaharlal Nehru Stadium, New Delhi (configurable per venue)
const STADIUM_BOUNDS = {
  north: 28.5670, south: 28.5640,
  west:  77.2360, east:  77.2400,
}

// Maps (lat, lng) → 5×5 grid cell index
function coordToGridIndex(lat, lng, bounds) { ... }
```

- Uses `navigator.geolocation.watchPosition` for continuous updates
- GPS accuracy displayed live in the navbar (e.g. `GPS ±8m`)
- Outside stadium bounds: falls back to server default position
- No GPS signal / permission denied: simulation mode auto-activates
- Simulation walks a predefined path through the stadium every 8 seconds

---

## API Reference

### `GET /api/stadium-state`

```json
{
  "zones":            ["low", "medium", "high", ...],
  "crowdPercentages": [18, 45, 91, ...],
  "zoneLabels":       { "0": "Gate A", "6": "Food Court", ... },
  "destinations":     [{ "key": "food", "label": "Food Court", "gridIndex": 6 }],
  "userPos":          12,
  "gridSize":         5,
  "eventPhase":       "HALFTIME",
  "eventPhaseLabel":  "Halftime",
  "venueCapacity":    67,
  "timestamp":        "2026-04-20T16:15:00.000Z"
}
```

### `POST /api/suggest-route`

**Request:**
```json
{
  "userLocation":     12,
  "destKey":          "food",
  "crowdData":        ["low", "medium", "high", ...],
  "crowdPercentages": [18, 45, 91, ...]
}
```

**Response:**
```json
{
  "path":            [12, 11, 10, 5, 6],
  "pathCoords":      [{ "x": 2, "y": 2 }, ...],
  "destination":     { "key": "food", "label": "Food Court", "gridIndex": 6 },
  "recommendation":  "Route via Concourse W bypasses Food Court congestion at 91%. ~4 min saved.",
  "avoidZoneLabels": ["Food Court", "Main Entry"],
  "timeSaved":       "~4 min",
  "routeReason":     "Direct path blocked by halftime surge; perimeter via West Wing selected.",
  "riskLevel":       "low",
  "confidence":      "high"
}
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + Tailwind CSS |
| Animations | Framer Motion |
| Charts | Recharts |
| Icons | Lucide React |
| Backend | Node.js + Express (ESM) |
| AI | Google Gemini 2.5 Flash (structured JSON output) |
| Validation | Zod |
| Security | Helmet, express-rate-limit, CORS |

---

## Setup

### Prerequisites
- Node.js ≥ 18
- [Gemini API key](https://aistudio.google.com/app/apikey)

### Backend

```bash
cd backend
cp .env.example .env
# Add GEMINI_API_KEY=your_key_here to .env
npm install
npm run dev        # http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | ✅ | Google AI Studio API key |
| `PORT` | No (default: 3000) | Express server port |
| `NODE_ENV` | No | `production` enables combined logs |
| `ALLOWED_ORIGIN` | No | Lock CORS to frontend URL in production |
| `RATE_LIMIT_MAX` | No (default: 30) | Requests per IP per minute |

---

## Deployment

### Frontend → Vercel

```bash
cd frontend
npm run build
# Deploy dist/ to Vercel or connect GitHub repo
```

Set `VITE_API_URL` to your backend URL.

### Backend → Render

1. Connect GitHub repo to Render
2. Root directory: `backend/`
3. Start command: `node server.js`
4. Add env vars: `GEMINI_API_KEY`, `NODE_ENV=production`, `ALLOWED_ORIGIN=https://your-app.vercel.app`

---

## Folder Structure

```
smartflow-event-system/
├── README.md
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    ← Root layout, GPS integration
│   │   ├── hooks/
│   │   │   ├── useStadiumState.js     ← Polling, KPIs, surge detection
│   │   │   └── useGeolocation.js      ← GPS tracking + simulation
│   │   ├── components/
│   │   │   ├── Navbar.jsx             ← Phase badge, GPS status, clock
│   │   │   ├── Heatmap.jsx            ← 5×5 grid, route overlay, GPS chip
│   │   │   ├── KpiStrip.jsx           ← Crowd/Wait/Safe/Capacity KPIs
│   │   │   ├── AiPanel.jsx            ← Structured AI recommendation
│   │   │   ├── AlertsPanel.jsx        ← Phase-aware surge alerts
│   │   │   ├── RoutePlanner.jsx       ← Destination selector
│   │   │   ├── TrendChart.jsx         ← Live area chart
│   │   │   └── Toast.jsx              ← Animated notifications
│   │   └── lib/
│   │       ├── api.js                 ← Fetch with retry + timeout
│   │       └── utils.js              ← cn() helper
└── backend/
    ├── server.js                      ← Express entry point
    ├── data/stadium.js                ← Phase engine + zone layout
    ├── routes/stadium.js              ← GET /api/stadium-state
    ├── routes/route.js                ← POST /api/suggest-route
    ├── services/pathfinder.js         ← Dijkstra pathfinding
    ├── services/gemini.js             ← Gemini structured output
    ├── validators/routeValidator.js   ← Zod input schema
    └── middleware/errorHandler.js     ← Centralised error handling
```

---

## Replacing Simulation with Real Sensor Data

The crowd data contract lives entirely in `backend/data/stadium.js`:

```js
// Swap generateRandomizedZones() for a real sensor API call:
export async function generateRandomizedZones() {
  const snapshot = await fetch('https://your-sensor-api/zones').then(r => r.json())
  return {
    zones:            snapshot.densities,   // ["low","high","medium",...]
    crowdPercentages: snapshot.capacities,  // [18, 91, 45, ...]
    phase:            getCurrentPhase(),
  }
}
```

No other file needs to change.

---

*Built for the Physical Event Experience hackathon challenge — improving crowd movement, reducing wait times, and enabling real-time coordination at large-scale sporting venues.*
