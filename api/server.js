const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const routes = require('./routes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 1337;
const PROXY_PREFIX = '/app';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Strip /app prefix when the proxy does not rewrite paths
app.use((req, res, next) => {
  if (req.url === PROXY_PREFIX) {
    req.url = '/';
    return next();
  }

  if (req.url.startsWith(`${PROXY_PREFIX}/`)) {
    req.url = req.url.slice(PROXY_PREFIX.length);
  }

  return next();
});

// Paths relative to THIS file (api/server.js)
// Using __dirname is the most reliable way to find sibling folders
const API_DIR = __dirname;
const ROOT_DIR = path.join(API_DIR, '..');
const PUBLIC_UPLOADS_DIR = path.join(ROOT_DIR, 'public', 'uploads');
const ADMIN_DIR = path.join(ROOT_DIR, 'admin');

console.log('Server __dirname:', API_DIR);
console.log('Serving Admin from:', ADMIN_DIR);

// Serve Uploads
app.use('/uploads', express.static(PUBLIC_UPLOADS_DIR));

// API Routes
app.use('/api', routes);

// Serve Admin Panel (Static Files)
app.use('/admin', express.static(ADMIN_DIR));

// SPA Fallback for Admin (Must be before any other catch-alls)
app.get(/^\/admin($|\/)/, (req, res) => {
  res.sendFile(path.join(ADMIN_DIR, 'index.html'));
});

// Root Route - Health Check (Crucial for debugging)
app.get('/', (req, res) => {
  res.send(
    `<h1>InLexi Backend API</h1><p>Status: Running</p><p>Admin Path: ${ADMIN_DIR}</p><p>If you see this, Passenger is working!</p>`,
  );
});

// 404 Handler for unknown API routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
