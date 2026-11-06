const express = require('express');
const cors = require('cors');
const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');
const { WebSocketServer } = require('ws');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env') });

// Enforce critical environment variable validation
const requiredEnvVars = ['FACE_SCANNER_TOKEN'];
const missingEnvVars = [];
requiredEnvVars.forEach(varName => {
  const val = process.env[varName];
  if (!val || val.trim() === '') {
    missingEnvVars.push(varName);
  }
});

const emailProvider = process.env.EMAIL_PROVIDER || 'resend';
if (emailProvider === 'resend') {
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY.trim() === '') {
    missingEnvVars.push('RESEND_API_KEY');
  }
} else {
  if (!process.env.BREVO_API_KEY || process.env.BREVO_API_KEY.trim() === '') {
    missingEnvVars.push('BREVO_API_KEY');
  }
}

if (!process.env.EMAIL_FROM && !process.env.EMAIL_FROM_ADDRESS) {
  missingEnvVars.push('EMAIL_FROM');
}

const mongoUrl = process.env.MONGODB_URL || process.env.MONGO_URI;
if (!mongoUrl || mongoUrl.trim() === '') {
  missingEnvVars.push('MONGODB_URL / MONGO_URI');
}
const jwtSecret = process.env.SECRET_KEY || process.env.JWT_SECRET;
if (!jwtSecret || jwtSecret.trim() === '') {
  missingEnvVars.push('SECRET_KEY / JWT_SECRET');
}

if (missingEnvVars.length > 0) {
  console.error("\n======================================================================");
  console.error("❌ CRITICAL STARTUP CONFIGURATION ERROR: Missing Required Environments");
  console.error("======================================================================");
  missingEnvVars.forEach(v => {
    console.error(`🚨 ${v} is missing or empty in the environment configuration.`);
  });
  console.error("======================================================================\n");
  process.exit(1);
}

const { connectDB } = require('./config/database');
const securityAndLogger = require('./middleware/logger');
const { limitGeneralApi } = require('./middleware/rateLimiter');
const notificationService = require('./services/notificationService');
const AuthService = require('./services/authService');

// Initialize database
connectDB();

const app = express();
const server = http.createServer(app);
app.disable('x-powered-by'); // Disable X-Powered-By header

const sanitizeNoSQL = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else {
        sanitizeNoSQL(obj[key]);
      }
    }
  }
};

const inputSanitizer = (req, res, next) => {
  if (req.body) {
    sanitizeNoSQL(req.body);
  }
  if (req.query) {
    sanitizeNoSQL(req.query);
  }
  if (req.params) {
    sanitizeNoSQL(req.params);
  }
  next();
};

const httpSecurityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  next();
};

app.use(httpSecurityHeaders);

// ─── Middleware Stack ───────────────────────────────────────────────
const originsSource = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN;
const allowedOrigins = originsSource 
  ? originsSource.split(',').map(o => o.trim()) 
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (reqOrigin, callback) => {
    // Permit all origins in development, but restrict strictly in production
    const isProduction = process.env.APP_ENV === 'production' || process.env.NODE_ENV === 'production';
    if (!isProduction) {
      callback(null, true);
    } else {
      if (!reqOrigin || allowedOrigins.includes(reqOrigin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS Policy: Origin not allowed.'));
      }
    }
  },
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Authorization', 'Content-Type', 'X-Request-ID'],
  credentials: true,
  exposedHeaders: ['X-Request-ID']
}));
app.use(express.json());
app.use(inputSanitizer);
app.use(securityAndLogger);

// Serve static avatars securely with cross-origin access for web clients
const avatarsDir = path.resolve(__dirname, '../../data/avatars');
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}
app.use('/static/avatars', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(avatarsDir));
app.use('/static', express.static(path.join(__dirname, '../public')));

// Apply the shared API budget to every route alias so clients cannot bypass it by changing prefixes.
app.use(limitGeneralApi);

// ─── HTTP Endpoints ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ message: "SmartAttendance - Node.js API is online" });
});

