# ===========================================
# BCABuddy - Azure Container Deployment
# Multi-stage Docker build for Azure App Service
# ===========================================

# Stage 1: Build the Expo web app
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Install all dependencies (including dev)
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the Expo web export
RUN npx expo export --platform all

# Stage 2: Production server
FROM node:20-alpine AS production

WORKDIR /app

# Install only production server dependencies
COPY package.json ./
RUN npm install express compression --production

# Copy server files
COPY server.js ./
COPY web.config ./

# Copy built assets from builder stage
COPY --from=builder /app/dist ./dist

# Azure App Service expects port from PORT env
ENV NODE_ENV=production
ENV PORT=8080
EXPOSE 8080

# Health check for Azure Container
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1

# Start the server
CMD ["node", "server.js"]
