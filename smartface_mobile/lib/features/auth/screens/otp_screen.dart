/*
|--------------------------------------------------------------------------
| File: otp_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the screen for OTP code input to verify authentication sessions
| initiated via institutional email login flow.
|
| Responsibilities:
| - Provides auto-focus progression for 6 distinct digit-entry boxes.
| - Renders an animated cooldown countdown before enabling OTP resending.
| - Performs vibration and shake responses for invalid OTP attempts.
|
| Dependencies:
| - package:flutter/material.dart
| - package:flutter/services.dart
| - package:flutter_animate/flutter_animate.dart
| - package:smartface_attendance/data/services/api_service.dart
| - package:smartface_attendance/core/constants.dart
| - package:smartface_attendance/shared/widgets/toast_system.dart
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';

// ======================================================
// Services & Core Imports
// ======================================================
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/shared/widgets/glow_button.dart';
import 'package:smartface_attendance/shared/widgets/auth_blob_background.dart';

/// Screen widget for entering institutional email verification codes.
class OTPScreen extends StatefulWidget {
  const OTPScreen({super.key});

  @override
  State<OTPScreen> createState() => _OTPScreenState();
}

class _OTPScreenState extends State<OTPScreen> with TickerProviderStateMixin {
  final List<TextEditingController> _controllers = List.generate(
    6,
    (_) => TextEditingController(),
  );
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  bool _isVerifying = false;
  bool _isResending = false;
  int _resendCooldown = 60;
  Timer? _timer;
  late AnimationController _shakeController;
  late Animation<double> _shakeAnimation;

  String _email = '';

  @override
  void initState() {
    super.initState();
    _shakeController = AnimationController(vsync: this, duration: 500.ms);
    _shakeAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _shakeController, curve: Curves.elasticOut),
    );
    _startCooldown();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    _email = args?['email'] ?? '';
  }

  @override
  void dispose() {
    _timer?.cancel();
    _shakeController.dispose();
    for (final c in _controllers) {
      c.dispose();
    }
    for (final f in _focusNodes) {
      f.dispose();
    }
    super.dispose();
  }

  void _startCooldown() {
    _resendCooldown = 60;
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) {
        t.cancel();
        return;
      }
      setState(() {
        if (_resendCooldown > 0) {
          _resendCooldown--;
        } else {
          t.cancel();
        }
      });
    });
  }

  String get _otpValue => _controllers.map((c) => c.text).join();

  void _onDigitChanged(int index, String value) {
    if (value.length == 1 && index < 5) {
      _focusNodes[index + 1].requestFocus();
    } else if (value.isEmpty && index > 0) {
      _focusNodes[index - 1].requestFocus();
    }
    // Auto-verify when all filled
    if (_otpValue.length == 6) _verifyOtp();
  }

  Future<void> _verifyOtp() async {
    if (_isVerifying || _otpValue.length < 6) return;
    setState(() => _isVerifying = true);
    HapticFeedback.mediumImpact();

    try {
      final res = await ApiService.verifyLoginOtp(_email, _otpValue);
      if (!mounted) return;

      if (res.containsKey('access_token')) {
        HapticFeedback.heavyImpact();
        AppToast.show(
          context,
          title: 'Verified!',
          message: 'Welcome back 👋',
          type: ToastType.success,
        );
        await Future.delayed(600.ms);
        if (!mounted) return;
        final session = context.read<SessionManager>();
        await session.saveSession(
          token: res['access_token'],
          email: _email,
          role: res['role'],
        );

        if (!mounted) return;
        final bool biometricRegistered =
            res['biometric_registered'] ?? false;
        final String targetRoute = biometricRegistered
            ? (res['role']?.toString().toLowerCase() == 'admin'
                  ? '/admin/home'
                  : (res['role']?.toString().toLowerCase() == 'teacher' ||
                            res['role']?.toString().toLowerCase() ==
                                'faculty'
                        ? '/teacher/home'
                        : '/student/home'))
            : '/auth/setup';

        context.go(targetRoute);
      } else {
        _shakeController.forward(from: 0);
        HapticFeedback.vibrate();
        AppToast.show(
          context,
          message: res['detail'] ?? 'Invalid OTP. Try again.',
          type: ToastType.error,
        );
        for (final c in _controllers) {
          c.clear();
        }
        _focusNodes[0].requestFocus();
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        message: 'Network error. Please retry.',
        type: ToastType.error,
      );
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  Future<void> _resendOtp() async {
    if (_isResending || _resendCooldown > 0) return;
    setState(() => _isResending = true);

    final res = await ApiService.sendLoginOtp(_email);
    if (!mounted) return;
    setState(() => _isResending = false);

    if (res.containsKey('message')) {
      AppToast.show(
        context,
        title: 'OTP Sent',
        message: 'A new code was sent to $_email',
        type: ToastType.success,
      );
      for (final c in _controllers) {
        c.clear();
      }
      _focusNodes[0].requestFocus();
      _startCooldown();
    } else {
      AppToast.show(
        context,
        message: res['detail'] ?? 'Failed to resend OTP',
        type: ToastType.error,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF3559E0);
    const primaryGlow = Color(0x333559E0);

    return Scaffold(
      backgroundColor: Colors.transparent,
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          const AuthBlobBackground(),
          
          // Back button at top-left
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
                      onPressed: () => Navigator.pop(context),
                    ),
                  ),
                ),
              ),
            ),
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
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
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          // Lock Icon HUD
                          Container(
                            padding: const EdgeInsets.all(20),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: primaryColor.withValues(alpha: 0.08),
                              border: Border.all(
                                color: primaryColor.withValues(alpha: 0.2),
                                width: 1.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: primaryGlow.withValues(alpha: 0.2),
                                  blurRadius: 18,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                            child: const Icon(
                              Icons.lock_open_rounded,
                              color: primaryColor,
                              size: 40,
                            ),
                          ).animate().fadeIn(duration: 400.ms).scale(),

                          const SizedBox(height: 24),

                          Text(
                            'Verification Code',
                            style: GoogleFonts.outfit(
                              fontSize: 28,
                              fontWeight: FontWeight.w900,
                              color: const Color(0xFF1B2C56),
                              letterSpacing: -0.5,
                            ),
                          ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.3),
                          const SizedBox(height: 10),
                          Text(
                            'Enter the 6-digit code sent to',
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              color: const Color(0xFF7F8CA4),
                            ),
                            textAlign: TextAlign.center,
                          ).animate().fadeIn(delay: 150.ms),
                          const SizedBox(height: 4),
                          Text(
                            _email,
                            style: GoogleFonts.inter(
                              color: primaryColor,
                              fontSize: 14,
                              fontWeight: FontWeight.bold,
                            ),
                            textAlign: TextAlign.center,
                          ).animate().fadeIn(delay: 200.ms),

                          const SizedBox(height: 32),

                          // OTP Boxes with shake animation on error
                          AnimatedBuilder(
                            animation: _shakeAnimation,
                            builder: (_, child) => Transform.translate(
                              offset: Offset(
                                8 *
                                    (_shakeAnimation.value <= 0.5
                                        ? _shakeAnimation.value * 2
                                        : (1 - _shakeAnimation.value) * 2) *
                                    ((_shakeAnimation.value * 6).toInt() % 2 == 0
                                        ? 1
                                        : -1),
                                0,
                              ),
                              child: child,
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: List.generate(6, (i) {
                                return Container(
                                  width: 40,
                                  height: 52,
                                  margin: const EdgeInsets.symmetric(horizontal: 3),
                                  child: TextField(
                                    controller: _controllers[i],
                                    focusNode: _focusNodes[i],
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
                                      filled: true,
                                      fillColor: Color(0xFFF6F8FF),
                                      enabledBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.all(Radius.circular(12)),
                                        borderSide: BorderSide(
                                          color: Color(0xFFE2E6FF),
                                          width: 1.2,
                                        ),
                                      ),
                                      focusedBorder: OutlineInputBorder(
                                        borderRadius: BorderRadius.all(Radius.circular(12)),
                                        borderSide: BorderSide(
                                          color: primaryColor,
                                          width: 1.8,
                                        ),
                                      ),
                                      contentPadding: EdgeInsets.zero,
                                    ),
                                    inputFormatters: [
                                      FilteringTextInputFormatter.digitsOnly,
                                    ],
                                    onChanged: (v) => _onDigitChanged(i, v),
                                  ),
                                );
                              }),
                            ),
                          ).animate().fadeIn(delay: 250.ms).slideY(begin: 0.2),

                          const SizedBox(height: 32),

                          // Verify button
                          SizedBox(
                            width: double.infinity,
                            height: 52,
                            child: GlowButton(
                              onPressed: _isVerifying ? () {} : _verifyOtp,
                              color: primaryColor,
                              glowColor: primaryGlow,
                              borderRadius: 14,
                              padding: EdgeInsets.zero,
                              child: _isVerifying
                                  ? const SizedBox(
                                      width: 24,
                                      height: 24,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2.5,
                                        color: Colors.white,
                                      ),
                                    )
                                  : Text(
                                      'VERIFY CODE',
                                      style: GoogleFonts.inter(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                        letterSpacing: 0.8,
                                        color: Colors.white,
                                      ),
                                    ),
                            ),
                          ).animate().fadeIn(delay: 350.ms),

                          const SizedBox(height: 24),

                          // Resend row with circular countdown
                          Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                "Didn't receive it?  ",
                                style: GoogleFonts.inter(
                                  fontSize: 13,
                                  color: const Color(0xFF7F8CA4),
                                ),
                              ),
                              _resendCooldown > 0
                                  ? Row(
                                      children: [
                                        SizedBox(
                                          width: 16,
                                          height: 16,
                                          child: CircularProgressIndicator(
                                            value: _resendCooldown / 60,
                                            strokeWidth: 2,
                                            color: primaryColor,
                                            backgroundColor: primaryColor.withValues(
                                              alpha: 0.15,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        Text(
                                          '${_resendCooldown}s',
                                          style: GoogleFonts.inter(
                                            fontSize: 13,
                                            color: const Color(0xFF7F8CA4),
                                          ),
                                        ),
                                      ],
                                    )
                                  : GestureDetector(
                                      onTap: _isResending ? null : _resendOtp,
                                      child: Text(
                                        _isResending ? 'Sending…' : 'Resend OTP',
                                        style: GoogleFonts.inter(
                                          color: primaryColor,
                                          fontWeight: FontWeight.bold,
                                          fontSize: 13,
                                        ),
                                      ),
                                    ),
                            ],
                          ).animate().fadeIn(delay: 450.ms),
                        ],
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
}
