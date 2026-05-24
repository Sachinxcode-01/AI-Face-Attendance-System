class NotificationService {
  constructor() {
    this.activeConnections = new Map(); // email -> Array of sockets
  }

  registerConnection(email, ws) {
    if (!this.activeConnections.has(email)) {
      this.activeConnections.set(email, []);
    }
    this.activeConnections.get(email).push(ws);
  }

  removeConnection(email, ws) {
    if (this.activeConnections.has(email)) {
      const connections = this.activeConnections.get(email);
      const index = connections.indexOf(ws);
      if (index !== -1) {
        connections.splice(index, 1);
      }
      if (connections.length === 0) {
        this.activeConnections.delete(email);
      }
    }
  }

  async sendPersonalMessage(email, message) {
    const connections = this.activeConnections.get(email);
    if (!connections || connections.length === 0) return;

    const deadConnections = [];
    connections.forEach(ws => {
      try {
        if (ws.readyState === 1) { // 1 means OPEN
          ws.send(JSON.stringify(message));
        } else {
          deadConnections.push(ws);
        }
      } catch (err) {
        deadConnections.push(ws);
      }
    });

    deadConnections.forEach(ws => this.removeConnection(email, ws));
  }

  async broadcast(message) {
    this.activeConnections.forEach((connections, email) => {
      const deadConnections = [];
      connections.forEach(ws => {
        try {
          if (ws.readyState === 1) {
            ws.send(JSON.stringify(message));
          } else {
            deadConnections.push(ws);
          }
        } catch (err) {
          deadConnections.push(ws);
        }
      });
      deadConnections.forEach(ws => this.removeConnection(email, ws));
    });
  }

  async createNotification(userId, title, message, type, priority = "Info", extraData = {}) {
    try {
      const NotificationModel = require('../models/Notification');
      const newNotif = new NotificationModel({
        user_id: userId,
        title,
        message,
        type,
        priority,
        is_read: false,
        created_at: new Date(),
        extra_data: extraData
      });

      await newNotif.save();

      const notifObj = newNotif.toObject();
      notifObj.id = notifObj._id.toString();
      delete notifObj._id;

      // Send real-time ws message to student
      this.sendPersonalMessage(userId, notifObj).catch(console.error);

      return notifObj;
    } catch (error) {
      console.error("createNotification error:", error);
    }
  }
}

const notificationService = new NotificationService();
module.exports = notificationService;
