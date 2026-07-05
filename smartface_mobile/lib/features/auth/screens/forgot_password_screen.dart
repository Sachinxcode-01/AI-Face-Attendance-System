import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/features/auth/widgets/auth_shared_widgets.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _isLoading = false;
  bool _otpSent = false;
  bool _isPasswordVisible = false;
  bool _isConfirmPasswordVisible = false;

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleSendOtp() async {
    if (_isLoading) return; // Guard against double-tap duplicate submissions
    final email = _emailController.text.trim();
    if (email.isEmpty || !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      AppToast.show(context, message: 'Please enter a valid email address', type: ToastType.warning);
      return;
    }

    setState(() => _isLoading = true);
    HapticFeedback.mediumImpact();

    try {
      final result = await ApiService.forgotPassword(email);
      if (!mounted) return;

      final isSuccess = !result.containsKey('error_type') &&
                        !result.containsKey('detail') &&
                        (result.containsKey('message') || result['success'] == true);

      if (isSuccess) {
        final msg = result['message'] ?? 'Verification code sent to your email!';
        AppToast.show(context, message: msg.toString(), type: ToastType.success);
        setState(() {
          _otpSent = true;
        });
      } else {
        final msg = result['detail'] ?? result['message'] ?? 'Failed to send verification code. Please try again.';
        AppToast.show(context, message: msg.toString(), type: ToastType.error);
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.show(context, message: 'An unexpected error occurred. Please try again.', type: ToastType.error);
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _handleResetPassword() async {
    if (_isLoading) return; // Guard against double-tap duplicate submissions
    final email = _emailController.text.trim();
    final otp = _otpController.text.trim();
    final newPassword = _passwordController.text.trim();
    final confirmPassword = _confirmPasswordController.text.trim();

    if (otp.length != 6) {
      AppToast.show(context, message: 'Please enter the 6-digit code', type: ToastType.warning);
      return;
    }
    if (newPassword.isEmpty) {
      AppToast.show(context, message: 'Please enter a new password', type: ToastType.warning);
      return;
    }
    if (newPassword.length < 8) {
      AppToast.show(context, message: 'Password must be at least 8 characters long', type: ToastType.warning);
      return;
    }

    // Complexity requirements
    final hasUpper = RegExp(r'[A-Z]').hasMatch(newPassword);
    final hasLower = RegExp(r'[a-z]').hasMatch(newPassword);
    final hasDigit = RegExp(r'[0-9]').hasMatch(newPassword);
    final hasSpecial = RegExp(r'[^A-Za-z0-9]').hasMatch(newPassword);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      AppToast.show(
        context,
        message: 'Password must contain uppercase, lowercase, numbers, and special characters',
        type: ToastType.warning,
      );
      return;
    }

    if (newPassword != confirmPassword) {
      AppToast.show(context, message: 'Passwords do not match', type: ToastType.warning);
      return;
    }

    setState(() => _isLoading = true);
    HapticFeedback.mediumImpact();

    try {
      final result = await ApiService.resetPassword(email, otp, newPassword);
      if (!mounted) return;

      final isSuccess = !result.containsKey('error_type') &&
                        !result.containsKey('detail') &&
                        (result.containsKey('message') || result['success'] == true);

      if (isSuccess) {
        HapticFeedback.heavyImpact();
        final msg = result['message'] ?? 'Password reset successful!';
        AppToast.show(context, message: msg.toString(), type: ToastType.success);

        await Future.delayed(const Duration(seconds: 1));
        if (mounted) {
          context.go('/auth/login');
        }
      } else {
        final msg = result['detail'] ?? result['message'] ?? 'Password reset failed. Please try again.';
        AppToast.show(context, message: msg.toString(), type: ToastType.error);
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.show(context, message: 'An unexpected error occurred. Please try again.', type: ToastType.error);
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Widget _buildMailQuestionIcon() {
    return SizedBox(
      width: 48,
      height: 48,
      child: Stack(
        children: [
          Positioned(
            left: 4,
            top: 4,
            child: Icon(
              _otpSent ? Icons.lock_reset : Icons.mail_outline,
              size: 36,
              color: AuthDesign.primaryIndigo,
            ),
          ),
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.all(1.5),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: Icon(
                _otpSent ? Icons.verified : Icons.help,
                size: 15,
                color: AuthDesign.primaryIndigo,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AuthScreenLayout(
      title: _otpSent ? 'Reset password' : 'Reset your password',
      subtitle: _otpSent 
          ? 'Enter the 6-digit code sent to your email and your new password.'
          : "Enter your email and we'll send a verification code.",
      topIcon: _buildMailQuestionIcon(),
      onBackTap: () {
        if (_otpSent) {
          setState(() {
            _otpSent = false;
          });
        } else {
          context.go('/auth/login');
        }
      },
      bottomLink: GestureDetector(
        onTap: () => context.go('/auth/login'),
        child: Text(
          'Back to sign in',
          style: AuthDesign.fontPoppins(
            fontSize: 11,
            fontWeight: FontWeight.w700,
            color: AuthDesign.primaryIndigo,
          ),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Email Field
          UnderlineTextField(
            label: 'Email',
            placeholder: 'Enter your email',
            controller: _emailController,
            keyboardType: TextInputType.emailAddress,
            readOnly: _otpSent,
          ),
          const SizedBox(height: 16),

          if (_otpSent) ...[
            // OTP Input Field
            UnderlineTextField(
              label: 'Verification Code',
              placeholder: 'Enter 6-digit code',
              controller: _otpController,
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),

            // New Password Input Field
            UnderlineTextField(
              label: 'New Password',
              placeholder: 'Enter new password',
              controller: _passwordController,
              obscureText: !_isPasswordVisible,
              suffixIcon: GestureDetector(
                onTap: () => setState(() => _isPasswordVisible = !_isPasswordVisible),
                child: Icon(
                  _isPasswordVisible ? Icons.visibility : Icons.visibility_off,
                  color: AuthDesign.textLabel,
                  size: 18,
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Confirm Password Input Field
            UnderlineTextField(
              label: 'Confirm New Password',
              placeholder: 'Confirm new password',
              controller: _confirmPasswordController,
              obscureText: !_isConfirmPasswordVisible,
              suffixIcon: GestureDetector(
                onTap: () => setState(() => _isConfirmPasswordVisible = !_isConfirmPasswordVisible),
                child: Icon(
                  _isConfirmPasswordVisible ? Icons.visibility : Icons.visibility_off,
                  color: AuthDesign.textLabel,
                  size: 18,
                ),
              ),
            ),
            const SizedBox(height: 22),

            // Reset Password Button
            PrimaryButton(
              text: 'Reset password',
              isLoading: _isLoading,
              onPressed: _handleResetPassword,
            ),
            const SizedBox(height: 12),
            
            // Resend OTP Trigger
            Center(
              child: GestureDetector(
                onTap: _isLoading ? null : _handleSendOtp,
                child: Text(
                  'Resend code',
                  style: AuthDesign.fontPoppins(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: AuthDesign.primaryIndigo,
                  ),
                ),
              ),
            ),
          ] else ...[
            const SizedBox(height: 8),
            // Primary Send Link Button
            PrimaryButton(
              text: 'Send verification code',
              isLoading: _isLoading,
              onPressed: _handleSendOtp,
            ),
          ],
        ],
      ),
    );
  }
}
