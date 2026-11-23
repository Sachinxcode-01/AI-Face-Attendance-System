const leaveRepository = require('../repositories/leaveRepository');
const reportInternalError = require('../utils/httpError');

class LeaveController {
  async apply(req, res) {
    try {
      const { reason, start_date, end_date } = req.body;
      const user_id = req.userEmail;

      if (!reason || !start_date || !end_date) {
        return res.status(400).json({ detail: 'Reason, start date, and end date are required.' });
      }

      const leave = await leaveRepository.create({
        user_id,
        reason,
        start_date,
        end_date,
        status: 'Pending'
      });

      return res.status(201).json({
        success: true,
        message: 'Leave application submitted successfully',
        data: leave
      });
    } catch (error) {
      reportInternalError(res, error, 'LeaveController.apply');
    }
  }

  async getMyLeaves(req, res) {
    try {
      const user_id = req.userEmail;
      const leaves = await leaveRepository.find({ user_id }, null, { sort: { created_at: -1 } });
      return res.json(leaves);
    } catch (error) {
      reportInternalError(res, error, 'LeaveController.getMyLeaves');
    }
  }

  async review(req, res) {
    try {
      const { id } = req.params;
      const { status, remarks } = req.body;

      if (!['Approved', 'Rejected'].includes(status)) {
        return res.status(400).json({ detail: 'Status must be Approved or Rejected' });
      }

      const updated = await leaveRepository.updateById(id, {
        status,
        remarks: remarks || '',
        reviewed_by: req.userEmail,
        reviewed_at: new Date()
      });

      if (!updated) return res.status(404).json({ detail: 'Leave request not found' });
      return res.json({ success: true, message: `Leave ${status.toLowerCase()} successfully`, data: updated });
    } catch (error) {
      reportInternalError(res, error, 'LeaveController.review');
    }
  }
}

module.exports = new LeaveController();
