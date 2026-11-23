const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key_12345';

function initSocketServer(server) {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    },
    transports: ['websocket', 'polling']
  });

  // Socket Authentication Middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) return next(new Error('Authentication error: Invalid token'));
      socket.user = decoded;
      next();
    });
  });

  io.on('connection', (socket) => {
    const userEmail = socket.user?.sub || socket.user?.email;
    const userRole = socket.user?.role || 'student';

    console.log(`[Socket.IO] Client connected: ${userEmail} (${userRole})`);

    // Join personal and role rooms
    socket.join(`user:${userEmail}`);
    socket.join(`role:${userRole}`);

    socket.on('join:session', (sessionId) => {
      socket.join(`session:${sessionId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${userEmail}`);
    });
  });

  return io;
}

function getIO() {
  return io;
}

function emitAttendanceEvent(eventData) {
  if (io) {
    io.emit('attendance:feed', eventData);
    if (eventData.session_id) {
      io.to(`session:${eventData.session_id}`).emit('session:attendance', eventData);
    }
  }
}

function emitNotification(userEmail, notification) {
  if (io) {
    io.to(`user:${userEmail}`).emit('notification:new', notification);
  }
}

module.exports = {
  initSocketServer,
  getIO,
  emitAttendanceEvent,
  emitNotification
};
