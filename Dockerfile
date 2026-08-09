# =========================================================
# ScopeGuard Production Dockerfile (Priority 4 Architecture)
# Multi-stage optimized Node.js runtime container
# =========================================================

# Stage 1: Dependency installation & build base
FROM node:20-alpine AS builder
WORKDIR /app

# Install build tools if necessary
RUN apk add --no-libc6-compat python3 make g++

# Copy package manifests
COPY package.json package-lock.json ./
RUN npm ci

# Copy full application source
COPY . .

# Build application bundle
ENV NODE_ENV=production
RUN npm run build

# Stage 2: Production Minimal Runtime
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Security: Create non-root system user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 scopeguard

# Copy built dist files & production dependencies from builder stage
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/public ./public

# Set permissions
USER scopeguard

EXPOSE 8080

# Health check instruction inside container
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["node", ".output/server/index.mjs"]
