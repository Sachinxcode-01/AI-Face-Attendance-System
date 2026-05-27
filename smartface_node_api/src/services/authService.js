const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const SECRET_KEY = process.env.JWT_SECRET || process.env.SECRET_KEY || "smartface_ultra_secure_secret_999";
const EXPIRE_MINUTES = parseInt(process.env.ACCESS_TOKEN_EXPIRE_MINUTES || "1440", 10);

class AuthService {
  static async hashPassword(password) {
    const saltRounds = process.env.NODE_ENV === 'production' ? 12 : 10;
    const salt = await bcrypt.genSalt(saltRounds);
    return bcrypt.hash(password, salt);
  }

  static async verifyPassword(plainPassword, hashedPassword) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  static createAccessToken(payload, expiresDeltaMinutes = null) {
    const minutes = expiresDeltaMinutes !== null ? expiresDeltaMinutes : EXPIRE_MINUTES;
    const expiresIn = minutes * 60; // in seconds
    
    return jwt.sign(payload, SECRET_KEY, { expiresIn });
  }

  static decodeToken(token) {
    try {
      return jwt.verify(token, SECRET_KEY);
    } catch (error) {
      return null;
    }
  }
}

module.exports = AuthService;
