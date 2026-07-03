import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/features/auth/widgets/auth_shared_widgets.dart';

class OTPScreen extends StatefulWidget {
  const OTPScreen({super.key});

  @override
  State<OTPScreen> createState() => _OTPScreenState();
}

class _OTPScreenState extends State<OTPScreen> {
  final _emailController = TextEditingController();
  final List<TextEditingController> _digitControllers = List.generate(6, (_) => TextEditingController());
  final List<FocusNode> _focusNodes = List.generate(6, (_) => FocusNode());

  bool _isLoading = false;
  bool _otpSent = false;
  int _countdownSeconds = 45;
  Timer? _timer;

  @override
  void dispose() {
    _emailController.dispose();
    for (var controller in _digitControllers) {
      controller.dispose();
    }
    for (var node in _focusNodes) {
      node.dispose();
    }
    _timer?.cancel();
    super.dispose();
  }

  void _startTimer() {
    _timer?.cancel();
    setState(() {
      _countdownSeconds = 45;
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
    final email = _emailController.text.trim();
    if (email.isEmpty || !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      AppToast.show(context, message: 'Please enter a valid email address', type: ToastType.warning);
      return;
    }

    setState(() => _isLoading = true);
    try {
      final result = await ApiService.requestLoginOtp(email);
      if (!mounted) return;

      if (result.containsKey('detail') && result['detail'].toString().contains('sent')) {
        setState(() {
          _otpSent = true;
        });
        _startTimer();
        AppToast.show(context, message: 'OTP sent to your email!', type: ToastType.success);
        // Focus first digit box
        _focusNodes[0].requestFocus();
      } else {
        throw Exception(result['detail'] ?? 'Failed to send OTP');
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.show(context, message: 'OTP Error: $e', type: ToastType.error);
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _verifyCode() async {
    final email = _emailController.text.trim();
    final otp = _digitControllers.map((c) => c.text).join();

    if (otp.length != 6) {
      AppToast.show(context, message: 'Please enter the 6-digit code', type: ToastType.warning);
      return;
    }

    setState(() => _isLoading = true);
    try {
      final result = await ApiService.verifyLoginOtp(email, otp);
      if (!mounted) return;

      if (result.containsKey('access_token')) {
        HapticFeedback.heavyImpact();
        final session = context.read<SessionManager>();

        final bool bioRegistered = result['biometric_registered'] ?? false;
        final String role = result['role'] ?? 'student';
        final String name = result['full_name'] ?? result['name'] ?? 'User';

        await session.saveSession(
          token: result['access_token'],
          email: email,
          role: role,
          name: name,
          biometricRegistered: bioRegistered,
        );

        if (!mounted) return;

        if (bioRegistered) {
          final roleLower = role.toLowerCase();
          if (roleLower == 'admin') {
            context.go('/admin/home');
          } else if (roleLower == 'teacher' || roleLower == 'faculty' || roleLower == 'lecturer') {
            context.go('/teacher/home');
          } else if (roleLower == 'parent') {
            context.go('/parent/dashboard');
          } else {
            context.go('/student/home');
          }
        } else {
          context.go('/auth/setup');
        }
      } else {
        throw Exception(result['detail'] ?? 'Invalid code. Please try again.');
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.show(context, message: 'Verification Error: $e', type: ToastType.error);
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
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(6, (index) {
                  return Container(
                    width: 44,
                    height: 44,
                    margin: const EdgeInsets.symmetric(horizontal: 4.0),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(
                        color: _digitControllers[index].text.isNotEmpty
                            ? AuthDesign.primaryIndigo
                            : AuthDesign.underlineUnfocused,
                        width: 1.5,
                      ),
                    ),
                    child: Center(
                      child: TextField(
                        controller: _digitControllers[index],
                        focusNode: _focusNodes[index],
                        keyboardType: TextInputType.number,
                        textAlign: TextAlign.center,
                        maxLength: 1,
                        style: AuthDesign.fontPoppins(
                          fontSize: 18,
                          fontWeight: FontWeight.w700,
                          color: AuthDesign.textHeading,
                        ),
                        inputFormatters: [
                          FilteringTextInputFormatter.digitsOnly,
                        ],
                        decoration: const InputDecoration(
                          counterText: '',
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.zero,
                        ),
                        onChanged: (value) {
                          if (value.isNotEmpty) {
                            if (index < 5) {
                              _focusNodes[index + 1].requestFocus();
                            } else {
                              _focusNodes[index].unfocus();
                            }
                          } else {
                            if (index > 0) {
                              _focusNodes[index - 1].requestFocus();
                            }
                          }
                          setState(() {}); // Update border color
                        },
                      ),
                    ),
                  );
                }),
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
