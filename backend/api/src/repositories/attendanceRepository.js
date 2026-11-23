const Attendance = require('../models/Attendance');

class AttendanceRepository {
  async create(record) {
    return Attendance.create(record);
  }

  async findByStudentAndSession(studentEmail, sessionId) {
    return Attendance.findOne({
      student_email: String(studentEmail).toLowerCase().trim(),
      session_id: sessionId
    }).lean();
  }

  async find(filter = {}, projection = null, options = {}) {
    let query = Attendance.find(filter);
    if (projection) query = query.select(projection);
    if (options.sort) query = query.sort(options.sort);
    if (options.limit) query = query.limit(options.limit);
    if (options.skip) query = query.skip(options.skip);
    return query.lean();
  }

  async count(filter = {}) {
    return Attendance.countDocuments(filter);
  }

  async distinct(field, filter = {}) {
    return Attendance.distinct(field, filter);
  }

  async aggregate(pipeline) {
    return Attendance.aggregate(pipeline);
  }
}

module.exports = new AttendanceRepository();
