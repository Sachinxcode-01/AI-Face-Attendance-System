const sessionRepository = require('../repositories/sessionRepository');
const reportInternalError = require('../utils/httpError');

class SessionsController {
  async getActive(req, res) {
    try {
      const activeSession = await sessionRepository.findActive();
      if (!activeSession) return res.status(404).json({ detail: 'No active session found' });
      return res.json(activeSession);
    } catch (error) {
      reportInternalError(res, error, 'SessionsController.getActive');
    }
  }

  async create(req, res) {
    try {
      const { subject, room, duration, latitude, longitude, radius_meters } = req.body;
      const teacher_id = req.userEmail;

      const newSession = await sessionRepository.create({
        subject,
        room: room || 'Main Hall',
        duration: duration || 60,
        teacher_id,
        latitude,
        longitude,
        radius_meters: radius_meters || 100,
        start_time: new Date(),
        is_active: true
      });

      return res.status(201).json({
        success: true,
        message: 'Attendance session created successfully',
        data: newSession
      });
    } catch (error) {
      reportInternalError(res, error, 'SessionsController.create');
    }
  }
}

module.exports = new SessionsController();
