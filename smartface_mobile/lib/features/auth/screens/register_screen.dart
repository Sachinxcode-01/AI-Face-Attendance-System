/*
|--------------------------------------------------------------------------
| File: register_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the premium user registration form enabling creation of student or teacher accounts,
| providing real-time field validation, password strength indicators, and Google SSO registration.
|
| Responsibilities:
| - Collects student/teacher metadata (Full Name, email, passwords).
| - Validates parameters and password strength in real time.
| - Synchronizes new account creation with backend REST API and registers JWT session.
|
| Dependencies:
| - package:flutter/material.dart
| - package:flutter/services.dart
| - package:flutter_animate/flutter_animate.dart
| - package:google_fonts/google_fonts.dart
| - package:firebase_auth/firebase_auth.dart
| - package:google_sign_in/google_sign_in.dart
| - package:provider/provider.dart
| - package:smartface_attendance/core/constants.dart
| - package:smartface_attendance/core/state/session_manager.dart
| - package:smartface_attendance/data/services/api_service.dart
| - package:smartface_attendance/shared/widgets/toast_system.dart
|--------------------------------------------------------------------------
*/

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';

// ======================================================
// Core & Services Imports
// ======================================================
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/shared/widgets/glow_button.dart';
import 'package:smartface_attendance/shared/widgets/auth_blob_background.dart';

