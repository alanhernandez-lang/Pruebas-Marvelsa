// Load environment variables from .env (if present)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const rateLimit = require('./middleware/rateLimit');
const { buildCorsOptions, securityHeaders, sanitizeObject } = require('./utils/httpSecurity');

const app = express();
const isVercel = process.env.VERCEL === '1' || !!process.env.VERCEL;
app.set('trust proxy', 1);
app.disable('x-powered-by');

// Surface startup/runtime crashes in Vercel logs.
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
});

let io = null;
let server = null;
if (!isVercel) {
  const http = require('http');
  const { Server } = require('socket.io');
  server = http.createServer(app);
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });
}

// Middleware
app.use(securityHeaders);
app.use(cors(buildCorsOptions()));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Log all requests for debugging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (process.env.NODE_ENV !== 'production' && ['POST', 'PUT', 'PATCH'].includes(req.method)) {
    console.log('Body:', JSON.stringify(sanitizeObject(req.body), null, 2));
  }
  next();
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const voteRoutes = require('./routes/voteRoutes')(io);
const adminRoutes = require('./routes/adminRoutes');
const whatsappRoutes = require('./routes/whatsappRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/admin', adminRoutes);
app.get('/api/ping', (req, res) => res.json({ message: 'pong' }));
app.use('/api/whatsapp', whatsappRoutes);

// Servir archivos estáticos del frontend si es necesario (opcional)
// app.use(express.static(path.join(__dirname, '../frontend/dist')));

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
  if (!server) {
    const http = require('http');
    server = http.createServer(app);
  }
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