app.get(['/health', '/api/health'], async (req, res) => {
  let dbStatus = "connected";
  try {
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      dbStatus = "unreachable";
    } else {
      await mongoose.connection.db.admin().ping({ maxTimeMS: 2000 });
    }
  } catch (err) {
    dbStatus = "unreachable";
  }
  const emailProvider = process.env.EMAIL_PROVIDER || 'resend';
  const emailConfigured = Boolean(process.env.RESEND_API_KEY || process.env.BREVO_API_KEY);
  
  const isHealthy = dbStatus === "connected";
  res.status(isHealthy ? 200 : 503).json({
    success: isHealthy,
    status: isHealthy ? "ok" : "degraded",
    message: isHealthy ? "Server running" : "Database connection issue",
    database: dbStatus,
    email_service: {
      provider: emailProvider,
      status: emailConfigured ? "operational" : "degraded",
      domain: "smartface.pro"
    },
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
const telemetryRoutes = require('./routes/telemetry');
const managementRoutes = require('./routes/management');
const academicRoutes = require('./routes/academic');
const parentRoutes = require('./routes/parent');
const reportRoutes = require('./routes/reports');
const apiCompatRoutes = require('./routes/apiCompat');
const analyticsRoutes = require('./routes/analytics');
const collegeRoutes = require('./routes/colleges');

app.use('/auth', authRoutes);
app.use('/api/auth', authRoutes);
app.use('/colleges', collegeRoutes);
app.use('/api/colleges', collegeRoutes);
app.use('/sessions', sessionRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/attendance', attendanceRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/leave', leaveRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/security', securityRoutes);
app.use('/api/security', securityRoutes);
app.use('/notifications', notificationRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/telemetry', telemetryRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/management', managementRoutes);
app.use('/api/management', managementRoutes);
app.use('/academic', academicRoutes);
app.use('/api/academic', academicRoutes);
app.use('/parent', parentRoutes);
app.use('/api/parent', parentRoutes);
app.use('/reports', reportRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', apiCompatRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/', aiRoutes);
app.use('/api', aiRoutes);

// 404 JSON fallback handler (replaces default Express HTML 404)
app.use((req, res, next) => {
  res.status(404).json({ detail: `Cannot ${req.method} ${req.path}` });
});

// Error fallback handler for all routes
app.use((err, req, res, next) => {
  console.error("Unhandled Route Error:", err);
  if (err.name === 'CastError' || err.name === 'ValidationError' || (err.message && err.message.includes('Cast to string failed'))) {
    return res.status(400).json({ success: false, detail: "Invalid request data" });
  }
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 500 ? err.status : 500;
  res.status(status).json({ detail: status < 500 ? 'Request could not be processed.' : 'Internal server error.' });
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
    // Keep-alive or ping/pong handling
  });
});

// Handle HTTP upgrades to WebSocket connections
server.on('upgrade', async (request, socket, head) => {
  try {
    const parsedUrl = url.parse(request.url, true);
    const pathname = parsedUrl.pathname;
    const token = parsedUrl.query.token;

    if (pathname !== '/ws/notifications' && pathname !== '/ws/live-logs') {
      socket.write('HTTP/1.1 404 Not Found\r\n\r\n');
      socket.destroy();
      return;
    }

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

    // Live session check
    const crypto = require('crypto');
    const UserSession = require('./models/UserSession');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const session = await UserSession.findOne({ tokenHash });

    if (!session || new Date() > session.expiry) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\nSession revoked or expired');
      socket.destroy();
      return;
    }

    const userRole = (payload.role || 'student').toLowerCase();

    if (pathname === '/ws/live-logs') {
      const allowedRoles = ['admin', 'super_admin', 'hod', 'principal'];
      if (!allowedRoles.includes(userRole)) {
        socket.write('HTTP/1.1 403 Forbidden\r\n\r\nAdmin authorization required');
        socket.destroy();
        return;
      }
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, '__live_logs__');
      });
    } else {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, payload.sub);
      });
    }
  } catch (err) {
    socket.write('HTTP/1.1 500 Internal Server Error\r\n\r\n');
    socket.destroy();
  }
});

// Start HTTP + WS Server
const PORT = process.env.PORT || 8000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SmartFace Node.js Server listening on port ${PORT}`);
});

// Graceful Shutdown Handler
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}. Initiating graceful shutdown...`);
  wss.close(() => {
    console.log("✅ WebSocket server closed.");
  });
  server.close(async () => {
    console.log("✅ HTTP server closed.");
    try {
      const mongoose = require('mongoose');
      await mongoose.connection.close();
      console.log("✅ MongoDB connection disconnected.");
    } catch (err) {
      console.error("Error closing MongoDB connection:", err);
    }
    process.exit(0);
  });

  setTimeout(() => {
    console.error("⚠️ Forced shutdown after 10s timeout.");
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  console.warn('⚠️ [Process] Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('💥 [Process] Uncaught Exception:', err);
});
