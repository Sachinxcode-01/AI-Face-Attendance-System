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

      // Send email if user preference allows it
      try {
        const UserModel = require('../models/User');
        const user = await UserModel.findOne({ email: userId });
        if (user && (!user.notification_preferences || user.notification_preferences.email !== false)) {
          const EmailService = require('./emailService');
          const subject = `SmartFace Alert: ${title}`;
          const textBody = `${title}\n\n${message}\n\nPriority: ${priority}\nCategory: ${type}\n\nSmartFace Campus Platform`;
          const htmlBody = `<!DOCTYPE html>
<html>
<head>
    <style>
        body { background-color: #0A0E21; color: #FFFFFF; font-family: Arial, sans-serif; padding: 20px; }
        .card { background: #1A1F38; border: 1px solid #FFD700; border-radius: 12px; padding: 20px; max-width: 500px; margin: 0 auto; box-shadow: 0 4px 15px rgba(0,0,0,0.5); }
        .title { color: #FFD700; font-size: 18px; margin-top: 0; font-weight: bold; }
        .meta { color: #8A99AD; font-size: 12px; margin-bottom: 15px; border-bottom: 1px solid rgba(255,215,0,0.15); padding-bottom: 10px; }
        .content { font-size: 14px; line-height: 1.5; color: #E2E8F0; }
        .footer { font-size: 11px; color: #718096; text-align: center; margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 10px; }
    </style>
</head>
<body>
    <div class="card">
        <div class="title">🔔 ${title}</div>
        <div class="meta">Priority: ${priority} | Category: ${type}</div>
        <div class="content">${message}</div>
        <div class="footer">© 2026 SmartFace Elite Campus Operations</div>
    </div>
</body>
</html>`;
          EmailService.sendEmail(userId, subject, textBody, htmlBody).catch(console.error);
        }
      } catch (err) {
        console.error("Email notification sending error:", err);
      }

      return notifObj;
    } catch (error) {
      console.error("createNotification error:", error);
    }
  }
}

const notificationService = new NotificationService();
module.exports = notificationService;
