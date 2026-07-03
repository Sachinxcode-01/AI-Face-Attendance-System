import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/features/auth/widgets/auth_shared_widgets.dart';

class RegisterScreen extends StatefulWidget {
  const RegisterScreen({super.key});

  @override
  State<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends State<RegisterScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();

  String _selectedRole = 'Student'; // Student or Teacher
  bool _agreeToTerms = false;
  bool _isLoading = false;

  int _passwordStrengthSegments = 0; // 0 to 4
  String _passwordStrengthLabel = '';

  @override
  void initState() {
    super.initState();
    _passwordController.addListener(_updatePasswordStrength);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _updatePasswordStrength() {
    final pass = _passwordController.text;
    if (pass.isEmpty) {
      setState(() {
        _passwordStrengthSegments = 0;
        _passwordStrengthLabel = '';
      });
      return;
    }

    int score = 0;
    if (pass.length >= 6) score++; // Length check
    if (pass.contains(RegExp(r'[A-Z]'))) score++; // Uppercase check
    if (pass.contains(RegExp(r'[0-9]'))) score++; // Digit check
    if (pass.contains(RegExp(r'[!@#\$%^&*(),.?":{}|<>]'))) score++; // Special char

    setState(() {
      _passwordStrengthSegments = score.clamp(1, 4);
      if (_passwordStrengthSegments == 1) {
        _passwordStrengthLabel = 'Weak';
      } else if (_passwordStrengthSegments == 2) {
        _passwordStrengthLabel = 'Fair';
      } else if (_passwordStrengthSegments == 3) {
        _passwordStrengthLabel = 'Good';
      } else {
        _passwordStrengthLabel = 'Strong';
      }
    });
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email);
  }

  Future<void> _handleSignUp() async {
    if (_nameController.text.trim().isEmpty) {
      AppToast.show(context, message: 'Please enter your full name', type: ToastType.warning);
      return;
    }
    final email = _emailController.text.trim();
    if (email.isEmpty || !_isValidEmail(email)) {
      AppToast.show(context, message: 'Please enter a valid email address', type: ToastType.warning);
      return;
    }
    if (_passwordController.text.isEmpty) {
      AppToast.show(context, message: 'Please enter a password', type: ToastType.warning);
      return;
    }
    if (!_agreeToTerms) {
      AppToast.show(context, message: 'You must agree to the processing of Personal data', type: ToastType.warning);
      return;
    }

    setState(() => _isLoading = true);
    HapticFeedback.mediumImpact();

    try {
      final registerResult = await ApiService.register(
        _nameController.text.trim(),
        email,
        _passwordController.text,
        _selectedRole,
      );

      if (!mounted) return;

      if (registerResult.containsKey('id')) {
        HapticFeedback.heavyImpact();
        AppToast.show(
          context,
          title: 'Account Created 🎉',
          message: 'Signing in...',
          type: ToastType.success,
        );

        // Auto sign-in
        final loginResult = await ApiService.loginWithPassword(email, _passwordController.text);
        if (!mounted) return;

        if (loginResult.containsKey('access_token')) {
          final session = context.read<SessionManager>();
          await session.saveSession(
            token: loginResult['access_token'],
            email: email,
            role: loginResult['role'] ?? _selectedRole.toLowerCase(),
            name: _nameController.text.trim(),
          );
          if (!mounted) return;
          context.go('/auth/setup');
        } else {
          context.go('/auth/login');
        }
      } else {
        throw Exception(registerResult['detail'] ?? registerResult['message'] ?? 'Sign up failed');
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.show(context, message: 'Error: $e', type: ToastType.error);
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScreenLayout(
      title: 'Get started',
      onBackTap: () => context.go('/auth/onboarding'),
      bottomLink: GestureDetector(
        onTap: () => context.go('/auth/login'),
        child: Text.rich(
          TextSpan(
            text: 'Already have an account? ',
            style: AuthDesign.fontPoppins(fontSize: 11, fontWeight: FontWeight.w500, color: AuthDesign.textLabel),
            children: [
              TextSpan(
                text: 'Sign in',
                style: AuthDesign.fontPoppins(fontSize: 11, fontWeight: FontWeight.w700, color: AuthDesign.primaryIndigo),
              ),
            ],
          ),
        ),
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Full Name Field
            UnderlineTextField(
              label: 'Full name',
              placeholder: 'Enter your full name',
              controller: _nameController,
              keyboardType: TextInputType.name,
            ),
            const SizedBox(height: 14),

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
              placeholder: 'Create a password',
              controller: _passwordController,
              obscureText: true,
            ),
            const SizedBox(height: 8),

            // Password Strength Indicator
            if (_passwordController.text.isNotEmpty) ...[
              Row(
                children: List.generate(4, (index) {
                  final isFilled = index < _passwordStrengthSegments;
                  return Expanded(
                    child: Container(
                      height: 4,
                      margin: const EdgeInsets.symmetric(horizontal: 2.0),
                      decoration: BoxDecoration(
                        color: isFilled ? AuthDesign.primaryIndigo : AuthDesign.underlineUnfocused,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(height: 4),
              Text(
                _passwordStrengthLabel,
                style: AuthDesign.fontPoppins(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  color: AuthDesign.textLabel,
                ),
              ),
              const SizedBox(height: 14),
            ],

            // Role Selector
            Text(
              'Select role',
              style: AuthDesign.fontPoppins(
                fontSize: 10.5,
                fontWeight: FontWeight.w500,
                color: AuthDesign.textLabel,
              ),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                // Student Card
                Expanded(
                  child: _buildRoleCard('Student', Icons.school),
                ),
                const SizedBox(width: 14),
                // Teacher Card
                Expanded(
                  child: _buildRoleCard('Teacher', Icons.co_present),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Checkbox Row
            Row(
              children: [
                SizedBox(
                  width: 24,
                  height: 24,
                  child: Checkbox(
                    value: _agreeToTerms,
                    onChanged: (val) {
                      setState(() {
                        _agreeToTerms = val ?? false;
                      });
                    },
                    activeColor: AuthDesign.primaryIndigo,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text.rich(
                    TextSpan(
                      text: 'I agree to the processing of ',
                      style: AuthDesign.fontPoppins(fontSize: 11, fontWeight: FontWeight.w500, color: AuthDesign.textLabel),
                      children: [
                        TextSpan(
                          text: 'Personal data',
                          style: AuthDesign.fontPoppins(fontSize: 11, fontWeight: FontWeight.w700, color: AuthDesign.primaryIndigo),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 22),

            // Primary Sign Up Button
            PrimaryButton(
              text: 'Sign up',
              isLoading: _isLoading,
              onPressed: _handleSignUp,
            ),
            const SizedBox(height: 22),

            // Social divider and row
            const SocialIconRow(actionPrefix: 'Sign up'),
          ],
        ),
      ),
    );
  }

  Widget _buildRoleCard(String role, IconData icon) {
    final isSelected = _selectedRole == role;
    return GestureDetector(
      onTap: () {
        setState(() {
          _selectedRole = role;
        });
      },
      child: Container(
        height: 72,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(13),
          border: Border.all(
            color: isSelected ? AuthDesign.primaryIndigo : AuthDesign.underlineUnfocused,
            width: 1.5,
          ),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              icon,
              color: isSelected ? AuthDesign.primaryIndigo : AuthDesign.textLabel,
              size: 24,
            ),
            const SizedBox(height: 4),
            Text(
              role,
              style: AuthDesign.fontPoppins(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: isSelected ? AuthDesign.primaryIndigo : AuthDesign.textLabel,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
