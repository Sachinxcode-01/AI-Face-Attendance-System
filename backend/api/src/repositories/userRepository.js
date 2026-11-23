const User = require('../models/User');

class UserRepository {
  async findByEmail(email, projection = null) {
    const query = User.findOne({ email: String(email).toLowerCase().trim() });
    return projection ? query.select(projection).lean() : query.lean();
  }

  async findById(id, projection = null) {
    const query = User.findById(id);
    return projection ? query.select(projection).lean() : query.lean();
  }

  async create(userData) {
    return User.create(userData);
  }

  async updateByEmail(email, updateData) {
    return User.findOneAndUpdate(
      { email: String(email).toLowerCase().trim() },
      updateData,
      { new: true, runValidators: true }
    );
  }

  async exists(query) {
    return User.exists(query);
  }

  async find(filter = {}, projection = null, options = {}) {
    let query = User.find(filter);
    if (projection) query = query.select(projection);
    if (options.sort) query = query.sort(options.sort);
    if (options.limit) query = query.limit(options.limit);
    if (options.skip) query = query.skip(options.skip);
    return query.lean();
  }

  async count(filter = {}) {
    return User.countDocuments(filter);
  }
}

module.exports = new UserRepository();