/// Screen widget for institutional user account registration.
class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen>
    with SingleTickerProviderStateMixin {
  final _formKey = GlobalKey<FormState>();
  final _auth = FirebaseAuth.instance;
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  final _confirmPassCtrl = TextEditingController();

  String _selectedRole = 'Student';
  bool _isLoading = false;
  bool _showPass = false;
  bool _showConfirmPass = false;
  double _passStrength = 0;
  String _passStrengthLabel = '';
  Color _passStrengthColor = Colors.transparent;

  // Real-time validation states
  bool _nameValid = false;
  bool _emailValid = false;
  bool _emailTouched = false;
  bool _nameTouched = false;

  late AnimationController _shimmerCtrl;

  @override
  void initState() {
    super.initState();
    _shimmerCtrl = AnimationController(vsync: this, duration: 2000.ms)
      ..repeat();
    _passCtrl.addListener(_evaluateStrength);
    _nameCtrl.addListener(() {
      if (_nameTouched) {
        setState(() => _nameValid = _nameCtrl.text.trim().length >= 2);
      }
    });
    _emailCtrl.addListener(() {
      if (_emailTouched) {
        setState(() => _emailValid = _isValidEmail(_emailCtrl.text.trim()));
      }
    });
  }

  @override
  void dispose() {
    _shimmerCtrl.dispose();
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    _confirmPassCtrl.dispose();
    super.dispose();
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email);
  }

  void _evaluateStrength() {
    final p = _passCtrl.text;
    double score = 0;
    if (p.length >= 8) score += 0.25;
    if (p.contains(RegExp(r'[A-Z]'))) score += 0.25;
    if (p.contains(RegExp(r'[0-9]'))) score += 0.25;
    if (p.contains(RegExp(r'[!@#\$%^&*(),.?":{}|<>]'))) score += 0.25;

    String label;
    Color color;
    if (score <= 0.25) {
      label = 'Weak';
      color = AppColors.error;
    } else if (score <= 0.5) {
      label = 'Fair';
      color = Colors.orange;
    } else if (score <= 0.75) {
      label = 'Good';
      color = Colors.amber;
    } else {
      label = 'Strong';
      color = AppColors.success;
    }

    setState(() {
      _passStrength = score;
      _passStrengthLabel = p.isEmpty ? '' : label;
      _passStrengthColor = color;
    });
  }

  Future<void> _handleRegister() async {
    setState(() {
      _nameTouched = true;
      _emailTouched = true;
      _nameValid = _nameCtrl.text.trim().length >= 2;
      _emailValid = _isValidEmail(_emailCtrl.text.trim());
    });

    if (!_nameValid || !_emailValid) {
      HapticFeedback.lightImpact();
      return;
    }
    if (_passCtrl.text.isEmpty) {
      AppToast.show(
        context,
        message: 'Password cannot be empty',
        type: ToastType.warning,
      );
      return;
    }
    if (_passStrength < 0.5) {
      AppToast.show(
        context,
        message: 'Password too weak — please choose a stronger one',
        type: ToastType.warning,
      );
      return;
    }
    if (_passCtrl.text != _confirmPassCtrl.text) {
      AppToast.show(
        context,
        message: 'Passwords do not match',
        type: ToastType.error,
      );
      HapticFeedback.vibrate();
      return;
    }

    setState(() => _isLoading = true);
    HapticFeedback.mediumImpact();

    try {
      final result = await ApiService.register(
        _nameCtrl.text.trim(),
        _emailCtrl.text.trim(),
        _passCtrl.text.trim(),
        _selectedRole,
      );

      if (!mounted) return;

      if (result.containsKey('id')) {
        HapticFeedback.heavyImpact();
        AppToast.show(
          context,
          title: 'Welcome aboard! 🎉',
          message: 'Account created. Signing in...',
          type: ToastType.success,
        );

        try {
          final loginResult = await ApiService.loginWithPassword(
            _emailCtrl.text.trim(),
            _passCtrl.text.trim(),
          );

          if (!mounted) return;

          if (loginResult.containsKey('access_token')) {
            final session = context.read<SessionManager>();
            await session.saveSession(
              token: loginResult['access_token'],
              email: _emailCtrl.text.trim(),
              role: loginResult['role'],
            );
            if (!mounted) return;
            final bool biometricRegistered =
                loginResult['biometric_registered'] ?? false;
            final String targetRoute = biometricRegistered
                ? '/dashboard'
                : '/auth/setup';

            Navigator.pushNamedAndRemoveUntil(
              context,
              targetRoute,
              (route) => false,
              arguments: {
                'role': loginResult['role'],
                'token': loginResult['access_token'],
                'email': _emailCtrl.text.trim(),
              },
            );
            return;
          }
        } catch (e) {
          debugPrint('Auto-login failed: $e');
        }

        await Future.delayed(800.ms);
        if (mounted) Navigator.pop(context);
      } else {
        throw Exception(result['detail'] ?? 'Registration failed');
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        message: 'Error: ${e.toString().replaceAll("Exception: ", "")}',
        type: ToastType.error,
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _signInWithGoogle() async {
    setState(() => _isLoading = true);
    try {
      final GoogleSignInAccount? googleUser = await GoogleSignIn(
        serverClientId:
            '153684832501-4mikvqi78kam3j1tcmnab7gp1o3e7mnt.apps.googleusercontent.com',
      ).signIn();
      if (googleUser == null) {
        setState(() => _isLoading = false);
        return;
      }

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;
      final AuthCredential credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );

      final UserCredential userCredential = await _auth.signInWithCredential(
        credential,
      );

      if (userCredential.user != null) {
        final email = userCredential.user!.email ?? '';
        final name = userCredential.user!.displayName ?? 'User';
        final photoUrl = userCredential.user!.photoURL;

        final result = await ApiService.googleLogin(
          email,
          name,
          _selectedRole,
          avatarUrl: photoUrl,
        );

        if (result.containsKey('access_token')) {
          if (!mounted) return;
          final session = context.read<SessionManager>();
          await session.saveSession(
            token: result['access_token'],
            email: email,
            role: result['role'],
          );
          if (!mounted) return;
          final bool biometricRegistered =
              result['biometric_registered'] ?? false;
          final String targetRoute = biometricRegistered
              ? '/dashboard'
              : '/auth/setup';
          Navigator.pushReplacementNamed(
            context,
            targetRoute,
            arguments: {
              'role': result['role'],
              'token': result['access_token'],
              'email': email,
            },
          );
        } else {
          throw Exception(result['detail'] ?? 'Google Login failed on server');
        }
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        message: 'Google Sign-In failed: $e',
        type: ToastType.error,
      );
    } finally {
      setState(() => _isLoading = false);
    }
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
                child: Form(
                  key: _formKey,
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 48),
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
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Header
                            Text(
                              'Join the Elite',
                              style: GoogleFonts.outfit(
                                fontSize: 28,
                                fontWeight: FontWeight.w900,
                                color: const Color(0xFF1B2C56),
                                letterSpacing: -0.5,
                              ),
                            ).animate().fadeIn().slideX(begin: -0.1),
                            const SizedBox(height: 4),
                            Text(
                              'Create your institutional account',
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                color: const Color(0xFF7F8CA4),
                              ),
                            ).animate().fadeIn(delay: 150.ms),

                            const SizedBox(height: 28),

                            // ── Full Name ───────────────────────────────────────
                            _buildLabel('Full Name'),
                            _buildInputField(
                              controller: _nameCtrl,
                              hint: 'e.g. Sachin Kumar',
                              icon: Icons.person_outline_rounded,
                              onFocusLost: () {
                                setState(() {
                                  _nameTouched = true;
                                  _nameValid = _nameCtrl.text.trim().length >= 2;
                                });
                              },
                              errorText: _nameTouched && !_nameValid
                                  ? 'Enter a valid full name'
                                  : null,
                              isValid: _nameTouched && _nameValid,
                            ).animate().fadeIn(delay: 200.ms),

                            const SizedBox(height: 16),

                            // ── Email ───────────────────────────────────────────
                            _buildLabel('Institutional Email'),
                            _buildInputField(
                              controller: _emailCtrl,
                              hint: 'student@college.edu',
                              icon: Icons.alternate_email_rounded,
                              keyboardType: TextInputType.emailAddress,
                              onFocusLost: () {
                                setState(() {
                                  _emailTouched = true;
                                  _emailValid = _isValidEmail(_emailCtrl.text.trim());
                                });
                              },
                              errorText: _emailTouched && !_emailValid
                                  ? 'Enter a valid email address'
                                  : null,
                              isValid: _emailTouched && _emailValid,
                            ).animate().fadeIn(delay: 250.ms),

                            const SizedBox(height: 16),

                            // ── Password ────────────────────────────────────────
                            _buildLabel('Secure Password'),
                            _buildInputField(
                              controller: _passCtrl,
                              hint: 'Min 8 chars, upper, number, symbol',
                              icon: Icons.lock_outline_rounded,
                              isPassword: true,
                              showPass: _showPass,
                              onTogglePass: () =>
                                  setState(() => _showPass = !_showPass),
                            ).animate().fadeIn(delay: 300.ms),

                            // Strength bar
                            if (_passCtrl.text.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              Row(
                                children: [
                                  Expanded(
                                    child: ClipRRect(
                                      borderRadius: BorderRadius.circular(4),
                                      child: TweenAnimationBuilder<double>(
                                        tween: Tween(begin: 0, end: _passStrength),
                                        duration: 300.ms,
                                        builder: (ctx, val, _) =>
                                            LinearProgressIndicator(
                                              value: val,
                                              minHeight: 5,
                                              backgroundColor: const Color(0xFFE2E6FF),
                                              valueColor: AlwaysStoppedAnimation<Color>(
                                                _passStrengthColor,
                                              ),
                                            ),
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    _passStrengthLabel,
                                    style: GoogleFonts.inter(
                                      color: _passStrengthColor,
                                      fontSize: 12,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 8),
                              _buildPasswordHints(),
                            ],

                            const SizedBox(height: 16),

                            // ── Confirm Password ────────────────────────────────
                            _buildLabel('Confirm Password'),
                            _buildInputField(
                              controller: _confirmPassCtrl,
                              hint: 'Repeat password',
                              icon: Icons.lock_outline_rounded,
                              isPassword: true,
                              showPass: _showConfirmPass,
                              onTogglePass: () =>
                                  setState(() => _showConfirmPass = !_showConfirmPass),
                            ).animate().fadeIn(delay: 350.ms),

                            const SizedBox(height: 20),

                            // ── Role selector ───────────────────────────────────
                            Text(
                              'I AM A',
                              style: GoogleFonts.inter(
                                color: const Color(0xFF8F9BB3),
                                fontSize: 10,
                                letterSpacing: 1.2,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 10),
                            Row(
                              children: ['Student', 'Teacher'].map((role) {
                                final isSelected = _selectedRole == role;
                                return Expanded(
                                  child: GestureDetector(
                                    onTap: () {
                                      HapticFeedback.selectionClick();
                                      setState(() => _selectedRole = role);
                                    },
                                    child: AnimatedContainer(
                                      duration: 250.ms,
                                      margin: EdgeInsets.only(
                                        right: role == 'Student' ? 10 : 0,
                                      ),
                                      padding: const EdgeInsets.symmetric(vertical: 14),
                                      decoration: BoxDecoration(
                                        color: isSelected
                                            ? const Color(0xFF3559E0).withValues(alpha: 0.1)
                                            : const Color(0xFFF6F8FF),
                                        borderRadius: BorderRadius.circular(14),
                                        border: Border.all(
                                          color: isSelected
                                              ? const Color(0xFF3559E0)
                                              : const Color(0xFFE2E6FF),
                                          width: 1.2,
                                        ),
                                        boxShadow: isSelected
                                            ? [
                                                BoxShadow(
                                                  color: const Color(0xFF3559E0).withValues(
                                                    alpha: 0.15,
                                                  ),
                                                  blurRadius: 10,
                                                  offset: const Offset(0, 4),
                                                ),
                                              ]
                                            : [],
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(
                                            role == 'Student'
                                                ? Icons.school_outlined
                                                : Icons.person_pin_outlined,
                                            color: isSelected
                                                ? const Color(0xFF3559E0)
                                                : const Color(0xFF8F9BB3),
                                            size: 18,
                                          ),
                                          const SizedBox(width: 8),
                                          Text(
                                            role,
                                            style: GoogleFonts.inter(
                                              color: isSelected
                                                  ? const Color(0xFF3559E0)
                                                  : const Color(0xFF8F9BB3),
                                              fontWeight: FontWeight.bold,
                                              fontSize: 13,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ).animate().fadeIn(delay: 400.ms),

                            const SizedBox(height: 28),

                            // ── Register button ─────────────────────────────────
                            SizedBox(
                              width: double.infinity,
                              height: 52,
                              child: GlowButton(
                                onPressed: _isLoading ? () {} : _handleRegister,
                                color: const Color(0xFF3559E0),
                                glowColor: const Color(0xFF3559E0).withValues(alpha: 0.3),
                                borderRadius: 14,
                                padding: EdgeInsets.zero,
                                child: _isLoading
                                    ? const SizedBox(
                                        width: 22,
                                        height: 22,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2.5,
                                          color: Colors.white,
                                        ),
                                      )
                                    : Text(
                                        'CREATE ACCOUNT',
                                        style: GoogleFonts.inter(
                                          fontWeight: FontWeight.bold,
                                          fontSize: 14,
                                          letterSpacing: 0.8,
                                          color: Colors.white,
                                        ),
                                      ),
                              ),
                            ).animate().scale(delay: 500.ms).fadeIn(delay: 500.ms),

                            const SizedBox(height: 24),

                            // OR divider
                            Row(
                              children: [
                                const Expanded(
                                  child: Divider(color: Color(0xFFE2E6FF), thickness: 1),
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: Text(
                                    'OR CONTINUE WITH',
                                    style: GoogleFonts.inter(
                                      color: const Color(0xFF8F9BB3),
                                      fontSize: 10,
                                      letterSpacing: 1,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                const Expanded(
                                  child: Divider(color: Color(0xFFE2E6FF), thickness: 1),
                                ),
                              ],
                            ).animate().fadeIn(delay: 550.ms),

                            const SizedBox(height: 20),

                            // Google Sign-In button
                            SizedBox(
                              width: double.infinity,
                              height: 52,
                              child: OutlinedButton(
                                onPressed: _isLoading ? null : _signInWithGoogle,
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: const Color(0xFF1B2C56),
                                  side: const BorderSide(color: Color(0xFFE2E6FF), width: 1.2),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.center,
                                  children: [
                                    Container(
                                      width: 20,
                                      height: 20,
                                      decoration: const BoxDecoration(
                                        color: Colors.white,
                                        shape: BoxShape.circle,
                                      ),
                                      alignment: Alignment.center,
                                      child: Text(
                                        'G',
                                        style: GoogleFonts.outfit(
                                          fontWeight: FontWeight.w900,
                                          fontSize: 13,
                                          color: const Color(0xFF4285F4),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Text(
                                      'Continue with Google',
                                      style: GoogleFonts.inter(
                                        fontWeight: FontWeight.bold,
                                        fontSize: 14,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ).animate().fadeIn(delay: 580.ms),

                            const SizedBox(height: 24),

                            // Login link
                            Center(
                              child: GestureDetector(
                                onTap: () => Navigator.pop(context),
                                child: RichText(
                                  text: TextSpan(
                                    style: GoogleFonts.inter(
                                      color: const Color(0xFF7F8CA4),
                                      fontSize: 13,
                                    ),
                                    children: const [
                                      TextSpan(text: 'Already have an account? '),
                                      TextSpan(
                                        text: 'Sign In',
                                        style: TextStyle(
                                          color: Color(0xFF3559E0),
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ).animate().fadeIn(delay: 600.ms),
                          ],
                        ),
                      ).animate().fadeIn(delay: 100.ms, duration: 400.ms),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(
        label.toUpperCase(),
        style: GoogleFonts.inter(
          color: const Color(0xFF8F9BB3),
          fontSize: 10,
          letterSpacing: 1.2,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildInputField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool isPassword = false,
    bool showPass = false,
    VoidCallback? onTogglePass,
    VoidCallback? onFocusLost,
    String? errorText,
    bool isValid = false,
    TextInputType? keyboardType,
  }) {
    final hasError = errorText != null && errorText.isNotEmpty;

    return Focus(
      onFocusChange: (hasFocus) {
        if (!hasFocus && onFocusLost != null) onFocusLost();
      },
      child: Builder(
        builder: (context) {
          final isFocused = Focus.of(context).hasFocus;
          final borderCol = hasError
              ? AppColors.error
              : isFocused
              ? const Color(0xFF3559E0)
              : isValid
              ? AppColors.success
              : const Color(0xFFE2E6FF);

          return AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              color: const Color(0xFFF6F8FF),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: borderCol,
                width: isFocused ? 1.5 : 1.2,
              ),
            ),
            child: TextField(
              controller: controller,
              obscureText: isPassword && !showPass,
              keyboardType: keyboardType,
              style: GoogleFonts.inter(
                color: const Color(0xFF1B2C56),
                fontSize: 14,
              ),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: GoogleFonts.inter(
                  color: const Color(0xFF8F9BB3),
                  fontSize: 14,
                ),
                prefixIcon: Icon(
                  icon,
                  color: isFocused ? const Color(0xFF3559E0) : const Color(0xFF8F9BB3),
                  size: 20,
                ),
                suffixIcon: isPassword
                    ? IconButton(
                        icon: Icon(
                          showPass
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                          color: const Color(0xFF8F9BB3),
                          size: 20,
                        ),
                        onPressed: onTogglePass,
                      )
                    : isValid
                    ? const Icon(
                        Icons.check_circle_outline_rounded,
                        color: AppColors.success,
                        size: 20,
                      )
                    : null,
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

  Widget _buildPasswordHints() {
    final p = _passCtrl.text;
    final hints = [
      (p.length >= 8, '8+ characters'),
      (p.contains(RegExp(r'[A-Z]')), 'Uppercase letter'),
      (p.contains(RegExp(r'[0-9]')), 'Number'),
      (p.contains(RegExp(r'[!@#\$%^&*(),.?":{}|<>]')), 'Special character'),
    ];
    return Wrap(
      spacing: 8,
      runSpacing: 6,
      children: hints.map((hint) {
        final (met, label) = hint;
        return AnimatedContainer(
          duration: 200.ms,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
          decoration: BoxDecoration(
            color: met
                ? const Color(0xFFE2FBE9)
                : const Color(0xFFF6F8FF),
            borderRadius: BorderRadius.circular(30),
            border: Border.all(
              color: met
                  ? AppColors.success
                  : const Color(0xFFE2E6FF),
              width: 1.0,
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                met ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                size: 12,
                color: met ? AppColors.success : const Color(0xFF8F9BB3),
              ),
              const SizedBox(width: 5),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: met ? AppColors.success : const Color(0xFF8F9BB3),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
