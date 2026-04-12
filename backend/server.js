/**
 * backend/server.js
 * ─────────────────────────────────────────────────────────────
 * Entry point. Responsible ONLY for:
 *   1. Loading environment config
 *   2. Wiring security + logging middleware
 *   3. Mounting route modules
 *   4. Starting the HTTP server
 *
 * Business logic lives in routes/, services/, and validators/.
 */

import express  from 'express';
import cors     from 'cors';
import helmet   from 'helmet';
import rateLimit from 'express-rate-limit';
import morgan   from 'morgan';
import dotenv   from 'dotenv';

import stadiumRouter     from './routes/stadium.js';
import routeRouter       from './routes/route.js';
import { errorHandler }  from './middleware/errorHandler.js';

dotenv.config();

const app = express();

// ── Security headers ─────────────────────────────────────────
// helmet sets X-Frame-Options, X-Content-Type-Options, etc.
app.use(helmet());

// ── CORS ─────────────────────────────────────────────────────
// Lock to ALLOWED_ORIGIN in production; open in dev.
app.use(cors({
  origin:         process.env.ALLOWED_ORIGIN || '*',
  methods:        ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
}));

// ── Rate limiting ─────────────────────────────────────────────
// Applied to /api/* only. Protects Gemini quota and prevents abuse.
const limiter = rateLimit({
  windowMs: 60 * 1_000,                                      // 1 minute window
  max:      parseInt(process.env.RATE_LIMIT_MAX ?? '30', 10), // requests per window
  standardHeaders: true,
  legacyHeaders:   false,
  handler: (_req, res) => {
    res.status(429).json({
      error:   'RATE_LIMITED',
      message: 'Too many requests — please wait a moment before trying again.',
    });
  },
});
app.use('/api/', limiter);

// ── Request logging ───────────────────────────────────────────
// 'combined' in production (Apache format, great for log aggregators),
// 'dev' locally (colorized, compact).
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Body parsing ──────────────────────────────────────────────
// Hard 10 KB cap prevents oversized JSON payloads.
app.use(express.json({ limit: '10kb' }));

// ── Routes ────────────────────────────────────────────────────
app.use('/api', stadiumRouter);
app.use('/api', routeRouter);

// ── 404 ───────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    error:   'NOT_FOUND',
    message: `${req.method} ${req.path} is not a valid endpoint.`,
  });
});

// ── Centralized error handler ─────────────────────────────────
// Must be the last middleware — Express identifies it by arity (4 args).
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT ?? '3000', 10);
app.listen(PORT, () => {
  const env = process.env.NODE_ENV ?? 'development';
  console.log(`🚀 SmartFlow backend running on http://localhost:${PORT} [${env}]`);
});
