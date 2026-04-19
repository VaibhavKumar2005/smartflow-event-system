# ─────────────────────────────────────────────────────────────────
# Stage 1: Build Vite frontend
# ─────────────────────────────────────────────────────────────────
FROM node:20-slim AS frontend-builder

WORKDIR /app/frontend

# Install deps first (cache layer)
COPY frontend/package*.json ./
RUN npm ci

# Copy source and build
# VITE_API_URL is empty string here so the frontend uses /api (same origin)
COPY frontend/ ./
RUN npm run build

# ─────────────────────────────────────────────────────────────────
# Stage 2: Production — Node backend + static frontend
# ─────────────────────────────────────────────────────────────────
FROM node:20-slim

WORKDIR /app

# Install backend deps
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy backend source
COPY backend/ ./

# Copy built frontend into backend's public directory
COPY --from=frontend-builder /app/frontend/dist ./public

# Serve static files from Express (add this to server.js via env flag)
ENV SERVE_STATIC=true
ENV NODE_ENV=production

# Cloud Run sets PORT automatically
EXPOSE 8080

CMD ["node", "server.js"]
