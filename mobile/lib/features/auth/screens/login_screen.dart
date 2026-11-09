import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/features/auth/widgets/auth_shared_widgets.dart';
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
      if (mounted) {
        setState(() {
          _emailController.text = email;
          _rememberMe = true;
        });
      }
    }
  }

  void _showServerConfigSheet() {
    final hostController = TextEditingController(text: ApiService.serverHost);
    final portController = TextEditingController(text: ApiService.serverPort);
    bool isTesting = false;
    String? statusMsg;
    bool? isSuccess;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setSheetState) {
          final isDark = Theme.of(ctx).brightness == Brightness.dark;
          return Container(
            padding: EdgeInsets.only(
              left: 20,
              right: 20,
              top: 20,
              bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
            ),
            decoration: BoxDecoration(
              color: isDark ? const Color(0xFF1E2230) : Colors.white,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(
                  child: Container(
                    width: 40,
                    height: 4,
                    decoration: BoxDecoration(
                      color: Colors.grey.withValues(alpha: 0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    const Icon(Icons.dns_rounded, color: AuthDesign.primaryIndigo, size: 22),
                    const SizedBox(width: 8),
                    Text(
                      'Server Connection Settings',
                      style: AuthDesign.fontPoppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w700,
                        color: isDark ? Colors.white : Colors.black87,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'Active: ${ApiService.baseUrl}',
                  style: TextStyle(
                    fontSize: 12,
                    color: isDark ? Colors.white60 : Colors.black54,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      flex: 3,
                      child: TextField(
                        controller: hostController,
                        decoration: InputDecoration(
                          labelText: 'Host IP or Domain',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      flex: 1,
                      child: TextField(
                        controller: portController,
                        keyboardType: TextInputType.number,
                        decoration: InputDecoration(
                          labelText: 'Port',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                          contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  children: [
                    ActionChip(
                      label: const Text('10.177.216.48 (Wi-Fi)'),
                      onPressed: () {
                        setSheetState(() {
                          hostController.text = '10.177.216.48';
                          portController.text = '8000';
                        });
                      },
                    ),
                    ActionChip(
                      label: const Text('127.0.0.1 (ADB USB)'),
                      onPressed: () {
                        setSheetState(() {
                          hostController.text = '127.0.0.1';
                          portController.text = '8000';
                        });
                      },
                    ),
                  ],
                ),
                if (statusMsg != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: (isSuccess == true ? Colors.green : Colors.red).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: (isSuccess == true ? Colors.green : Colors.red).withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          isSuccess == true ? Icons.check_circle : Icons.error_outline,
                          color: isSuccess == true ? Colors.green : Colors.red,
                          size: 18,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            statusMsg!,
                            style: TextStyle(
                              fontSize: 12,
                              color: isSuccess == true ? Colors.green : Colors.red,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: isTesting
                            ? null
                            : () async {
                                setSheetState(() {
                                  isTesting = true;
                                  statusMsg = 'Pinging server...';
                                  isSuccess = null;
                                });
                                final h = hostController.text.trim();
                                final p = portController.text.trim();
                                final url = p.isEmpty ? 'http://$h' : 'http://$h:$p';
                                final ok = await ApiService.testConnection(url);
                                setSheetState(() {
                                  isTesting = false;
                                  isSuccess = ok;
                                  statusMsg = ok
                                      ? 'Server Reachable & Database Connected! ✅'
                                      : 'Connection failed. Check IP & port. ❌';
                                });
                              },
                        child: Text(isTesting ? 'Testing...' : 'Test Connection'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AuthDesign.primaryIndigo,
                          foregroundColor: Colors.white,
                        ),
                        onPressed: () async {
                          final h = hostController.text.trim();
                          final p = portController.text.trim();
                          await ApiService.saveServerSettings(h, p);
                          if (ctx.mounted) {
                            Navigator.pop(ctx);
                          }
                          if (mounted) {
                            setState(() {});
                            AppToast.show(
                              context,
                              message: 'Server updated to ${ApiService.baseUrl}',
                              type: ToastType.success,
                            );
                          }
                        },
                        child: const Text('Save & Apply'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
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
    if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email)) {
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

      final token = result['access_token'] ?? result['token'];
      if (token != null && token.toString().isNotEmpty) {
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
          token: token.toString(),
          refreshToken: result['refresh_token'] as String?,
          email: email,
          role: role,
          name: name,
          biometricRegistered: bioRegistered,
          introCompleted: introCompleted,
          wizardCompleted: wizardCompleted,
        );

        if (!mounted) return;

        AppToast.show(
          context,
          message: 'Welcome back, $name!',
          type: ToastType.success,
        );

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
        final msg =
            result['detail'] ??
            result['message'] ??
            result['error'] ??
            'Login failed. Please check your credentials.';
        AppToast.show(context, message: msg.toString(), type: ToastType.error);
      }
    } catch (e) {
      if (!mounted) return;
      debugPrint('[LoginScreen] Exception in _handleSignIn: $e');
      final errStr = e.toString().replaceAll('Exception: ', '');
      AppToast.show(
        context,
        message: errStr.contains('SocketException') || errStr.contains('Failed host lookup')
            ? 'Unable to connect to server. Please check your connection.'
            : 'Login error: $errStr',
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

    return AuthScreenLayout(
      title: 'Welcome back',
      titleLeading: const AnimatedWavingHand(),
      subtitle: 'Sign in to your SmartFace account',
      onBackTap: () {
        if (context.canPop()) {
          context.pop();
        } else {
          context.go('/auth/onboarding');
        }
      },
      bottomLink: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          GestureDetector(
            onTap: () => context.go('/auth/register'),
            child: Text.rich(
              TextSpan(
                text: "Don't have an account? ",
                style: AuthDesign.fontPoppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color:
                      isDark ? AppColors.textMutedDark : AuthDesign.textLabel,
                ),
                children: [
                  TextSpan(
                    text: 'Sign up',
                    style: AuthDesign.fontPoppins(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: AuthDesign.primaryIndigo,
                    ),
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
              style: AuthDesign.fontPoppins(
                fontSize: 12,
                fontWeight: FontWeight.w700,
                color: AuthDesign.primaryIndigo,
              ),
            ),
          ),
        ],
      ),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Server Endpoint Indicator
            Align(
              alignment: Alignment.centerRight,
              child: InkWell(
                onTap: _showServerConfigSheet,
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 2),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.settings_ethernet, size: 13, color: AuthDesign.primaryIndigo),
                      const SizedBox(width: 4),
                      Text(
                        ApiService.serverHost,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: AuthDesign.primaryIndigo,
                        ),
                      ),
                      const SizedBox(width: 2),
                      const Icon(Icons.arrow_drop_down, size: 14, color: AuthDesign.primaryIndigo),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 8),

            // Email Field
            UnderlineTextField(
              label: 'Email',
              placeholder: 'Enter your email',
              controller: _emailController,
              keyboardType: TextInputType.emailAddress,
              prefixIcon: Icon(
                Icons.email_outlined,
                size: 20,
                color: isDark ? AppColors.textMutedDark : AuthDesign.textLabel,
              ),
            ),
            const SizedBox(height: 16),

            // Password Field
            UnderlineTextField(
              label: 'Password',
              placeholder: 'Enter your password',
              controller: _passwordController,
              obscureText: _obscurePassword,
              prefixIcon: Icon(
                Icons.lock_outline,
                size: 20,
                color: isDark ? AppColors.textMutedDark : AuthDesign.textLabel,
              ),
              suffixIcon: IconButton(
                icon: Icon(
                  _obscurePassword
                      ? Icons.visibility_off_outlined
                      : Icons.visibility_outlined,
                  size: 20,
                  color:
                      isDark ? AppColors.textMutedDark : AuthDesign.textLabel,
                ),
                onPressed: () =>
                    setState(() => _obscurePassword = !_obscurePassword),
              ),
            ),
            const SizedBox(height: 14),

            // Remember me and Forgot password
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    SizedBox(
                      width: 22,
                      height: 22,
                      child: Checkbox(
                        value: _rememberMe,
                        onChanged: (val) =>
                            setState(() => _rememberMe = val ?? false),
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
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: isDark
                            ? AppColors.textMutedDark
                            : AuthDesign.textLabel,
                      ),
                    ),
                  ],
                ),
                GestureDetector(
                  onTap: () => context.go('/auth/forgot-password'),
                  child: Text(
                    'Forgot password?',
                    style: AuthDesign.fontPoppins(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: AuthDesign.primaryIndigo,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Primary Sign In Button
            PrimaryButton(
              text: 'Sign in',
              isLoading: _isLoading,
              onPressed: _handleSignIn,
            ),
            const SizedBox(height: 24),

            // Social divider and row (real Google and GitHub)
            const SocialIconRow(actionPrefix: 'Sign in'),
          ],
        ),
      ),
    );
  }
}
