/*
|--------------------------------------------------------------------------
| File: forgot_password_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the multi-step recovery screen allowing users to verify their identity
| via email OTP and securely set a new password.
|
| Responsibilities:
| - Collects and validates institutional email address.
| - Collects multi-box OTP entry fields.
| - Performs password strength checking and validation.
| - Updates credentials via ApiService resets.
|
| Dependencies:
| - package:flutter/material.dart
| - package:flutter_animate/flutter_animate.dart
| - package:smartface_attendance/data/services/api_service.dart
| - package:smartface_attendance/core/constants.dart
| - package:smartface_attendance/shared/widgets/toast_system.dart
|--------------------------------------------------------------------------
*/

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

// ======================================================
// Services & Core Imports
// ======================================================
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/shared/widgets/glow_button.dart';
import 'package:smartface_attendance/shared/widgets/auth_blob_background.dart';

/// Multi-step password recovery widget flow.
class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

/// State controller managing input fields, step animations, and strength meters.
class _ForgotPasswordScreenState extends State<ForgotPasswordScreen>
    with TickerProviderStateMixin {
  // Multi-step: 0=Email, 1=OTP & NewPassword, 3=Success
  int _step = 0;

  final _emailCtrl = TextEditingController();
  final List<TextEditingController> _otpCtrls = List.generate(
    6,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _otpFocus = List.generate(6, (_) => FocusNode());
  final _passCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();

  bool _loading = false;
  bool _passVisible = false;
  bool _confirmPassVisible = false;
  String _emailForReset = '';
  double _passStrength = 0;

  late AnimationController _successCtrl;

  @override
  void initState() {
    super.initState();
    _successCtrl = AnimationController(vsync: this, duration: 800.ms);
    _passCtrl.addListener(_evaluateStrength);
  }

  @override
  void dispose() {
    _successCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confirmPassCtrl.dispose();
    for (final c in _otpCtrls) {
      c.dispose();
    }
    for (final f in _otpFocus) {
      f.dispose();
    }
    super.dispose();
  }

  void _evaluateStrength() {
    final p = _passCtrl.text;
    double s = 0;
    if (p.length >= 8) s += 0.25;
    if (p.contains(RegExp(r'[A-Z]'))) s += 0.25;
    if (p.contains(RegExp(r'[0-9]'))) s += 0.25;
    if (p.contains(RegExp(r'[!@#\$&*~%^()]'))) s += 0.25;
    setState(() => _passStrength = s);
  }

  Color get _strengthColor {
    if (_passStrength < 0.4) return AppColors.error;
    if (_passStrength < 0.75) return AppColors.warning;
    return AppColors.success;
  }

  String get _strengthLabel {
    if (_passStrength < 0.4) return 'Weak';
    if (_passStrength < 0.75) return 'Good';
    return 'Strong';
  }

  String get _otpValue => _otpCtrls.map((c) => c.text).join();

  Future<void> _sendOtp() async {
    final email = _emailCtrl.text.trim();
    if (email.isEmpty || !email.contains('@')) {
      AppToast.show(
        context,
        message: 'Enter a valid email address',
        type: ToastType.error,
      );
      return;
    }
    setState(() => _loading = true);
    final res = await ApiService.forgotPassword(email);
    if (!mounted) return;
    setState(() => _loading = false);

    if (res.containsKey('message')) {
      _emailForReset = email;
      AppToast.show(
        context,
        title: 'Code Sent',
        message: 'OTP sent to $email',
        type: ToastType.success,
      );
      setState(() => _step = 1);
    } else {
      AppToast.show(
        context,
        message: res['detail'] ?? 'Email not found',
        type: ToastType.error,
      );
    }
  }

  Future<void> _verifyAndReset() async {
    if (_otpValue.length < 6) {
      AppToast.show(
        context,
        message: 'Please enter the 6-digit OTP',
        type: ToastType.warning,
      );
      return;
    }
    final newPass = _passCtrl.text;
    final confirm = _confirmPassCtrl.text;

    if (newPass != confirm) {
      AppToast.show(
        context,
        message: 'Passwords do not match',
        type: ToastType.error,
      );
      return;
    }
    if (_passStrength < 0.5) {
      AppToast.show(
        context,
        message: 'Please use a stronger password',
        type: ToastType.warning,
      );
      return;
    }

    setState(() => _loading = true);
    final res = await ApiService.resetPassword(
      _emailForReset,
      _otpValue,
      newPass,
    );
    if (!mounted) return;
    setState(() => _loading = false);

    if (res.containsKey('message')) {
      setState(() => _step = 3);
      _successCtrl.forward();
    } else {
      AppToast.show(
        context,
        message: res['detail'] ?? 'Reset failed',
        type: ToastType.error,
      );
    }
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool obscureText = false,
    Widget? suffixIcon,
    TextInputType? keyboardType,
  }) {
    return Focus(
      child: Builder(
        builder: (context) {
          final isFocused = Focus.of(context).hasFocus;
          return AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              color: const Color(0xFFF6F8FF), // light blue-gray
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isFocused
                    ? const Color(0xFF3559E0)
                    : const Color(0xFFE2E6FF),
                width: 1.2,
              ),
            ),
            child: TextField(
              controller: controller,
              obscureText: obscureText,
              keyboardType: keyboardType,
              style: GoogleFonts.inter(color: const Color(0xFF1B2C56), fontSize: 14),
              decoration: InputDecoration(
                prefixIcon: Icon(
                  icon,
                  color: isFocused ? const Color(0xFF3559E0) : const Color(0xFF8F9BB3),
                  size: 20,
                ),
                hintText: hint,
                hintStyle: GoogleFonts.inter(
                  color: const Color(0xFF8F9BB3),
                  fontSize: 14,
                ),
                suffixIcon: suffixIcon,
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 16,
                  vertical: 14,
                ),
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildActionButton(String text, VoidCallback onPressed) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: GlowButton(
        onPressed: _loading ? () {} : onPressed,
        borderRadius: 14,
        color: const Color(0xFF3559E0),
        glowColor: const Color(0xFF3559E0).withValues(alpha: 0.3),
        padding: EdgeInsets.zero,
        child: _loading
            ? const SizedBox(
                width: 24,
                height: 24,
                child: CircularProgressIndicator(
                  strokeWidth: 2.5,
                  color: Colors.white,
                ),
              )
            : Text(
                text,
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                  letterSpacing: 0.8,
                  color: Colors.white,
                ),
              ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          // 🌌 Fluid blob gradient background (project palette)
          const AuthBlobBackground(),

          // Back button at top-left
          if (_step != 3)
            Positioned(
              top: 16,
              left: 16,
              child: SafeArea(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(14),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F4FF).withValues(alpha: 0.5),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(
                          color: const Color(0xFFE2E6FF),
                        ),
                      ),
                      child: IconButton(
                        icon: const Icon(
                          Icons.arrow_back_ios_new_rounded,
                          color: Color(0xFF1B2C56),
                          size: 20,
                        ),
                        onPressed: () {
                          if (_step == 1) {
                            setState(() => _step = 0);
                          } else {
                            Navigator.pop(context);
                          }
                        },
                      ),
                    ),
                  ),
                ),
              ),
            ),

          // 📱 Main Scroll Layout
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(
                  horizontal: 24.0,
                  vertical: 16.0,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(height: 40),
                    // Main Form Card
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(28),
                        boxShadow: [
                          BoxShadow(
                            color: const Color(0xFF9EAFD8).withValues(alpha: 0.16),
                            blurRadius: 32,
                            spreadRadius: 2,
                            offset: const Offset(0, 16),
                          ),
                        ],
                      ),
                      child: AnimatedSwitcher(
                        duration: 300.ms,
                        transitionBuilder: (child, anim) => FadeTransition(
                          opacity: anim,
                          child: SlideTransition(
                            position: Tween<Offset>(
                              begin: const Offset(0.05, 0),
                              end: Offset.zero,
                            ).animate(anim),
                            child: child,
                          ),
                        ),
                        child: _buildStep(),
                      ),
                    ).animate().fadeIn(delay: 100.ms, duration: 400.ms),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 0:
        return _buildEmailStep();
      case 1:
        return _buildOtpAndPasswordStep();
      case 3:
        return _buildSuccessStep();
      default:
        return _buildEmailStep();
    }
  }

  Widget _buildEmailStep() {
    return Column(
      key: const ValueKey('email'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Step indicator
        const _StepIndicator(current: 0),
        const SizedBox(height: 24),
        Text(
          'Reset Password',
          style: GoogleFonts.outfit(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: const Color(0xFF1B2C56),
            letterSpacing: -0.5,
          ),
        ).animate().fadeIn().slideY(begin: 0.3),
        const SizedBox(height: 8),
        Text(
          'Enter your registered email to receive a verification code.',
          style: GoogleFonts.inter(
            fontSize: 14,
            color: const Color(0xFF7F8CA4),
            height: 1.4,
          ),
        ).animate().fadeIn(delay: 100.ms),
        const SizedBox(height: 32),
        _buildTextField(
          controller: _emailCtrl,
          hint: 'Email Address',
          icon: Icons.email_outlined,
          keyboardType: TextInputType.emailAddress,
        ).animate().fadeIn(delay: 200.ms),
        const SizedBox(height: 24),
        _buildActionButton('SEND CODE', _sendOtp).animate().fadeIn(delay: 300.ms),
      ],
    );
  }

  Widget _buildOtpAndPasswordStep() {
    return Column(
      key: const ValueKey('otp'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const _StepIndicator(current: 1),
        const SizedBox(height: 24),
        Text(
          'Verify & Reset',
          style: GoogleFonts.outfit(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: const Color(0xFF1B2C56),
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Enter the code sent to $_emailForReset and your new password.',
          style: GoogleFonts.inter(
            fontSize: 14,
            color: const Color(0xFF7F8CA4),
            height: 1.4,
          ),
        ),
        const SizedBox(height: 28),

        // OTP boxes
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            6,
            (i) => Container(
              width: 40,
              height: 52,
              margin: const EdgeInsets.symmetric(horizontal: 3),
              child: TextField(
                controller: _otpCtrls[i],
                focusNode: _otpFocus[i],
                textAlign: TextAlign.center,
                keyboardType: TextInputType.number,
                maxLength: 1,
                style: GoogleFonts.inter(
                  color: const Color(0xFF1B2C56),
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                ),
                decoration: const InputDecoration(
                  counterText: '',
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(
                      color: Color(0xFFE2E6FF),
                      width: 1.2,
                    ),
                    borderRadius: BorderRadius.all(Radius.circular(12)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Color(0xFF3559E0), width: 1.8),
                    borderRadius: BorderRadius.all(Radius.circular(12)),
                  ),
                  fillColor: Color(0xFFF6F8FF),
                  filled: true,
                  contentPadding: EdgeInsets.zero,
                ),
                onChanged: (v) {
                  if (v.length == 1 && i < 5) _otpFocus[i + 1].requestFocus();
                  if (v.isEmpty && i > 0) _otpFocus[i - 1].requestFocus();
                },
              ),
            ),
          ),
        ),
        const SizedBox(height: 24),

        // New Password
        _buildTextField(
          controller: _passCtrl,
          hint: 'New Password',
          icon: Icons.lock_outline_rounded,
          obscureText: !_passVisible,
          suffixIcon: IconButton(
            icon: Icon(
              _passVisible ? Icons.visibility_off_outlined : Icons.visibility_outlined,
              color: const Color(0xFF8F9BB3),
              size: 20,
            ),
            onPressed: () => setState(() => _passVisible = !_passVisible),
          ),
        ),
        const SizedBox(height: 8),

        // Strength bar
        if (_passCtrl.text.isNotEmpty) ...[
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: _passStrength,
              backgroundColor: const Color(0xFFE2E6FF),
              valueColor: AlwaysStoppedAnimation<Color>(_strengthColor),
              minHeight: 5,
            ),
          ),
          const SizedBox(height: 6),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Password Strength',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: const Color(0xFF8F9BB3),
                ),
              ),
              Text(
                _strengthLabel,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: _strengthColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
        ],

        // Confirm Password
        _buildTextField(
          controller: _confirmPassCtrl,
          hint: 'Confirm Password',
          icon: Icons.lock_reset_outlined,
          obscureText: !_confirmPassVisible,
          suffixIcon: IconButton(
            icon: Icon(
              _confirmPassVisible ? Icons.visibility_off_outlined : Icons.visibility_outlined,
              color: const Color(0xFF8F9BB3),
              size: 20,
            ),
            onPressed: () =>
                setState(() => _confirmPassVisible = !_confirmPassVisible),
          ),
        ),
        const SizedBox(height: 24),

        _buildActionButton('RESET PASSWORD', _verifyAndReset),
      ],
    );
  }

  Widget _buildSuccessStep() {
    return Column(
      key: const ValueKey('success'),
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 32),
        // Animated success circle
        AnimatedBuilder(
          animation: _successCtrl,
          builder: (ctx, child) => Transform.scale(
            scale: _successCtrl.value,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.success.withValues(alpha: 0.15),
                border: Border.all(color: AppColors.success, width: 2),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.success.withValues(alpha: 0.2),
                    blurRadius: 16,
                    spreadRadius: 1,
                  ),
                ],
              ),
              child: const Icon(
                Icons.check_rounded,
                color: AppColors.success,
                size: 48,
              ),
            ),
          ),
        ),
        const SizedBox(height: 28),
        Text(
          'Password Reset!',
          style: GoogleFonts.outfit(
            fontSize: 28,
            fontWeight: FontWeight.w900,
            color: const Color(0xFF1B2C56),
            letterSpacing: -0.5,
          ),
        ).animate().fadeIn(delay: 400.ms),
        const SizedBox(height: 12),
        Text(
          'Your password has been updated successfully.',
          style: GoogleFonts.inter(
            fontSize: 14,
            color: const Color(0xFF7F8CA4),
            height: 1.4,
          ),
          textAlign: TextAlign.center,
        ).animate().fadeIn(delay: 500.ms),
        const SizedBox(height: 32),
        _buildActionButton('BACK TO LOGIN', () => context.go('/auth/login'))
            .animate()
            .fadeIn(delay: 600.ms),
      ],
    );
  }
}

// ── Step Progress Indicator ──────────────────────────────────────
class _StepIndicator extends StatelessWidget {
  final int current;
  const _StepIndicator({required this.current});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: List.generate(3, (i) {
        final active = i <= current;
        return Expanded(
          child: Container(
            margin: EdgeInsets.only(right: i < 2 ? 8 : 0),
            height: 4,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(2),
              color: active ? const Color(0xFF3559E0) : const Color(0xFFE2E6FF),
            ),
          ),
        );
      }),
    );
  }
}
