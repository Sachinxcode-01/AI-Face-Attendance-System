const userRepository = require('../repositories/userRepository');
const attendanceRepository = require('../repositories/attendanceRepository');
const leaveRepository = require('../repositories/leaveRepository');
const reportInternalError = require('../utils/httpError');

class ParentController {
  async getChildren(req, res) {
    try {
      const parent = await userRepository.findByEmail(req.userEmail);
      const childEmails = parent && Array.isArray(parent.children) ? parent.children : [];
      if (childEmails.length === 0) return res.json([]);

      const children = await userRepository.find({ email: { $in: childEmails } }, 'email full_name student_id department semester');
      return res.json(children);
    } catch (error) {
      reportInternalError(res, error, 'ParentController.getChildren');
    }
  }

  async getChildStats(req, res) {
    try {
      const { email } = req.params;
      const records = await attendanceRepository.find({ student_email: email });
      const present = records.filter((r) => r.status === 'Present').length;
      const total = Math.max(records.length, 1);
      const rate = present / total;

      return res.json({
        overall_percentage: rate,
        standing: rate >= 0.75 ? 'Good' : 'At Risk',
        subjects: [{ subject: 'Overall', present, total }]
      });
    } catch (error) {
      reportInternalError(res, error, 'ParentController.getChildStats');
    }
  }
}

module.exports = new ParentController();
