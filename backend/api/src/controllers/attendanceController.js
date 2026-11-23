const attendanceRepository = require('../repositories/attendanceRepository');
const sessionRepository = require('../repositories/sessionRepository');
const userRepository = require('../repositories/userRepository');
const faceAiService = require('../services/faceAiService');
const datasetService = require('../services/datasetService');
const { verifyAttendanceQrToken } = require('../utils/attendanceQr');
const reportInternalError = require('../utils/httpError');
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

      const activeSession = await sessionRepository.findActive();
      if (!activeSession) {
        return res.status(400).json({ detail: 'No active attendance session found.' });
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

      const existing = await attendanceRepository.findByStudentAndSession(studentEmail, session_id);
      if (existing) {
        return res.status(409).json({ detail: 'Attendance already marked for this session' });
      }

      const newRecord = await attendanceRepository.create({
        student_email: studentEmail,
        session_id: session._id,
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
      const email = req.params.email || req.userEmail;
      const records = await attendanceRepository.find(
        { student_email: String(email).toLowerCase().trim() },
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
