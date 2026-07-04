import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/features/auth/widgets/auth_shared_widgets.dart';

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

        // Redirect based on biometric registration status and role
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
        throw Exception(result['detail'] ?? 'Login failed');
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.show(context, message: '$e', type: ToastType.error);
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
                style: AuthDesign.fontPoppins(fontSize: 11, fontWeight: FontWeight.w500, color: AuthDesign.textLabel),
                children: [
                  TextSpan(
                    text: 'Sign up',
                    style: AuthDesign.fontPoppins(fontSize: 11, fontWeight: FontWeight.w700, color: AuthDesign.primaryIndigo),
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
              style: AuthDesign.fontPoppins(fontSize: 11, fontWeight: FontWeight.w700, color: AuthDesign.primaryIndigo),
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
                        activeColor: AuthDesign.primaryIndigo,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Remember me',
                      style: AuthDesign.fontPoppins(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: AuthDesign.textLabel,
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () => context.go('/auth/forgot-password'),
                  child: Text(
                    'Forgot password?',
                    style: AuthDesign.fontPoppins(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: AuthDesign.primaryIndigo,
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
