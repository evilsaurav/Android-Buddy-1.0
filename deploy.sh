#!/bin/bash
# ===========================================
# Azure App Service - Kudu Deployment Script
# BCABuddy - Expo Web Build & Deploy
# ===========================================

set -e

echo "========================================"
echo "  BCABuddy Azure Deployment"
echo "========================================"

# ---- Kudu Environment Variables ----
DEPLOYMENT_SOURCE=${DEPLOYMENT_SOURCE:-$(pwd)}
DEPLOYMENT_TARGET=${DEPLOYMENT_TARGET:-/home/site/wwwroot}
NODE_VERSION=${WEBSITE_NODE_DEFAULT_VERSION:-20}

echo "Source: $DEPLOYMENT_SOURCE"
echo "Target: $DEPLOYMENT_TARGET"
echo "Node:   $NODE_VERSION"

# ---- Step 1: Install Dependencies ----
echo ""
echo "[1/4] Installing dependencies..."
cd "$DEPLOYMENT_SOURCE"
npm ci --legacy-peer-deps --production=false

# ---- Step 2: Build Expo Web ----
echo ""
echo "[2/4] Building Expo web export..."
npx expo export --platform all

# ---- Step 3: Install Production Server Deps ----
echo ""
echo "[3/4] Installing server dependencies..."
npm install express compression --save

# ---- Step 4: Copy to Deployment Target ----
echo ""
echo "[4/4] Deploying to Azure..."
mkdir -p "$DEPLOYMENT_TARGET"

# Copy server files
cp server.js "$DEPLOYMENT_TARGET/"
cp web.config "$DEPLOYMENT_TARGET/"
cp package.json "$DEPLOYMENT_TARGET/"

# Copy built web assets
cp -r dist "$DEPLOYMENT_TARGET/"

# Copy node_modules for server
if [ -d "node_modules/express" ]; then
  mkdir -p "$DEPLOYMENT_TARGET/node_modules"
  cp -r node_modules/express "$DEPLOYMENT_TARGET/node_modules/"
  cp -r node_modules/compression "$DEPLOYMENT_TARGET/node_modules/"
  # Copy express dependencies
  for dep in accepts body-parser content-disposition content-type cookie cookie-signature debug depd destroy encodeurl escape-html etag finalhandler fresh http-errors merge-descriptors methods mime ms on-finished parseurl path-to-regexp proxy-addr qs range-parser raw-body safe-buffer safer-buffer send serve-static setprototypeof statuses type-is unpipe utils-merge vary bytes compressible on-headers; do
    if [ -d "node_modules/$dep" ]; then
      cp -r "node_modules/$dep" "$DEPLOYMENT_TARGET/node_modules/"
    fi
  done
fi

echo ""
echo "========================================"
echo "  Deployment Complete!"
echo "  Health: /api/health"
echo "========================================"
