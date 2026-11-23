const Session = require('../models/Session');

class SessionRepository {
  async findById(id) {
    return Session.findById(id).lean();
  }

  async findActive() {
    return Session.findOne({ is_active: true }).sort({ start_time: -1 }).lean();
  }

  async find(filter = {}, projection = null, options = {}) {
    let query = Session.find(filter);
    if (projection) query = query.select(projection);
    if (options.sort) query = query.sort(options.sort);
    if (options.limit) query = query.limit(options.limit);
    if (options.skip) query = query.skip(options.skip);
    return query.lean();
  }

  async count(filter = {}) {
    return Session.countDocuments(filter);
  }

  async create(sessionData) {
    return Session.create(sessionData);
  }

  async updateById(id, updateData) {
    return Session.findByIdAndUpdate(id, updateData, { new: true });
  }
}

module.exports = new SessionRepository();
