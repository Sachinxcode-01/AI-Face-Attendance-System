const Leave = require('../models/Leave');

class LeaveRepository {
  async create(leaveData) {
    return Leave.create(leaveData);
  }

  async findById(id) {
    return Leave.findById(id);
  }

  async find(filter = {}, projection = null, options = {}) {
    let query = Leave.find(filter);
    if (projection) query = query.select(projection);
    if (options.sort) query = query.sort(options.sort);
    if (options.limit) query = query.limit(options.limit);
    if (options.skip) query = query.skip(options.skip);
    return query.lean();
  }

  async count(filter = {}) {
    return Leave.countDocuments(filter);
  }

  async updateById(id, updateData) {
    return Leave.findByIdAndUpdate(id, updateData, { new: true });
  }
}

module.exports = new LeaveRepository();
