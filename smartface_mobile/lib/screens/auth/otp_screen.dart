import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../core/session_manager.dart';
import '../../services/api_service.dart';
import '../../core/constants.dart';
import '../../widgets/toast_system.dart';

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
  String _nextRoute = '/dashboard';
  Map<String, dynamic> _extraArgs = {};

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
    _nextRoute = args?['nextRoute'] ?? '/dashboard';
    _extraArgs = Map<String, dynamic>.from(args ?? {});
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
        final setupComplete =
            res['setup_completed'] == true ||
            res['biometric_registered'] == true;
        final session = context.read<SessionManager>();
        await session.saveSession(
          token: res['access_token'],
          email: _email,
          role: (res['role'] ?? _extraArgs['role'] ?? 'student').toString(),
          biometricRegistered: setupComplete,
        );
        if (!mounted) return;

        HapticFeedback.heavyImpact();
        AppToast.show(
          context,
          title: 'Verified!',
          message: 'Welcome back 👋',
          type: ToastType.success,
        );
        await Future.delayed(600.ms);
        if (!mounted) return;
        final targetRoute = _nextRoute == '/dashboard' && !setupComplete
            ? '/setup'
            : _nextRoute;
        Navigator.pushReplacementNamed(
          context,
          targetRoute,
          arguments: {
            ..._extraArgs,
            'token': res['access_token'],
            'role': res['role'],
            'email': _email,
          },
        );
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
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(gradient: AppGradients.darkBg),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                // Back button
                Align(
                  alignment: Alignment.centerLeft,
                  child: IconButton(
                    icon: const Icon(
                      Icons.arrow_back_ios,
                      color: Colors.white70,
                    ),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
                const SizedBox(height: 24),

                // Icon
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.gold.withValues(alpha: 0.1),
                    border: Border.all(
                      color: AppColors.gold.withValues(alpha: 0.3),
                      width: 1.5,
                    ),
                    boxShadow: AppShadows.goldGlow(),
                  ),
                  child: const Icon(
                    Icons.lock_outline_rounded,
                    color: AppColors.gold,
                    size: 44,
                  ),
                ).animate().fadeIn(duration: 400.ms).scale(),

                const SizedBox(height: 28),

                Text(
                  'Verification Code',
                  style: AppText.display(color: Colors.white),
                ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.3),
                const SizedBox(height: 10),
                Text(
                  'Enter the 6-digit code sent to',
                  style: AppText.body(),
                  textAlign: TextAlign.center,
                ).animate().fadeIn(delay: 150.ms),
                const SizedBox(height: 4),
                Text(
                  _email,
                  style: AppText.body(
                    color: AppColors.gold,
                    weight: FontWeight.w600,
                  ),
                  textAlign: TextAlign.center,
                ).animate().fadeIn(delay: 200.ms),

                const SizedBox(height: 40),

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
                        width: 48,
                        height: 58,
                        margin: const EdgeInsets.symmetric(horizontal: 5),
                        child: TextField(
                          controller: _controllers[i],
                          focusNode: _focusNodes[i],
                          textAlign: TextAlign.center,
                          keyboardType: TextInputType.number,
                          maxLength: 1,
                          style: AppText.heading(
                            color: AppColors.gold,
                            weight: FontWeight.bold,
                          ),
                          decoration: InputDecoration(
                            counterText: '',
                            filled: true,
                            fillColor: AppColors.gold.withValues(alpha: 0.05),
                            enabledBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: BorderSide(
                                color: AppColors.gold.withValues(alpha: 0.2),
                                width: 1.5,
                              ),
                            ),
                            focusedBorder: OutlineInputBorder(
                              borderRadius: BorderRadius.circular(14),
                              borderSide: const BorderSide(
                                color: AppColors.gold,
                                width: 2,
                              ),
                            ),
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

                const SizedBox(height: 40),

                // Verify button
                SizedBox(
                  width: double.infinity,
                  height: 56,
                  child: ElevatedButton(
                    onPressed: _isVerifying ? null : _verifyOtp,
                    child: _isVerifying
                        ? const SizedBox(
                            width: 24,
                            height: 24,
                            child: CircularProgressIndicator(
                              strokeWidth: 2.5,
                              color: Colors.black,
                            ),
                          )
                        : Text('VERIFY CODE', style: AppText.button()),
                  ),
                ).animate().fadeIn(delay: 350.ms),

                const SizedBox(height: 28),

                // Resend row with circular countdown
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "Didn't receive it?  ",
                      style: AppText.body(color: AppColors.white38),
                    ),
                    _resendCooldown > 0
                        ? Row(
                            children: [
                              SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  value: _resendCooldown / 60,
                                  strokeWidth: 2,
                                  color: AppColors.gold,
                                  backgroundColor: AppColors.gold.withValues(
                                    alpha: 0.15,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                '${_resendCooldown}s',
                                style: AppText.body(color: AppColors.white38),
                              ),
                            ],
                          )
                        : GestureDetector(
                            onTap: _isResending ? null : _resendOtp,
                            child: Text(
                              _isResending ? 'Sending…' : 'Resend OTP',
                              style: AppText.body(
                                color: AppColors.gold,
                                weight: FontWeight.bold,
                              ),
                            ),
                          ),
                  ],
                ).animate().fadeIn(delay: 450.ms),

                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
