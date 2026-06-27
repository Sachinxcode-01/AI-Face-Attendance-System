import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';
import '../../core/constants.dart';
import '../../core/session_manager.dart';
import '../../services/api_service.dart';
import '../../widgets/toast_system.dart';

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
          final loginResult = await ApiService.sendLoginOtp(
            _emailCtrl.text.trim(),
          );

          if (!mounted) return;

          if (loginResult.containsKey('message')) {
            Navigator.pushReplacementNamed(
              context,
              '/otp',
              arguments: {
                'email': _emailCtrl.text.trim(),
                'role': _selectedRole.toLowerCase(),
                'nextRoute': '/setup',
              },
            );
            return;
          }

          if (loginResult.containsKey('access_token')) {
            final session = context.read<SessionManager>();
            await session.saveSession(
              token: loginResult['access_token'],
              email: _emailCtrl.text.trim(),
              role: loginResult['role'],
            );
            if (!mounted) return;
            final bool setupComplete =
                loginResult['setup_completed'] == true ||
                loginResult['biometric_registered'] == true;
            final String targetRoute = setupComplete ? '/dashboard' : '/setup';

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
          final bool setupComplete =
              result['setup_completed'] == true ||
              result['biometric_registered'] == true;
          final String targetRoute = setupComplete ? '/dashboard' : '/setup';
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
      backgroundColor: const Color(0xFF0A0E21),
      body: Stack(
        children: [
          // Background gradient blobs
          Positioned(
            top: -80,
            right: -60,
            child: Container(
              width: 260,
              height: 260,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.indigo.withValues(alpha: 0.15),
              ),
            ),
          ),
          Positioned(
            bottom: 80,
            left: -80,
            child: Container(
              width: 220,
              height: 220,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: AppColors.gold.withValues(alpha: 0.08),
              ),
            ),
          ),

          SafeArea(
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 16),
              child: Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Back button
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(
                        Icons.arrow_back_ios,
                        color: Colors.white70,
                      ),
                      padding: EdgeInsets.zero,
                    ),
                    const SizedBox(height: 12),

                    // Header
                    Text(
                      'Join the Elite',
                      style: GoogleFonts.inter(
                        fontSize: 38,
                        fontWeight: FontWeight.bold,
                        color: AppColors.gold,
                      ),
                    ).animate().fadeIn().slideX(begin: -0.1),
                    Text(
                      'Create your institutional account',
                      style: GoogleFonts.inter(
                        fontSize: 15,
                        color: Colors.white38,
                      ),
                    ).animate().fadeIn(delay: 150.ms),

                    const SizedBox(height: 36),

                    // ── Full Name ───────────────────────────────────────
                    _buildLabel('Full Name'),
                    _buildInputField(
                      controller: _nameCtrl,
                      hint: 'e.g. Sachin Kumar',
                      icon: Icons.person_outline,
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
                    ).animate().fadeIn(delay: 200.ms).slideX(begin: 0.05),

                    const SizedBox(height: 16),

                    // ── Email ───────────────────────────────────────────
                    _buildLabel('Institutional Email'),
                    _buildInputField(
                      controller: _emailCtrl,
                      hint: 'student@college.edu',
                      icon: Icons.email_outlined,
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
                    ).animate().fadeIn(delay: 250.ms).slideX(begin: 0.05),

                    const SizedBox(height: 16),

                    // ── Password ────────────────────────────────────────
                    _buildLabel('Secure Password'),
                    _buildInputField(
                      controller: _passCtrl,
                      hint: 'Min 8 chars, upper, number, symbol',
                      icon: Icons.lock_outline,
                      isPassword: true,
                      showPass: _showPass,
                      onTogglePass: () =>
                          setState(() => _showPass = !_showPass),
                    ).animate().fadeIn(delay: 300.ms).slideX(begin: 0.05),

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
                                      backgroundColor: Colors.white12,
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
                              fontWeight: FontWeight.w600,
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
                      icon: Icons.lock_outline,
                      isPassword: true,
                      showPass: _showConfirmPass,
                      onTogglePass: () =>
                          setState(() => _showConfirmPass = !_showConfirmPass),
                    ).animate().fadeIn(delay: 350.ms).slideX(begin: 0.05),

                    const SizedBox(height: 28),

                    // ── Role selector ───────────────────────────────────
                    Text(
                      'I AM A',
                      style: GoogleFonts.inter(
                        color: Colors.white38,
                        fontSize: 11,
                        letterSpacing: 1.5,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      children: ['Student', 'Parent', 'Teacher', 'Admin'].map((
                        role,
                      ) {
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
                                right: role == 'Admin' ? 0 : 8,
                              ),
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.gold
                                    : Colors.white.withValues(alpha: 0.05),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isSelected
                                      ? AppColors.gold
                                      : Colors.white.withValues(alpha: 0.08),
                                ),
                                boxShadow: isSelected
                                    ? [
                                        BoxShadow(
                                          color: AppColors.gold.withValues(
                                            alpha: 0.3,
                                          ),
                                          blurRadius: 12,
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
                                        : role == 'Parent'
                                        ? Icons.family_restroom_outlined
                                        : role == 'Admin'
                                        ? Icons.shield_outlined
                                        : Icons.person_pin_outlined,
                                    color: isSelected
                                        ? Colors.black
                                        : Colors.white54,
                                    size: 18,
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    role,
                                    style: GoogleFonts.inter(
                                      color: isSelected
                                          ? Colors.black
                                          : Colors.white70,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ).animate().fadeIn(delay: 400.ms),

                    const SizedBox(height: 36),

                    // ── Register button ─────────────────────────────────
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isLoading ? null : _handleRegister,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          foregroundColor: Colors.black,
                          disabledBackgroundColor: AppColors.gold.withValues(
                            alpha: 0.4,
                          ),
                          padding: const EdgeInsets.symmetric(vertical: 18),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                          ),
                          elevation: 8,
                          shadowColor: AppColors.gold.withValues(alpha: 0.4),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 22,
                                height: 22,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2.5,
                                  color: Colors.black,
                                ),
                              )
                            : Text(
                                'CREATE ACCOUNT',
                                style: GoogleFonts.inter(
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                  letterSpacing: 1.5,
                                ),
                              ),
                      ),
                    ).animate().scale(delay: 500.ms).fadeIn(delay: 500.ms),

                    const SizedBox(height: 20),

                    // OR divider
                    Row(
                      children: [
                        const Expanded(
                          child: Divider(color: Colors.white12, thickness: 1),
                        ),
                        Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          child: Text(
                            'OR CONTINUE WITH',
                            style: GoogleFonts.inter(
                              color: Colors.white38,
                              fontSize: 11,
                              letterSpacing: 1,
                            ),
                          ),
                        ),
                        const Expanded(
                          child: Divider(color: Colors.white12, thickness: 1),
                        ),
                      ],
                    ).animate().fadeIn(delay: 550.ms),

                    const SizedBox(height: 20),

                    // Google Sign-In button with customized G icon branding
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: _isLoading ? null : _signInWithGoogle,
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.white12),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(18),
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            // Custom hand-drawn High-fidelity colored Google G icon using pure Flutter widgets!
                            Container(
                              width: 24,
                              height: 24,
                              decoration: const BoxDecoration(
                                color: Colors.white,
                                shape: BoxShape.circle,
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                'G',
                                style: GoogleFonts.outfit(
                                  fontWeight: FontWeight.w900,
                                  fontSize: 15,
                                  color: const Color(0xFF4285F4),
                                ),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Sign Up with Google',
                              style: GoogleFonts.inter(
                                color: Colors.white,
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
                              color: Colors.white38,
                              fontSize: 13,
                            ),
                            children: const [
                              TextSpan(text: 'Already have an account? '),
                              TextSpan(
                                text: 'Sign In',
                                style: TextStyle(
                                  color: AppColors.gold,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ).animate().fadeIn(delay: 600.ms),

                    const SizedBox(height: 40),
                  ],
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
          color: Colors.white38,
          fontSize: 10,
          letterSpacing: 1.5,
          fontWeight: FontWeight.w600,
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
              ? AppColors.gold
              : isValid
              ? AppColors.success
              : Colors.white.withValues(alpha: 0.08);

          return AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: borderCol,
                width: isFocused ? 1.5 : 1.0,
              ),
              boxShadow: isFocused
                  ? [
                      BoxShadow(
                        color: AppColors.gold.withValues(alpha: 0.06),
                        blurRadius: 10,
                        spreadRadius: 1,
                      ),
                    ]
                  : [],
            ),
            child: TextField(
              controller: controller,
              obscureText: isPassword && !showPass,
              keyboardType: keyboardType,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 15,
                fontWeight: FontWeight.w500,
              ),
              decoration: InputDecoration(
                hintText: hint,
                hintStyle: TextStyle(
                  color: Colors.white.withValues(alpha: 0.2),
                  fontSize: 13,
                ),
                prefixIcon: Icon(
                  icon,
                  color: isFocused ? AppColors.gold : Colors.white38,
                  size: 20,
                ),
                suffixIcon: isPassword
                    ? IconButton(
                        icon: Icon(
                          showPass
                              ? Icons.visibility_off_outlined
                              : Icons.visibility_outlined,
                          color: Colors.white38,
                          size: 20,
                        ),
                        onPressed: onTogglePass,
                      )
                    : isValid
                    ? const Icon(
                        Icons.check_circle_outline,
                        color: AppColors.successLight,
                        size: 20,
                      )
                    : null,
                filled: true,
                fillColor: Colors.black.withValues(alpha: 0.15),
                border: InputBorder.none,
                enabledBorder: InputBorder.none,
                focusedBorder: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 18,
                ),
                errorText: errorText,
                errorStyle: GoogleFonts.inter(
                  color: AppColors.errorLight,
                  fontSize: 11,
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
                ? AppColors.success.withValues(alpha: 0.12)
                : Colors.white.withValues(alpha: 0.04),
            borderRadius: BorderRadius.circular(30),
            border: Border.all(
              color: met
                  ? AppColors.successLight.withValues(alpha: 0.5)
                  : Colors.white.withValues(alpha: 0.06),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                met ? Icons.check_circle : Icons.radio_button_unchecked,
                size: 12,
                color: met ? AppColors.successLight : Colors.white24,
              ),
              const SizedBox(width: 5),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: met ? AppColors.successLight : Colors.white38,
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
