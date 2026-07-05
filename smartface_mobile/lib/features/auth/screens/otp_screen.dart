import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/features/auth/widgets/auth_shared_widgets.dart';

import 'package:smartface_attendance/design_system/ui/ui.dart' hide PrimaryButton;

class OTPScreen extends StatefulWidget {
  final String? email;
  const OTPScreen({super.key, this.email});

  @override
  State<OTPScreen> createState() => _OTPScreenState();
}

class _OTPScreenState extends State<OTPScreen> {
  final _emailController = TextEditingController();
  String _otpValue = '';
  int _errorTrigger = 0;
  bool _success = false;

  bool _isLoading = false;
  bool _otpSent = false;
  int _countdownSeconds = 60; // Matches backend OTP resend cooldown
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    if (widget.email != null) {
      _emailController.text = widget.email!;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _sendCode();
      });
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    setState(() {
      _countdownSeconds = 60;
    });
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_countdownSeconds == 0) {
        timer.cancel();
      } else {
        setState(() {
          _countdownSeconds--;
        });
      }
    });
  }

  Future<void> _sendCode() async {
    if (_isLoading) return; // Guard against double-tap duplicate submissions
    final email = _emailController.text.trim();
    if (email.isEmpty || !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      AppToast.show(context, message: 'Please enter a valid email address', type: ToastType.warning);
      return;
    }

    setState(() {
      _isLoading = true;
      _otpValue = '';
      _success = false;
    });
    try {
      final result = await ApiService.requestLoginOtp(email);
      if (!mounted) return;

      // Check for classified network/backend errors first
      final errorType = result['error_type']?.toString();
      if (errorType != null) {
        String msg;
        switch (errorType) {
          case 'timeout':
            msg = 'Request timed out. Please try again.';
            break;
          case 'backend_down':
            msg = 'Server not reachable. Check internet or try again later.';
            break;
          case 'misconfigured':
            msg = 'App configuration error. Please reinstall the app.';
            break;
          case 'ssl_error':
            msg = 'Secure connection failed. Please try again.';
            break;
          default:
            msg = result['detail']?.toString() ?? 'Failed to send OTP. Please try again.';
        }
        AppToast.show(context, message: msg, type: ToastType.error);
        return;
      }

      // Check success indicators in backend response
      final detail = result['detail']?.toString().toLowerCase() ?? '';
      final message = result['message']?.toString().toLowerCase() ?? '';
      if (detail.contains('sent') || message.contains('sent')) {
        setState(() {
          _otpSent = true;
        });
        _startTimer();
        AppToast.show(context, message: 'OTP sent to your email!', type: ToastType.success);
      } else {
        final rawMsg = result['detail'] ?? result['message'] ?? 'Failed to send OTP';
        AppToast.show(context, message: rawMsg.toString(), type: ToastType.error);
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.show(context, message: 'Unexpected error. Please try again.', type: ToastType.error);
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _verifyCode() async {
    if (_isLoading) return; // Guard against double-tap duplicate submissions
    final email = _emailController.text.trim();
    final otp = _otpValue;

    if (otp.length != 6) {
      AppToast.show(context, message: 'Please enter the 6-digit code', type: ToastType.warning);
      return;
    }

    setState(() => _isLoading = true);
    try {
      final result = await ApiService.verifyLoginOtp(email, otp);
      if (!mounted) return;

      if (result.containsKey('access_token')) {
        setState(() {
          _success = true;
        });
        HapticFeedback.heavyImpact();
        
        final bool introCompleted = result['introCompleted'] ?? false;
        final bool wizardCompleted = result['wizardCompleted'] ?? result['biometric_registered'] ?? false;
        final bool bioRegistered = result['biometric_registered'] ?? false;
        final String role = result['role'] ?? 'student';
        final String name = result['full_name'] ?? result['name'] ?? 'User';

        final session = context.read<SessionManager>();
        await session.saveSession(
          token: result['access_token'],
          refreshToken: result['refresh_token'] as String?,
          email: email,
          role: role,
          name: name,
          biometricRegistered: bioRegistered,
          introCompleted: introCompleted,
          wizardCompleted: wizardCompleted,
        );

        if (!mounted) return;

        AppToast.show(context, message: 'Verification successful!', type: ToastType.success);

        // Transition delay for success animation to play
        await Future.delayed(const Duration(milliseconds: 600));
        if (!mounted) return;

        // Redirect based on onboarding/intro and setup completion (matches RouteGuards handleRedirect)
        final roleLower = role.toLowerCase();
        if (!introCompleted) {
          context.go('/auth/intro');
        } else if (!wizardCompleted) {
          context.go('/setup/$roleLower');
        } else {
          if (roleLower == 'admin') {
            context.go('/admin/dashboard');
          } else if (roleLower == 'teacher' || roleLower == 'faculty' || roleLower == 'lecturer') {
            context.go('/teacher/dashboard');
          } else if (roleLower == 'parent') {
            context.go('/parent/dashboard');
          } else if (roleLower == 'hod' || roleLower == 'principal' || roleLower == 'management') {
            context.go('/management/dashboard');
          } else {
            context.go('/student/dashboard');
          }
        }
      } else {
        setState(() {
          _errorTrigger++;
        });
        final msg = result['detail'] ?? result['message'] ?? 'Invalid code. Please try again.';
        AppToast.show(context, message: msg.toString(), type: ToastType.error);
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorTrigger++;
      });
      AppToast.show(context, message: 'An unexpected error occurred. Please try again.', type: ToastType.error);
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScreenLayout(
      title: 'Sign in with OTP',
      subtitle: "No password needed. We'll email you a 6-digit code.",
      onBackTap: () => context.go('/auth/login'),
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
          ),
          const SizedBox(height: 22),

          // Primary Send Button
          if (!_otpSent)
            PrimaryButton(
              text: 'Send code',
              isLoading: _isLoading,
              onPressed: _sendCode,
            ),

          if (_otpSent) ...[
            const SizedBox(height: 8),
            const Divider(color: AuthDesign.underlineUnfocused, thickness: 1),
            const SizedBox(height: 16),

            // OTP Digit Boxes
            Center(
              child: PremiumOtpField(
                length: 6,
                errorTrigger: _errorTrigger,
                success: _success,
                onChanged: (val) {
                  setState(() {
                    _otpValue = val;
                  });
                },
                onCompleted: (val) {
                  setState(() {
                    _otpValue = val;
                  });
                  _verifyCode();
                },
              ),
            ),
            const SizedBox(height: 16),

            // Resend Code timer
            Center(
              child: _countdownSeconds > 0
                  ? Text.rich(
                      TextSpan(
                        text: 'Resend code in ',
                        style: AuthDesign.fontPoppins(fontSize: 11, fontWeight: FontWeight.w500, color: AuthDesign.textLabel),
                        children: [
                          TextSpan(
                            text: '0:${_countdownSeconds.toString().padLeft(2, '0')}',
                            style: AuthDesign.fontPoppins(fontSize: 11, fontWeight: FontWeight.w700, color: AuthDesign.primaryIndigo),
                          ),
                        ],
                      ),
                    )
                  : GestureDetector(
                      onTap: _sendCode,
                      child: Text(
                        'Resend code',
                        style: AuthDesign.fontPoppins(fontSize: 11, fontWeight: FontWeight.w700, color: AuthDesign.primaryIndigo),
                      ),
                    ),
            ),
            const SizedBox(height: 22),

            // Primary Verify Button
            PrimaryButton(
              text: 'Verify code',
              isLoading: _isLoading,
              onPressed: _verifyCode,
            ),
          ],
        ],
      ),
    );
  }
}
