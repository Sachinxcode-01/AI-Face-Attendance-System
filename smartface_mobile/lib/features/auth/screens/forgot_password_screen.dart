import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/features/auth/widgets/auth_shared_widgets.dart';

class ForgotPasswordScreen extends StatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  State<ForgotPasswordScreen> createState() => _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends State<ForgotPasswordScreen> {
  final _emailController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleReset() async {
    final email = _emailController.text.trim();
    if (email.isEmpty || !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
      AppToast.show(context, message: 'Please enter a valid email address', type: ToastType.warning);
      return;
    }

    setState(() => _isLoading = true);

    try {
      final result = await ApiService.forgotPassword(email);
      if (!mounted) return;

      // Handle response. Typically, a status message or detail is returned.
      if (result.containsKey('detail') || result.containsKey('message')) {
        final msg = result['detail'] ?? result['message'] ?? 'Password reset link sent to your email!';
        AppToast.show(context, message: msg.toString(), type: ToastType.success);
        // Wait a moment, then go back to login
        await Future.delayed(const Duration(seconds: 2));
        if (mounted) {
          context.go('/auth/login');
        }
      } else {
        throw Exception(result['detail'] ?? 'Failed to send reset link');
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

  Widget _buildMailQuestionIcon() {
    return SizedBox(
      width: 48,
      height: 48,
      child: Stack(
        children: [
          const Positioned(
            left: 4,
            top: 4,
            child: Icon(
              Icons.mail_outline,
              size: 36,
              color: AuthDesign.primaryIndigo,
            ),
          ),
          Positioned(
            right: 0,
            bottom: 0,
            child: Container(
              padding: const EdgeInsets.all(1.5),
              decoration: const BoxDecoration(
                color: Colors.white,
                shape: BoxShape.circle,
              ),
              child: const Icon(
                Icons.help,
                size: 15,
                color: AuthDesign.primaryIndigo,
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AuthScreenLayout(
      title: 'Reset your password',
      subtitle: "Enter your email and we'll send a reset link.",
      topIcon: _buildMailQuestionIcon(),
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

          // Primary Send Link Button
          PrimaryButton(
            text: 'Send reset link',
            isLoading: _isLoading,
            onPressed: _handleReset,
          ),
        ],
      ),
    );
  }
}
