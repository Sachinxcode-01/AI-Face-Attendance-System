import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../services/api_service.dart';
import '../../core/constants.dart';
import '../../widgets/toast_system.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen>
    with TickerProviderStateMixin {
  // Multi-step: 0=Email, 1=OTP, 2=NewPassword, 3=Success
  int _step = 0;

  final _emailCtrl = TextEditingController();
  final List<TextEditingController> _otpCtrls =
      List.generate(6, (_) => TextEditingController());
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
    for (final c in _otpCtrls) { c.dispose(); }
    for (final f in _otpFocus) { f.dispose(); }
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
      AppToast.show(context,
          message: 'Enter a valid email address', type: ToastType.error);
      return;
    }
    setState(() => _loading = true);
    final res = await ApiService.forgotPassword(email);
    if (!mounted) return;
    setState(() => _loading = false);

    if (res.containsKey('message')) {
      _emailForReset = email;
      AppToast.show(context,
          title: 'Code Sent',
          message: 'OTP sent to $email',
          type: ToastType.success);
      setState(() => _step = 1);
    } else {
      AppToast.show(context,
          message: res['detail'] ?? 'Email not found', type: ToastType.error);
    }
  }

  Future<void> _verifyAndReset() async {
    if (_otpValue.length < 6) return;
    final newPass = _passCtrl.text;
    final confirm = _confirmPassCtrl.text;

    if (newPass != confirm) {
      AppToast.show(context,
          message: 'Passwords do not match', type: ToastType.error);
      return;
    }
    if (_passStrength < 0.5) {
      AppToast.show(context,
          message: 'Please use a stronger password', type: ToastType.warning);
      return;
    }

    setState(() => _loading = true);
    // Step 1: verify OTP (reuse login-otp/verify endpoint logic via forgotPassword flow)
    final res = await ApiService.resetPassword(_emailForReset, _otpValue, newPass);
    if (!mounted) return;
    setState(() => _loading = false);

    if (res.containsKey('message')) {
      setState(() => _step = 3);
      _successCtrl.forward();
    } else {
      AppToast.show(context,
          message: res['detail'] ?? 'Reset failed', type: ToastType.error);
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
            child: AnimatedSwitcher(
              duration: 400.ms,
              transitionBuilder: (child, anim) => FadeTransition(
                opacity: anim,
                child: SlideTransition(
                  position: Tween<Offset>(
                          begin: const Offset(0.05, 0), end: Offset.zero)
                      .animate(anim),
                  child: child,
                ),
              ),
              child: _buildStep(),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStep() {
    switch (_step) {
      case 0: return _buildEmailStep();
      case 1: return _buildOtpAndPasswordStep();
      case 3: return _buildSuccessStep();
      default: return _buildEmailStep();
    }
  }

  Widget _buildEmailStep() {
    return Column(
      key: const ValueKey('email'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white70),
          onPressed: () => Navigator.pop(context),
        ),
        const SizedBox(height: 30),
        // Step indicator
        _StepIndicator(current: 0),
        const SizedBox(height: 32),
        Text('Reset Password', style: AppText.display())
            .animate().fadeIn().slideY(begin: 0.3),
        const SizedBox(height: 8),
        Text('Enter your registered email to receive a verification code.',
                style: AppText.body())
            .animate().fadeIn(delay: 100.ms),
        const SizedBox(height: 40),
        TextField(
          controller: _emailCtrl,
          style: const TextStyle(color: Colors.white),
          keyboardType: TextInputType.emailAddress,
          decoration: InputDecoration(
            labelText: 'Email Address',
            prefixIcon: const Icon(Icons.email_outlined, color: AppColors.gold),
          ),
        ).animate().fadeIn(delay: 200.ms),
        const SizedBox(height: 28),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: _loading ? null : _sendOtp,
            child: _loading
                ? const SizedBox(
                    width: 24, height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.black))
                : Text('SEND CODE', style: AppText.button()),
          ),
        ).animate().fadeIn(delay: 300.ms),
      ],
    );
  }

  Widget _buildOtpAndPasswordStep() {
    return Column(
      key: const ValueKey('otp'),
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        IconButton(
          icon: const Icon(Icons.arrow_back_ios, color: Colors.white70),
          onPressed: () => setState(() => _step = 0),
        ),
        const SizedBox(height: 20),
        _StepIndicator(current: 1),
        const SizedBox(height: 32),
        Text('Verify & Reset', style: AppText.display()),
        const SizedBox(height: 8),
        Text('Enter the code sent to $_emailForReset and your new password.',
            style: AppText.body()),
        const SizedBox(height: 30),

        // OTP boxes
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(6, (i) => Container(
            width: 46, height: 56,
            margin: const EdgeInsets.symmetric(horizontal: 4),
            child: TextField(
              controller: _otpCtrls[i],
              focusNode: _otpFocus[i],
              textAlign: TextAlign.center,
              keyboardType: TextInputType.number,
              maxLength: 1,
              style: AppText.heading(color: AppColors.gold, weight: FontWeight.bold),
              decoration: const InputDecoration(
                counterText: '',
                enabledBorder: OutlineInputBorder(
                  borderSide: BorderSide(color: AppColors.white12, width: 1.5),
                  borderRadius: BorderRadius.all(Radius.circular(12)),
                ),
                focusedBorder: OutlineInputBorder(
                  borderSide: BorderSide(color: AppColors.gold, width: 2),
                  borderRadius: BorderRadius.all(Radius.circular(12)),
                ),
                fillColor: Color(0x0AFFFF00),
                filled: true,
              ),
              onChanged: (v) {
                if (v.length == 1 && i < 5) _otpFocus[i + 1].requestFocus();
                if (v.isEmpty && i > 0) _otpFocus[i - 1].requestFocus();
              },
            ),
          )),
        ),
        const SizedBox(height: 28),

        // New Password
        TextField(
          controller: _passCtrl,
          obscureText: !_passVisible,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            labelText: 'New Password',
            prefixIcon: const Icon(Icons.lock_outline, color: AppColors.gold),
            suffixIcon: IconButton(
              icon: Icon(
                _passVisible ? Icons.visibility_off : Icons.visibility,
                color: AppColors.white38,
              ),
              onPressed: () => setState(() => _passVisible = !_passVisible),
            ),
          ),
        ),
        const SizedBox(height: 8),

        // Strength bar
        if (_passCtrl.text.isNotEmpty) ...[
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: _passStrength,
              backgroundColor: AppColors.white12,
              valueColor: AlwaysStoppedAnimation<Color>(_strengthColor),
              minHeight: 5,
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Password Strength', style: AppText.caption()),
              Text(_strengthLabel,
                  style: AppText.caption(color: _strengthColor)),
            ],
          ),
        ],
        const SizedBox(height: 14),

        // Confirm Password
        TextField(
          controller: _confirmPassCtrl,
          obscureText: !_confirmPassVisible,
          style: const TextStyle(color: Colors.white),
          decoration: InputDecoration(
            labelText: 'Confirm Password',
            prefixIcon: const Icon(Icons.lock_reset_outlined, color: AppColors.gold),
            suffixIcon: IconButton(
              icon: Icon(
                _confirmPassVisible ? Icons.visibility_off : Icons.visibility,
                color: AppColors.white38,
              ),
              onPressed: () => setState(() => _confirmPassVisible = !_confirmPassVisible),
            ),
          ),
        ),
        const SizedBox(height: 32),

        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: _loading ? null : _verifyAndReset,
            child: _loading
                ? const SizedBox(
                    width: 24, height: 24,
                    child: CircularProgressIndicator(strokeWidth: 2.5, color: Colors.black))
                : Text('RESET PASSWORD', style: AppText.button()),
          ),
        ),
      ],
    );
  }

  Widget _buildSuccessStep() {
    return Column(
      key: const ValueKey('success'),
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        const SizedBox(height: 80),
        // Animated success circle
        AnimatedBuilder(
          animation: _successCtrl,
          builder: (ctx, child) => Transform.scale(
            scale: _successCtrl.value,
            child: Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.success.withValues(alpha: 0.15),
                border: Border.all(color: AppColors.success, width: 2),
                boxShadow: AppShadows.glow(AppColors.success),
              ),
              child: const Icon(Icons.check_rounded,
                  color: AppColors.successLight, size: 56),
            ),
          ),
        ),
        const SizedBox(height: 32),
        Text('Password Reset!', style: AppText.display())
            .animate().fadeIn(delay: 400.ms),
        const SizedBox(height: 12),
        Text('Your password has been updated successfully.',
            style: AppText.body(), textAlign: TextAlign.center)
            .animate().fadeIn(delay: 500.ms),
        const SizedBox(height: 48),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton(
            onPressed: () =>
                Navigator.pushNamedAndRemoveUntil(context, '/', (_) => false),
            child: Text('BACK TO LOGIN', style: AppText.button()),
          ),
        ).animate().fadeIn(delay: 600.ms),
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
              color: active ? AppColors.gold : AppColors.white12,
            ),
          ),
        );
      }),
    );
  }
}
