# SmartFlow Event System

AI-powered stadium crowd routing — real-time heatmap, Dijkstra pathfinding, and Gemini-generated route explanations.

---

## Architecture

```
Browser (Vanilla JS + CSS)
       │
       ├── GET  /api/stadium-state   → fetch zones + destinations on load
       └── POST /api/suggest-route   → send {userLocation, destKey}
                                        ← receive {path, riskLevel, recommendation, ...}

Express Backend (Node.js ESM)
       ├── middleware:  helmet · cors · express-rate-limit · morgan
       ├── routes/      stadium.js · route.js
       ├── services/    pathfinder.js (Dijkstra) · gemini.js (structured output)
       ├── validators/  routeValidator.js (Zod)
       ├── middleware/  errorHandler.js
       └── data/        stadium.js  ← swap for DB/sensor feed here
```

---

## Prerequisites

- Node.js ≥ 18
- A [Gemini API key](https://aistudio.google.com/app/apikey)

---

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_key_here
npm install
npm run dev          # starts on http://localhost:3000 with --watch
```

### 2. Frontend

Serve with any static server. The simplest option:

```bash
# From the project root
npx serve frontend
```

Or open `frontend/index.html` directly in a browser — it works from `file://` for local development.

---

## Environment Variables

| Variable          | Required | Default       | Description                                                      |
|-------------------|----------|---------------|------------------------------------------------------------------|
| `GEMINI_API_KEY`  | ✅ Yes   | —             | Your Gemini API key from Google AI Studio                        |
| `PORT`            | No       | `3000`        | Port the Express server listens on                               |
| `NODE_ENV`        | No       | `development` | `production` enables combined morgan logs, hides error stack     |
| `ALLOWED_ORIGIN`  | No       | `*`           | Lock CORS to your frontend URL in production (e.g. Vercel URL)   |
| `RATE_LIMIT_MAX`  | No       | `30`          | Max requests per IP per minute on `/api/*`                       |

---

## API Reference

### `GET /api/stadium-state`

Returns the stadium grid, destination registry, and default user position. Called once on page load.

**Response:**
```json
{
  "zones": ["low", "medium", "high", ...],
  "destinations": [
    { "key": "food",     "label": "Food Stall Zone A", "gridIndex": 4  },
    { "key": "exit",     "label": "North Exit Gate",    "gridIndex": 2  },
    { "key": "washroom", "label": "Main Washroom",      "gridIndex": 20 }
  ],
  "userPos": 12,
  "gridSize": 5
}
```

---

### `POST /api/suggest-route`

Computes the optimal crowd-avoiding route and returns an AI explanation.

**Request:**
```json
{ "userLocation": 12, "destKey": "food" }
```

| Field          | Type   | Rules                                  |
|----------------|--------|---------------------------------------|
| `userLocation` | number | Integer, 0–24                          |
| `destKey`      | string | Must exist in the destinations registry |

**Response:**
```json
{
  "path":            [12, 11, 10, 5, 4],
  "pathCoords":      [{"x":2,"y":2}, {"x":1,"y":2}, {"x":0,"y":2}, {"x":0,"y":1}, {"x":4,"y":0}],
  "destination":     { "key": "food", "label": "Food Stall Zone A", "gridIndex": 4 },
  "recommendation":  "Route navigates via low-density perimeter, bypassing Zone 6 and Zone 7.",
  "avoidZoneLabels": ["Zone 6 (high)", "Zone 7 (high)"],
  "timeSaved":       "~4 minutes",
  "routeReason":     "Direct path blocked by high-density cluster; perimeter route selected.",
  "riskLevel":       "low"
}
```

**Error responses:**
```json
{ "error": "INVALID_INPUT", "message": "userLocation must be an integer." }
{ "error": "INVALID_DEST",  "message": "\"foo\" is not a valid destKey." }
{ "error": "NO_PATH",       "message": "No viable path found between the given locations." }
{ "error": "RATE_LIMITED",  "message": "Too many requests — please wait a moment." }
```

---

## Folder Structure

```
smartflow-event-system/
├── README.md
├── frontend/
│   ├── index.html          ← Dashboard UI
│   ├── app.js              ← API client, state, rendering
│   └── styles.css          ← Design system + component styles
└── backend/
    ├── .env.example
    ├── package.json
    ├── server.js           ← Middleware + route mounting only
    ├── data/
    │   └── stadium.js      ← Zone array + destination registry
    ├── routes/
    │   ├── stadium.js      ← GET /api/stadium-state
    │   └── route.js        ← POST /api/suggest-route
    ├── services/
    │   ├── pathfinder.js   ← Dijkstra (backend-only)
    │   └── gemini.js       ← Structured output AI call
    ├── validators/
    │   └── routeValidator.js  ← Zod input schema
    └── middleware/
        └── errorHandler.js    ← Centralized error handling
```

---

## Deployment

### Frontend → Vercel / Netlify

Drop the `frontend/` folder into Vercel or Netlify as a static site. No build step required.  
Set `CONFIG.API_BASE` in `frontend/app.js` to your deployed backend URL before deploying.

### Backend → Render / Railway / GCP Cloud Run

1. Push the `backend/` folder (or the whole repo with a root-level `package.json` pointing to `backend/`).
2. Set all environment variables (`GEMINI_API_KEY`, `NODE_ENV=production`, `ALLOWED_ORIGIN=https://your-frontend.vercel.app`).
3. Start command: `node server.js`

**Scaling notes:**
- The current in-memory crowd data (`data/stadium.js`) is stateless and safe for multiple instances.
- When you add real sensor data, use a shared store (Redis, Firestore) so all instances see the same state.
- The Gemini API key should be rotated through Google Cloud Secret Manager in production.

---

## Replacing Demo Data with Real Sensor Data

The entire data contract lives in `backend/data/stadium.js`. To integrate real sensor data:

```js
// backend/data/stadium.js
export async function getZones() {
  const snapshot = await db.collection('zones').get(); // Firestore example
  return snapshot.docs.map(d => d.data().density);
}
```

Update `backend/routes/stadium.js` to call `await getZones()` instead of importing the static array.  
No changes to any other file required.
