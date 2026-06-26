/*
|--------------------------------------------------------------------------
| File: login_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the premium biometric Unified Authentication Hub. Supports standard
| institutional credential logins, user registrations, single-session OTP generation,
| and Google OAuth SSO under a single slideable glassmorphic tab interface.
|--------------------------------------------------------------------------
*/

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';

// ======================================================
// Services & State Imports
// ======================================================
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/shared/widgets/glow_button.dart';
import 'package:smartface_attendance/shared/widgets/auth_blob_background.dart';

/// The entry portal widget for user login, registration, and configuration.
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  // Form controllers
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _otpController = TextEditingController();

  // Registration controllers
  final _regNameController = TextEditingController();
  final _regEmailController = TextEditingController();
  final _regPassController = TextEditingController();
  final _regConfirmPassController = TextEditingController();

  final _auth = FirebaseAuth.instance;

  // Tab index: 0 = Login, 1 = Register, 2 = OTP Login
  int _activeTabIndex = 0;

  bool _isLoading = false;
  bool _otpSent = false;
  bool _showPassword = false;
  bool _showRegPassword = false;
  bool _showRegConfirmPassword = false;

  String _selectedRole = 'Student'; // Student, Teacher
  double _regPassStrength = 0;
  String _regPassStrengthLabel = '';
  Color _regPassStrengthColor = Colors.transparent;

  @override
  void initState() {
    super.initState();
    _regPassController.addListener(_evaluateStrength);
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _otpController.dispose();
    _regNameController.dispose();
    _regEmailController.dispose();
    _regPassController.dispose();
    _regConfirmPassController.dispose();
    super.dispose();
  }

  void _evaluateStrength() {
    final p = _regPassController.text;
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
      _regPassStrength = score;
      _regPassStrengthLabel = p.isEmpty ? '' : label;
      _regPassStrengthColor = color;
    });
  }

  bool _isValidEmail(String email) {
    return RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(email);
  }

  // ─────────────────────────────────────────────
  //  AUTHENTICATION ACTIONS
  // ─────────────────────────────────────────────

  Future<void> _signInWithPassword() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text.trim();

    if (email.isEmpty || password.isEmpty) {
      AppToast.show(
        context,
        message: 'Please enter both email and password',
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
        await session.saveSession(
          token: result['access_token'],
          email: email,
          role: result['role'],
        );

        if (!mounted) return;
        final bool biometricRegistered =
            result['biometric_registered'] ?? false;

        final String targetRoute = biometricRegistered
            ? (result['role']?.toString().toLowerCase() == 'admin'
                  ? '/admin/home'
                  : (result['role']?.toString().toLowerCase() == 'teacher' ||
                            result['role']?.toString().toLowerCase() ==
                                'faculty'
                        ? '/teacher/home'
                        : '/student/home'))
            : '/auth/setup';

        context.go(targetRoute);
      } else {
        throw Exception(result['detail'] ?? 'Login failed');
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.show(context, message: 'Login Error: $e', type: ToastType.error);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleRegister() async {
    final name = _regNameController.text.trim();
    final email = _regEmailController.text.trim();
    final password = _regPassController.text.trim();
    final confirmPass = _regConfirmPassController.text.trim();

    if (name.length < 2) {
      AppToast.show(
        context,
        message: 'Please enter your full name',
        type: ToastType.warning,
      );
      return;
    }
    if (!_isValidEmail(email)) {
      AppToast.show(
        context,
        message: 'Invalid email address',
        type: ToastType.warning,
      );
      return;
    }
    if (password.isEmpty) {
      AppToast.show(
        context,
        message: 'Password cannot be empty',
        type: ToastType.warning,
      );
      return;
    }
    if (_regPassStrength < 0.5) {
      AppToast.show(
        context,
        message: 'Choose a stronger password',
        type: ToastType.warning,
      );
      return;
    }
    if (password != confirmPass) {
      AppToast.show(
        context,
        message: 'Passwords do not match',
        type: ToastType.error,
      );
      return;
    }

    setState(() => _isLoading = true);
    HapticFeedback.mediumImpact();

    try {
      final result = await ApiService.register(
        name,
        email,
        password,
        _selectedRole,
      );
      if (!mounted) return;

      if (result.containsKey('id')) {
        HapticFeedback.heavyImpact();
        AppToast.show(
          context,
          title: 'Welcome! 🎉',
          message: 'Account created. Signing in...',
          type: ToastType.success,
        );

        // Auto login after successful registration
        final loginResult = await ApiService.loginWithPassword(email, password);
        if (!mounted) return;

        if (loginResult.containsKey('access_token')) {
          final session = context.read<SessionManager>();
          await session.saveSession(
            token: loginResult['access_token'],
            email: email,
            role: loginResult['role'],
          );
          if (!mounted) return;
          context.go('/auth/setup');
        }
      } else {
        throw Exception(result['detail'] ?? 'Registration failed');
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        message: 'Registration Error: $e',
        type: ToastType.error,
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _sendOtp() async {
    final email = _emailController.text.trim();
    if (!_isValidEmail(email)) {
      AppToast.show(
        context,
        message: 'Please enter a valid institutional email',
        type: ToastType.warning,
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final result = await ApiService.requestLoginOtp(email);
      if (!mounted) return;

      if (result.containsKey('detail') &&
          result['detail'].toString().contains('sent')) {
        setState(() => _otpSent = true);
        AppToast.show(
          context,
          message: 'OTP sent to your email!',
          type: ToastType.success,
        );
      } else {
        throw Exception(result['detail'] ?? 'Failed to send OTP');
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.show(context, message: 'OTP Error: $e', type: ToastType.error);
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _verifyOtp() async {
    final email = _emailController.text.trim();
    final otp = _otpController.text.trim();

    if (otp.length != 6) {
      AppToast.show(
        context,
        message: 'Please enter the 6-digit code',
        type: ToastType.warning,
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final result = await ApiService.verifyLoginOtp(email, otp);
      if (!mounted) return;

      if (result.containsKey('access_token')) {
        HapticFeedback.heavyImpact();
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
            ? (result['role']?.toString().toLowerCase() == 'admin'
                  ? '/admin/home'
                  : (result['role']?.toString().toLowerCase() == 'teacher' ||
                            result['role']?.toString().toLowerCase() ==
                                'faculty'
                        ? '/teacher/home'
                        : '/student/home'))
            : '/auth/setup';

        context.go(targetRoute);
      } else {
        throw Exception(result['detail'] ?? 'Verification failed');
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        message: 'Invalid Verification Code: $e',
        type: ToastType.error,
      );
    } finally {
      setState(() => _isLoading = false);
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
          _activeTabIndex == 1 ? _selectedRole : 'Student',
          avatarUrl: photoUrl,
        );

        if (result.containsKey('access_token')) {
          if (!mounted) return;
          HapticFeedback.heavyImpact();
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
              ? (result['role']?.toString().toLowerCase() == 'admin'
                    ? '/admin/home'
                    : (result['role']?.toString().toLowerCase() == 'teacher' ||
                              result['role']?.toString().toLowerCase() ==
                                  'faculty'
                          ? '/teacher/home'
                          : '/student/home'))
              : '/auth/setup';

          context.go(targetRoute);
        } else {
          throw Exception(result['detail'] ?? 'Google authentication failed');
        }
      }
    } catch (e) {
      if (!mounted) return;
      AppToast.show(
        context,
        message: 'Google Auth Error: $e',
        type: ToastType.error,
      );
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showServerSettingsDialog() {
    final hostController = TextEditingController(text: ApiService.serverHost);
    final portController = TextEditingController(text: ApiService.serverPort);
    String connectionStatus = 'UNTESTED';
    bool testingStatus = false;

    showDialog(
      context: context,
      builder: (dialogCtx) {
        return StatefulBuilder(
          builder: (statefulCtx, setDialogState) {
            return BackdropFilter(
              filter: ImageFilter.blur(sigmaX: 15, sigmaY: 15),
              child: AlertDialog(
                backgroundColor: AppColors.bgDeep.withValues(alpha: 0.9),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(28),
                  side: BorderSide(
                    color: Colors.white.withValues(alpha: 0.08),
                    width: 1.2,
                  ),
                ),
                title: Row(
                  children: [
                    const Icon(
                      Icons.dns_outlined,
                      color: AppColors.gold,
                      size: 24,
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'Server Settings',
                      style: GoogleFonts.outfit(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 20,
                      ),
                    ),
                  ],
                ),
                content: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Configure backend connection parameters:',
                      style: AppText.body(color: Colors.white70),
                    ),
                    const SizedBox(height: 20),
                    _buildDialogTextField(
                      controller: hostController,
                      hint: 'API IP / Hostname',
                      icon: Icons.link,
                    ),
                    const SizedBox(height: 16),
                    _buildDialogTextField(
                      controller: portController,
                      hint: 'Port',
                      icon: Icons.settings_ethernet,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('Status: ', style: AppText.caption()),
                        Row(
                          children: [
                            if (testingStatus)
                              const SizedBox(
                                width: 12,
                                height: 12,
                                child: CircularProgressIndicator(
                                  strokeWidth: 1.5,
                                  color: AppColors.gold,
                                ),
                              )
                            else ...[
                              Icon(
                                connectionStatus == 'ONLINE'
                                    ? Icons.check_circle
                                    : (connectionStatus == 'OFFLINE'
                                          ? Icons.error_outline
                                          : Icons.help_outline),
                                size: 14,
                                color: connectionStatus == 'ONLINE'
                                    ? AppColors.success
                                    : (connectionStatus == 'OFFLINE'
                                          ? AppColors.error
                                          : Colors.white38),
                              ),
                              const SizedBox(width: 4),
                              Text(
                                connectionStatus,
                                style: GoogleFonts.robotoMono(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: connectionStatus == 'ONLINE'
                                      ? AppColors.success
                                      : (connectionStatus == 'OFFLINE'
                                            ? AppColors.error
                                            : Colors.white38),
                                ),
                              ),
                            ],
                          ],
                        ),
                      ],
                    ),
                  ],
                ),
                actions: [
                  TextButton(
                    onPressed: () async {
                      setDialogState(() => testingStatus = true);
                      final testUrl =
                          'http://${hostController.text.trim()}:${portController.text.trim()}';
                      final isOnline = await ApiService.testConnection(testUrl);
                      setDialogState(() {
                        testingStatus = false;
                        connectionStatus = isOnline ? 'ONLINE' : 'OFFLINE';
                      });
                    },
                    child: Text(
                      'TEST',
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.bold,
                        color: AppColors.gold,
                      ),
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () {
                      ApiService.saveServerSettings(
                        hostController.text.trim(),
                        portController.text.trim(),
                      );
                      Navigator.pop(dialogCtx);
                      AppToast.show(
                        context,
                        message: 'Settings saved & applied!',
                        type: ToastType.success,
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.gold,
                      foregroundColor: Colors.black,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      'SAVE & APPLY',
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildDialogTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
  }) {
    return TextField(
      controller: controller,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        prefixIcon: Icon(icon, color: Colors.white38),
        hintText: hint,
        hintStyle: const TextStyle(color: Colors.white24),
        filled: true,
        fillColor: Colors.white.withValues(alpha: 0.05),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
        ),
      ),
    );
  }

  // ─────────────────────────────────────────────
  //  WIDGET BUILD METHOD
  // ─────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      resizeToAvoidBottomInset: true,
      body: Stack(
        children: [
          // 🌌 Fluid blob gradient background (project palette)
          const AuthBlobBackground(),

          // 📱 Main Scroll Layout
          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(
                  horizontal: 24.0,
                  vertical: 16.0,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Brand Logo HUD
                    _buildAnimatedLogoHUD(),
                    const SizedBox(height: 20),

                    // App Title
                    Text(
                          'SmartFace AI',
                          style: GoogleFonts.outfit(
                            fontSize: 40,
                            fontWeight: FontWeight.w900,
                            letterSpacing: -1,
                            color: const Color(0xFF1B2C56),
                          ),
                        )
                        .animate()
                        .fadeIn(duration: 400.ms)
                        .slideY(begin: 0.1, end: 0),

                    Text(
                      'ENTERPRISE BIOMETRIC INTELLIGENCE',
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        color: const Color(0xFF7F8CA4),
                        letterSpacing: 2,
                        fontWeight: FontWeight.w700,
                      ),
                    ).animate().fadeIn(delay: 200.ms, duration: 400.ms),
                    const SizedBox(height: 30),

                    // Unified Auth Card Tabs
                    _buildTabsSelector(),
                    const SizedBox(height: 20),

                    // Unified Form Card
                    _buildGlassmorphicFormCard()
                        .animate()
                        .fadeIn(delay: 300.ms, duration: 400.ms)
                        .scaleXY(begin: 0.98, end: 1.0, curve: Curves.easeOut),
                  ],
                ),
              ),
            ),
          ),

          // Settings Cog button (Top right)
          Positioned(
            top: 16,
            right: 16,
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
                        Icons.settings_outlined,
                        color: Color(0xFF1B2C56),
                        size: 22,
                      ),
                      onPressed: _showServerSettingsDialog,
                    ),
                  ),
                ),
              ),
            ),
          ),

          // Fullscreen Biometric Loading HUD
          if (_isLoading) _buildBiometricScannerLoading(),
        ],
      ),
    );
  }

  // Rotating outer HUD logo system
  Widget _buildAnimatedLogoHUD() {
    return Center(
      child: Stack(
        alignment: Alignment.center,
        children: [
          Container(
            height: 140,
            width: 140,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: const Color(0xFF3559E0).withValues(alpha: 0.15),
                width: 1.5,
              ),
            ),
          ).animate(onPlay: (c) => c.repeat()).rotate(duration: 8.seconds),
          Container(
            height: 120,
            width: 120,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(
                color: const Color(0xFF3559E0).withValues(alpha: 0.25),
                width: 1,
                strokeAlign: BorderSide.strokeAlignOutside,
              ),
            ),
          ).animate(onPlay: (c) => c.repeat()).rotate(duration: 12.seconds),
          // Central circular brand badge
          Container(
            height: 90,
            width: 90,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: Colors.white,
              border: Border.all(color: const Color(0xFF3559E0), width: 2),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF3559E0).withValues(alpha: 0.3),
                  blurRadius: 15,
                  spreadRadius: 1,
                ),
              ],
            ),
            child: const Icon(
              Icons.blur_on_rounded,
              color: Color(0xFF5970EC),
              size: 42,
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).scale();
  }

  // Modern light-theme sliding tabs
  Widget _buildTabsSelector() {
    final tabs = ['LOGIN', 'REGISTER', 'SECURE OTP'];
    return Container(
      height: 48,
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: const Color(0xFFF1F4FF), // light grey-blue
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E6FF)),
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final tabWidth = constraints.maxWidth / tabs.length;
          return Stack(
            children: [
              AnimatedPositioned(
                duration: const Duration(milliseconds: 250),
                curve: Curves.easeInOut,
                left: _activeTabIndex * tabWidth,
                top: 0,
                bottom: 0,
                width: tabWidth,
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(20),
                    gradient: const LinearGradient(
                      colors: [Color(0xFF3559E0), Color(0xFF5970EC)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF3559E0).withValues(alpha: 0.35),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                ),
              ),
              Row(
                children: List.generate(tabs.length, (index) {
                  final label = tabs[index];
                  final isSelected = _activeTabIndex == index;
                  return Expanded(
                    child: GestureDetector(
                      behavior: HitTestBehavior.opaque,
                      onTap: () {
                        HapticFeedback.lightImpact();
                        setState(() {
                          _activeTabIndex = index;
                        });
                      },
                      child: Center(
                        child: Text(
                          label,
                          style: GoogleFonts.inter(
                            color: isSelected ? Colors.white : const Color(0xFF7F8CA4),
                            fontWeight: isSelected
                                ? FontWeight.bold
                                : FontWeight.w600,
                            fontSize: 11,
                            letterSpacing: 0.5,
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildGlassmorphicFormCard() {
    return Container(
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
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: _buildActiveFormBody(),
      ),
    );
  }

  // Switches between Login, Register, and OTP layouts
  Widget _buildActiveFormBody() {
    switch (_activeTabIndex) {
      case 0:
        return _buildLoginForm();
      case 1:
        return _buildRegisterForm();
      case 2:
        return _buildOtpForm();
      default:
        return const SizedBox();
    }
  }

  // 1. Password-based Login Form
  Widget _buildLoginForm() {
    return Column(
      key: const ValueKey('login_form'),
      children: [
        _buildTextField(
          controller: _emailController,
          hint: 'Institutional Email',
          icon: Icons.alternate_email_rounded,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          controller: _passwordController,
          hint: 'Password',
          icon: Icons.lock_outline_rounded,
          obscureText: !_showPassword,
          suffixIcon: IconButton(
            icon: Icon(
              _showPassword
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
              color: Colors.white38,
              size: 20,
            ),
            onPressed: () => setState(() => _showPassword = !_showPassword),
          ),
        ),
        const SizedBox(height: 24),
        _buildActionButton('SIGN IN PORTAL', _signInWithPassword),
        const SizedBox(height: 24),
        _buildOAuthSection(),
      ],
    );
  }

  // 2. Register Form
  Widget _buildRegisterForm() {
    return Column(
      key: const ValueKey('register_form'),
      children: [
        _buildTextField(
          controller: _regNameController,
          hint: 'Full Name',
          icon: Icons.person_outline_rounded,
        ),
        const SizedBox(height: 16),
        _buildTextField(
          controller: _regEmailController,
          hint: 'Email Address',
          icon: Icons.alternate_email_rounded,
          keyboardType: TextInputType.emailAddress,
        ),
        const SizedBox(height: 16),
        _buildRolePicker(),
        const SizedBox(height: 16),
        _buildTextField(
          controller: _regPassController,
          hint: 'Create Password',
          icon: Icons.lock_outline_rounded,
          obscureText: !_showRegPassword,
          suffixIcon: IconButton(
            icon: Icon(
              _showRegPassword
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
              color: Colors.white38,
              size: 20,
            ),
            onPressed: () =>
                setState(() => _showRegPassword = !_showRegPassword),
          ),
        ),
        // Password Strength indicator bar
        if (_regPassController.text.isNotEmpty) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: LinearProgressIndicator(
                  value: _regPassStrength,
                  color: _regPassStrengthColor,
                  backgroundColor: Colors.white12,
                  minHeight: 4,
                ),
              ),
              const SizedBox(width: 8),
              Text(
                _regPassStrengthLabel,
                style: GoogleFonts.inter(
                  fontSize: 10,
                  color: _regPassStrengthColor,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ],
        const SizedBox(height: 16),
        _buildTextField(
          controller: _regConfirmPassController,
          hint: 'Confirm Password',
          icon: Icons.lock_outline_rounded,
          obscureText: !_showRegConfirmPassword,
          suffixIcon: IconButton(
            icon: Icon(
              _showRegConfirmPassword
                  ? Icons.visibility_off_outlined
                  : Icons.visibility_outlined,
              color: Colors.white38,
              size: 20,
            ),
            onPressed: () => setState(
              () => _showRegConfirmPassword = !_showRegConfirmPassword,
            ),
          ),
        ),
        const SizedBox(height: 24),
        _buildActionButton('CREATE ACCOUNT', _handleRegister),
        const SizedBox(height: 24),
        _buildOAuthSection(),
      ],
    );
  }

  // 3. OTP Login Form
  Widget _buildOtpForm() {
    return Column(
      key: const ValueKey('otp_form'),
      children: [
        if (!_otpSent) ...[
          _buildTextField(
            controller: _emailController,
            hint: 'Institutional Email',
            icon: Icons.alternate_email_rounded,
            keyboardType: TextInputType.emailAddress,
          ),
          const SizedBox(height: 24),
          _buildActionButton('SEND SECURE OTP', _sendOtp),
        ] else ...[
          Text(
            'Verification Code Sent to',
            style: GoogleFonts.inter(color: Colors.white38, fontSize: 12),
          ),
          const SizedBox(height: 4),
          Text(
            _emailController.text,
            textAlign: TextAlign.center,
            style: GoogleFonts.inter(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 20),
          _buildTextField(
            controller: _otpController,
            hint: 'Enter 6-Digit OTP',
            icon: Icons.security_rounded,
            keyboardType: TextInputType.number,
            inputFormatters: [
              FilteringTextInputFormatter.digitsOnly,
              LengthLimitingTextInputFormatter(6),
            ],
          ),
          const SizedBox(height: 24),
          _buildActionButton('VERIFY & ENTER', _verifyOtp),
          const SizedBox(height: 12),
          TextButton(
            onPressed: () => setState(() => _otpSent = false),
            child: Text(
              'Change Email Address',
              style: GoogleFonts.inter(
                color: AppColors.accent,
                fontSize: 12,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
        const SizedBox(height: 24),
        _buildOAuthSection(),
      ],
    );
  }

  Widget _buildRolePicker() {
    return Row(
      children: [
        Text(
          'REGISTER AS: ',
          style: GoogleFonts.inter(
            fontSize: 10,
            color: const Color(0xFF8F9BB3),
            fontWeight: FontWeight.w800,
            letterSpacing: 1,
          ),
        ),
        const Spacer(),
        _buildRoleBadge('Student'),
        const SizedBox(width: 8),
        _buildRoleBadge('Teacher'),
      ],
    );
  }

  Widget _buildRoleBadge(String role) {
    final isSelected = _selectedRole == role;
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        setState(() => _selectedRole = role);
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? const Color(0xFF3559E0).withValues(alpha: 0.1)
              : const Color(0xFFF6F8FF),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected
                ? const Color(0xFF3559E0)
                : const Color(0xFFE2E6FF),
            width: 1.2,
          ),
        ),
        child: Text(
          role.toUpperCase(),
          style: GoogleFonts.inter(
            fontSize: 10,
            color: isSelected ? const Color(0xFF3559E0) : const Color(0xFF8F9BB3),
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildOAuthSection() {
    return Column(
      children: [
        Row(
          children: [
            const Expanded(
              child: Divider(
                color: Color(0xFFE2E6FF),
                height: 1,
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12),
              child: Text(
                'OR AUTHORIZE SECURELY',
                style: GoogleFonts.inter(
                  color: const Color(0xFF8F9BB3),
                  fontSize: 8,
                  letterSpacing: 1,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
            const Expanded(
              child: Divider(
                color: Color(0xFFE2E6FF),
                height: 1,
              ),
            ),
          ],
        ),
        const SizedBox(height: 20),
        // Google Sign In
        SizedBox(
          width: double.infinity,
          height: 54,
          child: OutlinedButton(
            onPressed: _signInWithGoogle,
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF1B2C56),
              side: const BorderSide(
                color: Color(0xFFE2E6FF),
                width: 1.2,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const GoogleGLogo(size: 20),
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
        ),
        const SizedBox(height: 24),
        // Device Trust Indicator
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
                  width: 6,
                  height: 6,
                  decoration: const BoxDecoration(
                    color: AppColors.success,
                    shape: BoxShape.circle,
                  ),
                )
                .animate(
                  onPlay: (controller) => controller.repeat(reverse: true),
                )
                .scale(end: const Offset(1.5, 1.5), duration: 600.ms),
            const SizedBox(width: 6),
            Text(
              '🔒 DEVICE SECURE & TRUSTED (256-bit AES)',
              style: GoogleFonts.robotoMono(
                fontSize: 8,
                color: const Color(0xFF8F9BB3),
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required IconData icon,
    bool obscureText = false,
    Widget? suffixIcon,
    TextInputType? keyboardType,
    List<TextInputFormatter>? inputFormatters,
  }) {
    return Focus(
      child: Builder(
        builder: (context) {
          final isFocused = Focus.of(context).hasFocus;
          return AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              color: const Color(0xFFF6F8FF), // light blue-gray
              borderRadius: BorderRadius.circular(14),
              border: Border.all(
                color: isFocused
                    ? const Color(0xFF3559E0)
                    : const Color(0xFFE2E6FF),
                width: 1.2,
              ),
            ),
            child: TextField(
              controller: controller,
              obscureText: obscureText,
              keyboardType: keyboardType,
              inputFormatters: inputFormatters,
              style: GoogleFonts.inter(color: const Color(0xFF1B2C56), fontSize: 14),
              decoration: InputDecoration(
                prefixIcon: Icon(
                  icon,
                  color: isFocused ? const Color(0xFF3559E0) : const Color(0xFF8F9BB3),
                  size: 20,
                ),
                hintText: hint,
                hintStyle: GoogleFonts.inter(
                  color: const Color(0xFF8F9BB3),
                  fontSize: 14,
                ),
                suffixIcon: suffixIcon,
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

  Widget _buildActionButton(String text, VoidCallback onPressed) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: GlowButton(
        onPressed: onPressed,
        borderRadius: 14,
        color: const Color(0xFF3559E0),
        glowColor: const Color(0xFF3559E0).withValues(alpha: 0.3),
        padding: EdgeInsets.zero,
        child: Text(
          text,
          style: GoogleFonts.inter(
            fontWeight: FontWeight.bold,
            fontSize: 14,
            letterSpacing: 0.8,
            color: Colors.white,
          ),
        ),
      ),
    );
  }

  Widget _buildBiometricScannerLoading() {
    return Container(
      color: Colors.black87,
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: Center(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 36, vertical: 32),
            decoration: BoxDecoration(
              color: AppColors.bgDeep.withValues(alpha: 0.85),
              borderRadius: BorderRadius.circular(24),
              border: Border.all(
                color: AppColors.accent.withValues(alpha: 0.25),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: AppColors.accent.withValues(alpha: 0.1),
                  blurRadius: 30,
                  spreadRadius: 2,
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(
                  width: 44,
                  height: 44,
                  child: CircularProgressIndicator(
                    strokeWidth: 3.5,
                    valueColor: AlwaysStoppedAnimation<Color>(AppColors.accent),
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'AUTHENTICATING',
                  style: GoogleFonts.outfit(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 2,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Establishing secure session...',
                  style: GoogleFonts.inter(
                    color: Colors.white38,
                    fontSize: 11,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  HIGH-FIDELITY DRAWN GOOGLE BRANDING WIDGETS
// ─────────────────────────────────────────────

class GoogleGLogo extends StatelessWidget {
  final double size;
  const GoogleGLogo({super.key, this.size = 22});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        color: Colors.white,
        shape: BoxShape.circle,
      ),
      padding: EdgeInsets.all(size * 0.15),
      child: CustomPaint(
        size: Size(size * 0.7, size * 0.7),
        painter: const GoogleLogoPainter(),
      ),
    );
  }
}

class GoogleLogoPainter extends CustomPainter {
  const GoogleLogoPainter();

  @override
  void paint(Canvas canvas, Size size) {
    final double w = size.width;
    final double r = w / 2;
    final center = Offset(r, r);

    // Thickness of the logo relative to size
    final double thickness = w * 0.22;
    final Rect rect = Rect.fromCircle(
      center: center,
      radius: r - thickness / 2,
    );

    // Paints for four color segments
    final paintRed = Paint()
      ..color = const Color(0xFFEA4335)
      ..style = PaintingStyle.stroke
      ..strokeWidth = thickness
      ..strokeCap = StrokeCap.butt;

    final paintYellow = Paint()
      ..color = const Color(0xFFFBBC05)
      ..style = PaintingStyle.stroke
      ..strokeWidth = thickness
      ..strokeCap = StrokeCap.butt;

    final paintGreen = Paint()
      ..color = const Color(0xFF34A853)
      ..style = PaintingStyle.stroke
      ..strokeWidth = thickness
      ..strokeCap = StrokeCap.butt;

    final paintBlue = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.stroke
      ..strokeWidth = thickness
      ..strokeCap = StrokeCap.butt;

    // Arcs matching Google's G segments
    canvas.drawArc(rect, 3.927, 1.57, false, paintRed);
    canvas.drawArc(rect, 2.356, 1.57, false, paintYellow);
    canvas.drawArc(rect, 0.785, 1.57, false, paintGreen);
    canvas.drawArc(rect, -0.785, 1.57, false, paintBlue);

    // Draw the horizontal bar matching the blue color
    final barPaint = Paint()
      ..color = const Color(0xFF4285F4)
      ..style = PaintingStyle.fill;

    final Rect barRect = Rect.fromLTRB(
      r,
      r - thickness / 2,
      w,
      r + thickness / 2,
    );
    canvas.drawRect(barRect, barPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
