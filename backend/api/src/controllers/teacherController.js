const sessionRepository = require('../repositories/sessionRepository');
const attendanceRepository = require('../repositories/attendanceRepository');
const leaveRepository = require('../repositories/leaveRepository');
const userRepository = require('../repositories/userRepository');
const reportInternalError = require('../utils/httpError');

class TeacherController {
  async getDashboard(req, res) {
    try {
      const teacherEmail = req.userEmail;
      const teacher = await userRepository.findByEmail(teacherEmail, 'full_name department email');
      if (!teacher) return res.status(404).json({ detail: 'Teacher profile not found.' });

      const teacherSessions = await sessionRepository.find({ teacher_id: teacherEmail }, '_id');
      const sessionIds = teacherSessions.map((s) => s._id.toString());
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [activeSessions, totalSessions, attendanceToday, monitoredStudents] = await Promise.all([
        sessionRepository.count({ teacher_id: teacherEmail, is_active: true }),
        sessionRepository.count({ teacher_id: teacherEmail }),
        sessionIds.length
          ? attendanceRepository.count({ session_id: { $in: sessionIds }, timestamp: { $gte: startOfDay } })
          : 0,
        sessionIds.length
          ? attendanceRepository.distinct('student_email', { session_id: { $in: sessionIds } })
          : []
      ]);

      return res.json({
        teacher_name: teacher.full_name,
        department: teacher.department || null,
        active_sessions: activeSessions,
        total_sessions: totalSessions,
        attendance_today: attendanceToday,
        students_monitored: monitoredStudents.length
      });
    } catch (error) {
      reportInternalError(res, error, 'TeacherController.getDashboard');
    }
  }

  async getSessions(req, res) {
    try {
      const teacherEmail = req.userEmail;
      const sessions = await sessionRepository.find({ teacher_id: teacherEmail }, null, { sort: { start_time: -1 } });
      return res.json(sessions);
    } catch (error) {
      reportInternalError(res, error, 'TeacherController.getSessions');
    }
  }
}

module.exports = new TeacherController();
