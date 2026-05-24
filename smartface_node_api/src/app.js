const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const url = require('url');
const { WebSocketServer } = require('ws');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

const { connectDB } = require('./database');
const securityAndLogger = require('./middleware/logger');
const notificationService = require('./services/notificationService');
const AuthService = require('./services/authService');

// Initialize database
connectDB();

const app = express();
const server = http.createServer(app);

// ─── Middleware Stack ───────────────────────────────────────────────
app.use(cors({
  origin: (process.env.CORS_ORIGINS || '*').split(','),
  credentials: true,
  exposedHeaders: ['X-Request-ID']
}));
app.use(express.json());
app.use(securityAndLogger);

// Serve static avatars
const avatarsDir = path.join(__dirname, '../../data/avatars');
app.use('/static/avatars', express.static(avatarsDir));

// ─── HTTP Endpoints ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: "SmartAttendance - Node.js API is online" });
});

app.get('/health', async (req, res) => {
  let dbStatus = "connected";
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      dbStatus = "unreachable";
    }
  } catch (err) {
    dbStatus = "unreachable";
  }
  res.json({
    status: "ok",
    database: dbStatus,
    version: "2.0.0",
    timestamp: new Date().toISOString()
  });
});

// Import and mount routes
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const attendanceRoutes = require('./routes/attendance');
const leaveRoutes = require('./routes/leave');
const securityRoutes = require('./routes/security');
const notificationRoutes = require('./routes/notifications');
const aiRoutes = require('./routes/ai');

app.use('/auth', authRoutes);
app.use('/sessions', sessionRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/leave', leaveRoutes);
app.use('/security', securityRoutes);
app.use('/notifications', notificationRoutes);
app.use('/', aiRoutes);

// Error fallback handler for all routes
app.use((err, req, res, next) => {
  console.error("Unhandled Route Error:", err);
  res.status(err.status || 500).json({ detail: err.message || "Internal server error" });
});

// ─── WebSockets Setup ───────────────────────────────────────────────
const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws, req, email) => {
  console.log(`[WS] Connection established for user: ${email}`);
  notificationService.registerConnection(email, ws);

  ws.on('close', () => {
    console.log(`[WS] Connection closed for user: ${email}`);
    notificationService.removeConnection(email, ws);
  });

  ws.on('error', (error) => {
    console.error(`[WS] Error on connection for user: ${email}`, error);
    notificationService.removeConnection(email, ws);
  });

  ws.on('message', (message) => {
    // We just keep connection alive, client doesn't need to send messages
    // but in case they do, we log it or handle ping-pong.
  });
});

// Handle HTTP upgrades to WebSocket connections
server.on('upgrade', (request, socket, head) => {
  const parsedUrl = url.parse(request.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname === '/ws/notifications') {
    const token = parsedUrl.query.token;
    if (!token) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\nToken missing');
      socket.destroy();
      return;
    }

    const payload = AuthService.decodeToken(token);
    if (!payload || !payload.sub) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\nInvalid token');
      socket.destroy();
      return;
    }

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, payload.sub);
    });
  } else if (pathname === '/ws/live-logs') {
    // Allow live-logs connections without token, or register as special logger connection
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request, '__live_logs__');
    });
  } else {
    socket.destroy();
  }
});

// Start HTTP + WS Server
const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`🚀 SmartFace Node.js Server listening on port ${PORT}`);
});
