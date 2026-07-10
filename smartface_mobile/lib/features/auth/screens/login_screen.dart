import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/features/auth/widgets/auth_shared_widgets.dart';
import 'package:smartface_attendance/design_system/design_system.dart' hide PrimaryButton;

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
      AppToast.show(context, message: 'Please enter your email', type: ToastType.warning);
      return;
    }
    if (password.isEmpty) {
      AppToast.show(context, message: 'Please enter your password', type: ToastType.warning);
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
        final bool wizardCompleted = result['wizardCompleted'] ?? result['biometric_registered'] ?? false;
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
        final msg = result['detail'] ?? result['message'] ?? 'Login failed';
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

  @override
  Widget build(BuildContext context) {
    return AuthScreenLayout(
      title: 'Welcome back',
      onBackTap: () => context.go('/auth/onboarding'),
      bottomLink: Column(
        children: [
          GestureDetector(
            onTap: () => context.go('/auth/register'),
            child: Text.rich(
              TextSpan(
                text: "Don't have an account? ",
                style: AppTextStyles.body(context, weight: FontWeight.w500, color: Theme.of(context).brightness == Brightness.dark ? AppColors.textMutedDark : AppColors.textMuted),
                children: [
                  TextSpan(
                    text: 'Sign up',
                    style: AppTextStyles.body(context, weight: FontWeight.w700, color: AppColors.primaryBright),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 12),
          GestureDetector(
            onTap: () => context.go('/auth/otp'),
            child: Text(
              'Sign in with OTP',
              style: AppTextStyles.body(context, weight: FontWeight.w700, color: AppColors.primaryBright),
            ),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
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
            const SizedBox(height: 14),

            // Password Field
            UnderlineTextField(
              label: 'Password',
              placeholder: 'Enter your password',
              controller: _passwordController,
              obscureText: true,
            ),
            const SizedBox(height: 14),

            // Remember Me and Forgot Password Row
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
                        onChanged: (val) {
                          setState(() {
                            _rememberMe = val ?? false;
                          });
                        },
                        activeColor: AppColors.primaryBright,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Remember me',
                      style: AppTextStyles.caption(
                        context,
                        weight: FontWeight.w500,
                        color: Theme.of(context).brightness == Brightness.dark ? AppColors.textMutedDark : AppColors.textMuted,
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () => context.go('/auth/forgot-password'),
                  child: Text(
                    'Forgot password?',
                    style: AppTextStyles.caption(
                      context,
                      weight: FontWeight.w600,
                      color: AppColors.primaryBright,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 22),

            // Primary Sign In Button
            PrimaryButton(
              text: 'Sign in',
              isLoading: _isLoading,
              onPressed: _handleSignIn,
            ),
            const SizedBox(height: 22),

            // Social divider and row
            const SocialIconRow(actionPrefix: 'Sign in'),
          ],
        ),
      ),
    );
  }
}
