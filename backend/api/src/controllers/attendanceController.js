const attendanceRepository = require('../repositories/attendanceRepository');
const sessionRepository = require('../repositories/sessionRepository');
const userRepository = require('../repositories/userRepository');
const faceAiService = require('../services/faceAiService');
const datasetService = require('../services/datasetService');
const { verifyAttendanceQrToken } = require('../utils/attendanceQr');
const reportInternalError = require('../utils/httpError');
const { resolveAdminTenant, isSameTenant } = require('../utils/tenantScope');
const mongoose = require('mongoose');

class AttendanceController {
  async markFace(req, res) {
    try {
      const studentEmail = (req.body.student_email || req.userEmail || '').trim().toLowerCase();
      if (!studentEmail) {
        return res.status(400).json({ detail: 'Student email is required.' });
      }

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ detail: 'Image file is required.' });
      }

      const studentUser = await userRepository.findByEmail(studentEmail);
      const sessionFilter = studentUser?.college_id
        ? { is_active: true, college_id: studentUser.college_id }
        : { is_active: true };
      const activeSession = (await sessionRepository.find(sessionFilter, null, { sort: { start_time: -1 }, limit: 1 }))[0];
      if (!activeSession) {
        return res.status(400).json({ detail: 'No active attendance session found.' });
      }
      if (activeSession.college_id && studentUser?.college_id && activeSession.college_id !== studentUser.college_id) {
        return res.status(403).json({ detail: 'Cross-institution attendance registration is not permitted.' });
      }

      // Check if already marked
      const existing = await attendanceRepository.findByStudentAndSession(studentEmail, activeSession._id);
      if (existing) {
        return res.status(409).json({ detail: 'Attendance already marked for this session' });
      }

      // Forward to Face AI microservice wrapping core/
      const result = await faceAiService.verifyFace(req.file.buffer, studentEmail);
      if (!result.success || !result.matched) {
        return res.status(result.status || 422).json({
          detail: result.message || 'Face verification failed',
          confidence: result.confidence || 0
        });
      }

      const newRecord = await attendanceRepository.create({
        student_email: studentEmail,
        session_id: activeSession._id,
        college_id: activeSession.college_id || studentUser?.college_id || undefined,
        timestamp: new Date(),
        status: 'Present',
        verified_by: 'face',
        confidence: result.confidence
      });

      return res.status(200).json({
        status: 'success',
        message: 'Face attendance marked successfully',
        data: {
          attendance_id: newRecord._id,
          confidence: result.confidence,
          student: studentEmail
        }
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ detail: 'Attendance already marked for this session' });
      }
      reportInternalError(res, error, 'AttendanceController.markFace');
    }
  }

  async markQr(req, res) {
    try {
      const { session_id, qr_code, latitude, longitude } = req.body;
      const studentEmail = (req.userEmail || '').toLowerCase().trim();

      if (!session_id || !qr_code) {
        return res.status(400).json({ detail: 'Session and QR code are required.' });
      }

      const session = await sessionRepository.findById(session_id);
      if (!session || !session.is_active) {
        return res.status(400).json({ detail: 'Invalid or expired session' });
      }

      if (!verifyAttendanceQrToken(session, qr_code)) {
        return res.status(400).json({ detail: 'Invalid QR code.' });
      }

      const studentUser = await userRepository.findByEmail(studentEmail);
      if (session.college_id && studentUser?.college_id && session.college_id !== studentUser.college_id) {
        return res.status(403).json({ detail: 'Cross-institution attendance registration is not permitted.' });
      }

      const existing = await attendanceRepository.findByStudentAndSession(studentEmail, session_id);
      if (existing) {
        return res.status(409).json({ detail: 'Attendance already marked for this session' });
      }

      const newRecord = await attendanceRepository.create({
        student_email: studentEmail,
        session_id: session._id,
        college_id: session.college_id || studentUser?.college_id || undefined,
        timestamp: new Date(),
        status: 'Present',
        verified_by: 'qr'
      });

      return res.status(200).json({
        status: 'success',
        message: 'QR Attendance marked successfully',
        attendance_id: newRecord._id
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ detail: 'Attendance already marked for this session' });
      }
      reportInternalError(res, error, 'AttendanceController.markQr');
    }
  }

  async getLogs(req, res) {
    try {
      const email = String(req.params.email || req.userEmail || '').toLowerCase().trim();
      const role = String(req.userRole || '').toLowerCase();
      if (role === 'student' && email !== String(req.userEmail || '').toLowerCase()) {
        return res.status(403).json({ detail: 'Forbidden: cannot access another student attendance logs.' });
      }
      if (role !== 'student' && role !== 'super_admin') {
        const [tenant, targetUser] = await Promise.all([
          resolveAdminTenant(req),
          userRepository.findByEmail(email),
        ]);
        if (targetUser && !isSameTenant(tenant, targetUser)) {
          return res.status(403).json({ detail: 'Forbidden: cross-institution attendance logs denied.' });
        }
      }
      const records = await attendanceRepository.find(
        { student_email: email },
        null,
        { sort: { timestamp: -1 }, limit: 50 }
      );
      return res.json(records);
    } catch (error) {
      reportInternalError(res, error, 'AttendanceController.getLogs');
    }
  }
}

module.exports = new AttendanceController();
