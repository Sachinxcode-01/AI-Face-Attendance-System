const attendanceRepository = require('../repositories/attendanceRepository');
const sessionRepository = require('../repositories/sessionRepository');
const reportInternalError = require('../utils/httpError');

class AnalyticsController {
  async getOverview(req, res) {
    try {
      const [totalRecords, presentRecords, totalSessions] = await Promise.all([
        attendanceRepository.count({}),
        attendanceRepository.count({ status: 'Present' }),
        sessionRepository.count({})
      ]);

      const rate = totalRecords > 0 ? ((presentRecords / totalRecords) * 100).toFixed(1) : '100.0';

      return res.json({
        success: true,
        totalAttendance: totalRecords,
        totalSessions,
        overallPercentage: parseFloat(rate),
        averageAttendance: `${rate}%`
      });
    } catch (error) {
      reportInternalError(res, error, 'AnalyticsController.getOverview');
    }
  }

  async getTrends(req, res) {
    try {
      const trends = await attendanceRepository.aggregate([
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
            present: { $sum: { $cond: [{ $eq: ["$status", "Present"] }, 1, 0] } },
            total: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        { $limit: 14 }
      ]);

      return res.json({
        success: true,
        trends: trends.map((t) => ({ date: t._id, present: t.present, total: t.total }))
      });
    } catch (error) {
      reportInternalError(res, error, 'AnalyticsController.getTrends');
    }
  }
}

module.exports = new AnalyticsController();
