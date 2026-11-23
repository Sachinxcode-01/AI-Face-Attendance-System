const AuthService = require('../services/authService');
const userRepository = require('../repositories/userRepository');
const reportInternalError = require('../utils/httpError');

class AuthController {
  async login(req, res) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.loginWithPassword(email, password, req);
      return res.json(result);
    } catch (error) {
      return res.status(error.statusCode || 401).json({
        detail: error.message || 'Invalid credentials'
      });
    }
  }

  async sendLoginOtp(req, res) {
    try {
      const { email } = req.body;
      const result = await AuthService.sendLoginOtp(email);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ detail: error.message });
    }
  }

  async verifyLoginOtp(req, res) {
    try {
      const { email, otp } = req.body;
      const result = await AuthService.verifyLoginOtp(email, otp, req, res);
      return res.json(result);
    } catch (error) {
      return res.status(400).json({ detail: error.message });
    }
  }

  async getProfile(req, res) {
    try {
      const user = await userRepository.findByEmail(req.userEmail);
      if (!user) return res.status(404).json({ detail: 'User not found' });
      return res.json({
        success: true,
        user: {
          id: user._id,
          name: user.full_name,
          email: user.email,
          role: user.role,
          profilePhotoUrl: user.profilePhotoUrl || user.avatar_url || null
        }
      });
    } catch (error) {
      reportInternalError(res, error, 'AuthController.getProfile');
    }
  }
}

module.exports = new AuthController();
