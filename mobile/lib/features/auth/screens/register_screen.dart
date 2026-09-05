import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/features/auth/widgets/auth_shared_widgets.dart';
import 'package:smartface_attendance/design_system/design_system.dart'
    hide PrimaryButton;

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
    if (pass.length >= 6) {
      score++; // Length check
    }
    if (pass.contains(RegExp(r'[A-Z]'))) {
      score++; // Uppercase check
    }
    if (pass.contains(RegExp(r'[0-9]'))) {
      score++; // Digit check
    }
    if (pass.contains(RegExp(r'[!@#\$%^&*(),.?":{}|<>]'))) {
      score++; // Special char
    }

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
    if (_isLoading) return; // Guard against double-tap duplicate submissions
    final name = _nameController.text.trim();
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (name.isEmpty) {
      AppToast.show(
        context,
        message: 'Please enter your full name',
        type: ToastType.warning,
      );
      return;
    }
    if (name.length < 2) {
      AppToast.show(
        context,
        message: 'Name must be at least 2 characters long',
        type: ToastType.warning,
      );
      return;
    }
    if (email.isEmpty || !_isValidEmail(email)) {
      AppToast.show(
        context,
        message: 'Please enter a valid email address',
        type: ToastType.warning,
      );
      return;
    }
    if (password.isEmpty) {
      AppToast.show(
        context,
        message: 'Please enter a password',
        type: ToastType.warning,
      );
      return;
    }
    if (password.length < 8) {
      AppToast.show(
        context,
        message: 'Password must be at least 8 characters long',
        type: ToastType.warning,
      );
      return;
    }

    // Check password strength requirement
    final hasUpper = RegExp(r'[A-Z]').hasMatch(password);
    final hasLower = RegExp(r'[a-z]').hasMatch(password);
    final hasDigit = RegExp(r'[0-9]').hasMatch(password);
    final hasSpecial = RegExp(r'[^A-Za-z0-9]').hasMatch(password);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      AppToast.show(
        context,
        message:
            'Password must contain uppercase, lowercase, numbers, and special characters',
        type: ToastType.warning,
      );
      return;
    }

    if (!_agreeToTerms) {
      AppToast.show(
        context,
        message: 'You must agree to the processing of Personal data',
        type: ToastType.warning,
      );
      return;
    }

    setState(() => _isLoading = true);
    HapticFeedback.mediumImpact();

    try {
      final registerResult = await ApiService.register(
        name,
        email,
        password,
        _selectedRole.toLowerCase(),
      );

      if (!mounted) return;

      if (registerResult.containsKey('id') ||
          registerResult.containsKey('email')) {
        HapticFeedback.heavyImpact();
        AppToast.show(
          context,
          title: 'Account Created 🎉',
          message: 'An OTP code has been sent to your email.',
          type: ToastType.success,
        );

        // Go to OTP screen and pass the registered email for auto OTP trigger
        context.go('/auth/otp', extra: email);
      } else {
        final msg =
            registerResult['detail'] ??
            registerResult['message'] ??
            'Sign up failed';
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
    return AuthScreenLayout(
      title: 'Get started',
      onBackTap: () => context.go('/auth/onboarding'),
      bottomLink: GestureDetector(
        onTap: () => context.go('/auth/login'),
        child: Text.rich(
          TextSpan(
            text: 'Already have an account? ',
            style: AuthDesign.fontPoppins(
              fontSize: 11,
              fontWeight: FontWeight.w500,
              color: AuthDesign.textLabel,
            ),
            children: [
              TextSpan(
                text: 'Sign in',
                style: AuthDesign.fontPoppins(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: AuthDesign.primaryIndigo,
                ),
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
                        color: isFilled
                            ? AuthDesign.primaryIndigo
                            : AuthDesign.underlineUnfocused,
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
            LayoutBuilder(
              builder: (context, constraints) {
                final double cardWidth = (constraints.maxWidth - 10) / 2;
                const double cardHeight = 95.0;
                return Wrap(
                  spacing: 10,
                  runSpacing: 10,
                  children: [
                    _RoleCard(
                      role: 'Student',
                      icon: Icons.school,
                      isSelected: _selectedRole == 'Student',
                      width: cardWidth,
                      height: cardHeight,
                      onTap: _isLoading
                          ? null
                          : () => setState(() => _selectedRole = 'Student'),
                    ),
                    _RoleCard(
                      role: 'Teacher',
                      icon: Icons.co_present,
                      isSelected: _selectedRole == 'Teacher',
                      width: cardWidth,
                      height: cardHeight,
                      onTap: _isLoading
                          ? null
                          : () => setState(() => _selectedRole = 'Teacher'),
                    ),
                    _RoleCard(
                      role: 'Parent',
                      icon: Icons.family_restroom,
                      isSelected: _selectedRole == 'Parent',
                      width: cardWidth,
                      height: cardHeight,
                      onTap: _isLoading
                          ? null
                          : () => setState(() => _selectedRole = 'Parent'),
                    ),
                    _RoleCard(
                      role: 'Admin',
                      icon: Icons.admin_panel_settings,
                      isSelected: _selectedRole == 'Admin',
                      width: cardWidth,
                      height: cardHeight,
                      onTap: _isLoading
                          ? null
                          : () => setState(() => _selectedRole = 'Admin'),
                    ),
                  ],
                );
              },
            ),
            const SizedBox(height: 12),

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
                      style: AuthDesign.fontPoppins(
                        fontSize: 11,
                        fontWeight: FontWeight.w500,
                        color: AuthDesign.textLabel,
                      ),
                      children: [
                        TextSpan(
                          text: 'Personal data',
                          style: AuthDesign.fontPoppins(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: AuthDesign.primaryIndigo,
                          ),
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
            SocialIconRow(actionPrefix: 'Sign up', role: _selectedRole),
          ],
        ),
      ),
    );
  }
}

class _RoleCard extends StatefulWidget {
  final String role;
  final IconData icon;
  final bool isSelected;
  final double width;
  final double height;
  final VoidCallback? onTap;

  const _RoleCard({
    required this.role,
    required this.icon,
    required this.isSelected,
    required this.width,
    required this.height,
    this.onTap,
  });

  @override
  State<_RoleCard> createState() => _RoleCardState();
}

class _RoleCardState extends State<_RoleCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 80),
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.94,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    const selectedColor = AppColors.primaryBright;
    final unselectedColor = isDark
        ? AppColors.textMutedDark
        : const Color(0xFF94A3B8);
    final selectedBg = isDark ? AppColors.surfaceDark : const Color(0xFFEEF2FF);
    final unselectedBg = isDark ? AppColors.cardDark : Colors.white;
    final borderColor = widget.isSelected
        ? selectedColor
        : (isDark ? AppColors.borderDark : const Color(0xFFE2E8F0));

    return GestureDetector(
      onTapDown: widget.onTap == null
          ? null
          : (_) {
              _controller.forward();
              HapticFeedback.lightImpact();
            },
      onTapUp: widget.onTap == null
          ? null
          : (_) {
              _controller.reverse();
              widget.onTap!();
            },
      onTapCancel: widget.onTap == null ? null : () => _controller.reverse(),
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          width: widget.width,
          height: widget.height,
          decoration: BoxDecoration(
            color: widget.isSelected ? selectedBg : unselectedBg,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(
              color: borderColor,
              width: widget.isSelected ? 2.0 : 1.0,
            ),
            boxShadow: widget.isSelected
                ? [
                    BoxShadow(
                      color: selectedColor.withValues(alpha: 0.08),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ]
                : [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.02),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Icon(
                widget.icon,
                color: widget.isSelected ? selectedColor : unselectedColor,
                size: 28,
              ),
              const SizedBox(height: 6),
              Text(
                widget.role,
                style: AppTextStyles.body(
                  context,
                  weight: widget.isSelected ? FontWeight.w600 : FontWeight.w500,
                  color: widget.isSelected ? selectedColor : unselectedColor,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
