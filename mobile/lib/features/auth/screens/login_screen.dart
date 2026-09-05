import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/design_system/design_system.dart'
    hide PrimaryButton;

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  bool _rememberMe = true;
  bool _isLoading = false;
  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    _loadRememberedEmail();
  }

  Future<void> _loadRememberedEmail() async {
    final session = context.read<SessionManager>();
    final email = await session.getRememberedEmail();
    if (email != null && email.isNotEmpty) {
      setState(() {
        _emailController.text = email;
        _rememberMe = true;
      });
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleSignIn() async {
    if (_isLoading) return; // Guard against double-tap duplicate submissions
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty) {
      AppToast.show(
        context,
        message: 'Please enter your email',
        type: ToastType.warning,
      );
      return;
    }
    if (password.isEmpty) {
      AppToast.show(
        context,
        message: 'Please enter your password',
        type: ToastType.warning,
      );
      return;
    }

    setState(() => _isLoading = true);
    HapticFeedback.mediumImpact();

    try {
      final result = await ApiService.loginWithPassword(email, password);
      if (!mounted) return;

      if (result.containsKey('access_token')) {
        HapticFeedback.heavyImpact();
        final session = context.read<SessionManager>();

        if (_rememberMe) {
          await session.saveRememberedEmail(email);
        } else {
          await session.clearRememberedEmail();
        }

        final bool introCompleted = result['introCompleted'] ?? false;
        final bool wizardCompleted =
            result['wizardCompleted'] ??
            result['biometric_registered'] ??
            false;
        final bool bioRegistered = result['biometric_registered'] ?? false;
        final String role = result['role'] ?? 'student';
        final String name = result['full_name'] ?? result['name'] ?? 'User';

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

        // Redirect based on onboarding/intro and setup completion (matches RouteGuards handleRedirect)
        final roleLower = role.toLowerCase();
        if (!introCompleted) {
          context.go('/auth/intro');
        } else if (!wizardCompleted) {
          context.go('/setup/$roleLower');
        } else {
          if (roleLower == 'admin') {
            context.go('/admin/dashboard');
          } else if (roleLower == 'teacher' ||
              roleLower == 'faculty' ||
              roleLower == 'lecturer') {
            context.go('/teacher/dashboard');
          } else if (roleLower == 'parent') {
            context.go('/parent/dashboard');
          } else if (roleLower == 'hod' ||
              roleLower == 'principal' ||
              roleLower == 'management') {
            context.go('/management/dashboard');
          } else {
            context.go('/student/dashboard');
          }
        }
      } else {
        final msg = result['detail'] ?? result['message'] ?? 'Login failed';
        AppToast.show(context, message: msg.toString(), type: ToastType.error);
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        message: 'An unexpected error occurred. Please try again.',
        type: ToastType.error,
      );
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark
        ? AppColors.textHeadingDark
        : AppColors.textHeading;
    final mutedColor = isDark ? AppColors.textMutedDark : AppColors.textMuted;

    return PremiumBackground(
      soft: true,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: IconButton(
            icon: Icon(Icons.arrow_back_ios_new_rounded, color: textColor),
            onPressed: () => context.go('/auth/onboarding'),
          ),
        ),
        body: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SizedBox(height: 20),

                  // Title
                  Text(
                    'Welcome back',
                    style: GoogleFonts.outfit(
                      fontSize: 32,
                      fontWeight: FontWeight.w800,
                      color: textColor,
                      letterSpacing: -0.5,
                    ),
                  ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1),

                  const SizedBox(height: 8),

                  Text(
                        'Sign in to your SmartFace account',
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          color: mutedColor,
                        ),
                      )
                      .animate()
                      .fadeIn(delay: 80.ms, duration: 400.ms)
                      .slideY(begin: -0.08),

                  const SizedBox(height: 40),

                  // Email Field
                  TextFormField(
                    controller: _emailController,
                    keyboardType: TextInputType.emailAddress,
                    style: GoogleFonts.inter(fontSize: 15, color: textColor),
                    decoration: InputDecoration(
                      labelText: 'Email',
                      hintText: 'Enter your email',
                      prefixIcon: Icon(
                        Icons.email_outlined,
                        color: mutedColor,
                        size: 20,
                      ),
                    ),
                  ).animate().fadeIn(delay: 150.ms, duration: 400.ms),

                  const SizedBox(height: 16),

                  // Password Field
                  TextFormField(
                    controller: _passwordController,
                    obscureText: _obscurePassword,
                    style: GoogleFonts.inter(fontSize: 15, color: textColor),
                    decoration: InputDecoration(
                      labelText: 'Password',
                      hintText: 'Enter your password',
                      prefixIcon: Icon(
                        Icons.lock_outlined,
                        color: mutedColor,
                        size: 20,
                      ),
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility_off_rounded
                              : Icons.visibility_rounded,
                          color: mutedColor,
                          size: 20,
                        ),
                        onPressed: () => setState(
                          () => _obscurePassword = !_obscurePassword,
                        ),
                      ),
                    ),
                  ).animate().fadeIn(delay: 200.ms, duration: 400.ms),

                  const SizedBox(height: 16),

                  // Remember Me and Forgot Password
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          SizedBox(
                            width: 24,
                            height: 24,
                            child: Checkbox(
                              value: _rememberMe,
                              onChanged: (val) =>
                                  setState(() => _rememberMe = val ?? false),
                              activeColor: AppColors.primary,
                              checkColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(4),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Remember me',
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              color: mutedColor,
                            ),
                          ),
                        ],
                      ),
                      GestureDetector(
                        onTap: () => context.go('/auth/forgot-password'),
                        child: Text(
                          'Forgot password?',
                          style: GoogleFonts.inter(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                    ],
                  ).animate().fadeIn(delay: 250.ms, duration: 400.ms),

                  const SizedBox(height: 32),

                  // Sign In Button
                  SizedBox(
                    width: double.infinity,
                    height: 52,
                    child: ElevatedButton(
                      onPressed: _isLoading ? null : _handleSignIn,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.primary,
                        foregroundColor: Colors.white,
                        disabledBackgroundColor: AppColors.primary.withValues(
                          alpha: 0.5,
                        ),
                        elevation: 0,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(16),
                        ),
                      ),
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
                              'Sign in',
                              style: GoogleFonts.inter(
                                fontSize: 16,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.5,
                              ),
                            ),
                    ),
                  ).animate().fadeIn(delay: 300.ms, duration: 400.ms),

                  const SizedBox(height: 24),

                  // Social login divider
                  Row(
                    children: [
                      Expanded(
                        child: Container(
                          height: 1,
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.08)
                              : Colors.black.withValues(alpha: 0.08),
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          'or continue with',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            color: mutedColor,
                          ),
                        ),
                      ),
                      Expanded(
                        child: Container(
                          height: 1,
                          color: isDark
                              ? Colors.white.withValues(alpha: 0.08)
                              : Colors.black.withValues(alpha: 0.08),
                        ),
                      ),
                    ],
                  ).animate().fadeIn(delay: 350.ms, duration: 400.ms),

                  const SizedBox(height: 24),

                  // Social login buttons
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      _socialButton(
                        icon: Icons.g_mobiledata_rounded,
                        label: 'Google',
                        onTap: () {
                          AppToast.show(
                            context,
                            message: 'Google Sign-In coming soon',
                            type: ToastType.info,
                          );
                        },
                      ),
                      const SizedBox(width: 16),
                      _socialButton(
                        icon: Icons.apple_rounded,
                        label: 'Apple',
                        onTap: () {
                          AppToast.show(
                            context,
                            message: 'Apple Sign-In coming soon',
                            type: ToastType.info,
                          );
                        },
                      ),
                    ],
                  ).animate().fadeIn(delay: 400.ms, duration: 400.ms),

                  const SizedBox(height: 32),

                  // Sign up link
                  Center(
                    child: GestureDetector(
                      onTap: () => context.go('/auth/register'),
                      child: Text.rich(
                        TextSpan(
                          text: "Don't have an account? ",
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            color: mutedColor,
                          ),
                          children: [
                            TextSpan(
                              text: 'Sign up',
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ).animate().fadeIn(delay: 450.ms, duration: 400.ms),

                  const SizedBox(height: 12),

                  Center(
                    child: GestureDetector(
                      onTap: () => context.go('/auth/otp'),
                      child: Text(
                        'Sign in with OTP',
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          fontWeight: FontWeight.w700,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ).animate().fadeIn(delay: 500.ms, duration: 400.ms),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _socialButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          color: isDark
              ? Colors.white.withValues(alpha: 0.06)
              : Colors.black.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isDark
                ? Colors.white.withValues(alpha: 0.10)
                : Colors.black.withValues(alpha: 0.06),
            width: 1,
          ),
        ),
        child: Icon(
          icon,
          color: isDark ? Colors.white70 : Colors.black54,
          size: 28,
        ),
      ),
    );
  }
}
