const teacherService = require('../services/teacherService');
const reportInternalError = require('../utils/httpError');

class TeacherController {
  async getDashboard(req, res) {
    try {
      const data = await teacherService.getTeacherDashboard(req.userEmail);
      if (!data) return res.status(404).json({ detail: 'Teacher profile not found.' });
      return res.json(data);
    } catch (error) {
      reportInternalError(res, error, 'TeacherController.getDashboard');
    }
  }

  async getSessions(req, res) {
    try {
      const sessions = await teacherService.getTeacherSessions(req.userEmail);
      return res.json(sessions);
    } catch (error) {
      reportInternalError(res, error, 'TeacherController.getSessions');
    }
  }
}

module.exports = new TeacherController();
