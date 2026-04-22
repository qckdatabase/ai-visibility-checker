# syntax=docker/dockerfile:1.7
# Multi-stage build: FE (Vite) + BE (Express/TS) → single Node runtime.
# Build context must be the repo root (see railway.json).

# ---------- Stage 1: frontend build ----------
FROM node:22-alpine AS frontend-build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
RUN npm run build

# ---------- Stage 2: server build ----------
FROM node:22-alpine AS server-build
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY server/tsconfig.json ./
COPY server/src ./src
RUN npx tsc

# ---------- Stage 3: server prod deps ----------
FROM node:22-alpine AS server-deps
WORKDIR /app/server
COPY server/package.json server/package-lock.json ./
RUN npm ci --omit=dev --no-audit --no-fund

# ---------- Stage 4: runtime ----------
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
ENV STATIC_DIR=/app/public
WORKDIR /app/server
COPY --from=server-deps /app/server/node_modules ./node_modules
COPY --from=server-build /app/server/dist ./dist
COPY server/package.json ./package.json
COPY --from=frontend-build /app/dist /app/public
EXPOSE 8787
CMD ["node", "dist/index.js"]
