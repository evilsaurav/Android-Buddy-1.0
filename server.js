/**
 * Azure App Service - Express Static Server
 * Serves the Expo web build from /dist directory
 * Compatible with Azure App Service (Windows & Linux)
 */
const express = require('express');
const path = require('path');
const compression = require('compression');

const app = express();
const PORT = process.env.PORT || 8080;

// Enable gzip compression for all responses
app.use(compression());

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Cache static assets aggressively (JS, CSS, images, fonts)
app.use(
  '/static',
  express.static(path.join(__dirname, 'dist'), {
    maxAge: '1y',
    immutable: true,
  })
);

app.use(
  '/_expo',
  express.static(path.join(__dirname, 'dist', '_expo'), {
    maxAge: '1y',
    immutable: true,
  })
);

// Serve other static files with shorter cache
app.use(
  express.static(path.join(__dirname, 'dist'), {
    maxAge: '1h',
    etag: true,
  })
);

// Health check endpoint for Azure monitoring
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    app: 'BCABuddy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production',
    uptime: process.uptime(),
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'BCABuddy',
    description: 'AI-Powered Study Companion for BCA Students',
    version: '1.0.0',
    platform: 'web',
    framework: 'React Native + Expo',
    deployment: 'Azure App Service',
  });
});

// SPA fallback - serve index.html for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`\n  BCABuddy Server`);
  console.log(`  ===============================`);
  console.log(`  Status:      Running`);
  console.log(`  Port:        ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`  Health:      http://localhost:${PORT}/api/health`);
  console.log(`  App:         http://localhost:${PORT}`);
  console.log(`  ===============================\n`);
});
