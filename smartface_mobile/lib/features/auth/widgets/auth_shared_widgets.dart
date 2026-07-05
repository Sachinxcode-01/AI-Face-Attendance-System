import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:provider/provider.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/app/config/env_config.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';


// ═════════════════════════════════════════════════════════════════════════════
// DESIGN SYSTEM CONSTANTS & TOKENS
// ═════════════════════════════════════════════════════════════════════════════

class AuthDesign {
  // Colors
  static const Color primaryIndigo = Color(0xFF3D4AB8);
  static const Color orbLight = Color(0xFF9AA4EC);
  static const Color orbMid = Color(0xFF6670D0);
  static const Color orbDark = Color(0xFF4D58C0);
  static const Color cardBg = Color(0xFFFFFFFF);
  static const Color pageBg = Color(0xFFE8EAF6);
  static const Color textHeading = Color(0xFF1A1A3A);
  static const Color textLabel = Color(0xFFA0A0B8);
  static const Color textPlaceholder = Color(0xFFC8C8D8);
  static const Color underlineUnfocused = Color(0xFFE6E6F0);
  static const Color underlineFocused = Color(0xFF3D4AB8);
  static const Color textLink = Color(0xFF3D4AB8);

  // Hero height — fixed portion for the indigo hero band
  static const double heroHeight = 115.0;

  // Typography Helper Functions
  static TextStyle fontPoppins({
    required double fontSize,
    required FontWeight fontWeight,
    Color? color,
    double? opacity,
  }) {
    Color finalColor = color ?? textHeading;
    if (opacity != null) {
      finalColor = finalColor.withValues(alpha: opacity);
    }
    return GoogleFonts.poppins(
      fontSize: fontSize,
      fontWeight: fontWeight,
      color: finalColor,
    );
  }

  // Get Auth ThemeData
  static ThemeData get themeData {
    return ThemeData(
      useMaterial3: true,
      scaffoldBackgroundColor: pageBg,
      primaryColor: primaryIndigo,
      textTheme: TextTheme(
        headlineLarge: fontPoppins(fontSize: 24, fontWeight: FontWeight.w700, color: Colors.white),
        titleLarge: fontPoppins(fontSize: 21, fontWeight: FontWeight.w700, color: textHeading),
        bodyLarge: fontPoppins(fontSize: 12, fontWeight: FontWeight.w400, color: textHeading),
        bodyMedium: fontPoppins(fontSize: 10.5, fontWeight: FontWeight.w500, color: textLabel),
        labelLarge: fontPoppins(fontSize: 13, fontWeight: FontWeight.w600, color: Colors.white),
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// REUSABLE HERO BACKGROUND COMPONENT
// ═════════════════════════════════════════════════════════════════════════════

class HeroOrbBackground extends StatelessWidget {
  final bool isCompact;
  final VoidCallback? onBackTap;
  final Widget? child;

  const HeroOrbBackground({
    super.key,
    required this.isCompact,
    this.onBackTap,
    this.child,
  });

  @override
  Widget build(BuildContext context) {
    final double statusBarHeight = MediaQuery.of(context).padding.top;
    final double headerHeight = isCompact
        ? AuthDesign.heroHeight + statusBarHeight
        : MediaQuery.of(context).size.height;

    return Container(
      width: double.infinity,
      height: headerHeight,
      color: AuthDesign.primaryIndigo,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Radial Gradient Orbs
          if (isCompact) ...[
            // Orb 1 (Top-Right)
            Positioned(
              right: -40,
              top: -30 + statusBarHeight,
              child: _buildOrb(160),
            ),
            // Orb 2 (Overlapping Mid)
            Positioned(
              right: -10,
              top: 30 + statusBarHeight,
              child: _buildOrb(110),
            ),
            // Orb 3 (Left Small)
            Positioned(
              left: 40,
              top: 10 + statusBarHeight,
              child: _buildOrb(60),
            ),
            // Orb 4 (Lower Scattered)
            Positioned(
              left: 180,
              top: 60 + statusBarHeight,
              child: _buildOrb(45),
            ),
          ] else ...[
            // Orb 1 (Top-Right Big)
            Positioned(
              right: -60,
              top: -40,
              child: _buildOrb(280),
            ),
            // Orb 2 (Mid Overlapping)
            Positioned(
              right: -20,
              top: 140,
              child: _buildOrb(190),
            ),
            // Orb 3 (Left Mid)
            Positioned(
              left: -30,
              top: 280,
              child: _buildOrb(140),
            ),
            // Orb 4 (Lower Right Scattered)
            Positioned(
              right: 40,
              bottom: 180,
              child: _buildOrb(90),
            ),
            // Orb 5 (Lower Left Scattered)
            Positioned(
              left: 50,
              bottom: 260,
              child: _buildOrb(55),
            ),
          ],

          // Back Button for Compact Hero
          if (isCompact && onBackTap != null)
            Positioned(
              left: 16,
              top: statusBarHeight + 12,
              child: InkWell(
                onTap: onBackTap,
                borderRadius: BorderRadius.circular(4),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 4.0),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(
                        Icons.arrow_back_ios_new,
                        color: Colors.white,
                        size: 14,
                      ),
                      const SizedBox(width: 4),
                      Text(
                        'Back',
                        style: AuthDesign.fontPoppins(
                          fontSize: 14,
                          fontWeight: FontWeight.w500,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),

          // Content child
          ?child,
        ],
      ),
    );
  }

  Widget _buildOrb(double size) {
    return Container(
      width: size,
      height: size,
      decoration: const BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          center: Alignment.center,
          radius: 0.5,
          colors: [
            AuthDesign.orbLight,
            AuthDesign.orbDark,
          ],
        ),
      ),
    );
  }
}



// ═════════════════════════════════════════════════════════════════════════════
// REUSABLE UNDERLINED INPUT FIELD
// ═════════════════════════════════════════════════════════════════════════════

class UnderlineTextField extends StatefulWidget {
  final String label;
  final String? placeholder;
  final TextEditingController? controller;
  final bool obscureText;
  final TextInputType keyboardType;
  final String? Function(String?)? validator;
  final Widget? suffixIcon;
  final ValueChanged<String>? onChanged;
  final bool readOnly;

  const UnderlineTextField({
    super.key,
    required this.label,
    this.placeholder,
    this.controller,
    this.obscureText = false,
    this.keyboardType = TextInputType.text,
    this.validator,
    this.suffixIcon,
    this.onChanged,
    this.readOnly = false,
  });

  @override
  State<UnderlineTextField> createState() => _UnderlineTextFieldState();
}

class _UnderlineTextFieldState extends State<UnderlineTextField> {
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          widget.label,
          style: AuthDesign.fontPoppins(
            fontSize: 10.5,
            fontWeight: FontWeight.w500,
            color: AuthDesign.textLabel,
          ),
        ),
        TextFormField(
          focusNode: _focusNode,
          controller: widget.controller,
          obscureText: widget.obscureText,
          keyboardType: widget.keyboardType,
          validator: widget.validator,
          onChanged: widget.onChanged,
          readOnly: widget.readOnly,
          style: AuthDesign.fontPoppins(
            fontSize: 12,
            fontWeight: FontWeight.w400,
            color: AuthDesign.textHeading,
          ),
          decoration: InputDecoration(
            hintText: widget.placeholder,
            hintStyle: AuthDesign.fontPoppins(
              fontSize: 12,
              fontWeight: FontWeight.w400,
              color: AuthDesign.textPlaceholder,
            ),
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(vertical: 8),
            border: const UnderlineInputBorder(
              borderSide: BorderSide(
                color: AuthDesign.underlineUnfocused,
                width: 1.5,
              ),
            ),
            enabledBorder: const UnderlineInputBorder(
              borderSide: BorderSide(
                color: AuthDesign.underlineUnfocused,
                width: 1.5,
              ),
            ),
            focusedBorder: const UnderlineInputBorder(
              borderSide: BorderSide(
                color: AuthDesign.underlineFocused,
                width: 1.5,
              ),
            ),
            errorStyle: const TextStyle(fontSize: 10, height: 0.8),
            suffixIcon: widget.suffixIcon,
            suffixIconConstraints: const BoxConstraints(
              minWidth: 24,
              minHeight: 24,
            ),
          ),
        ),
      ],
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// REUSABLE PRIMARY BUTTON
// ═════════════════════════════════════════════════════════════════════════════

class PrimaryButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;

  const PrimaryButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: ElevatedButton(
        onPressed: isLoading ? null : onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: AuthDesign.primaryIndigo,
          foregroundColor: Colors.white,
          elevation: 0,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(13),
          ),
          padding: EdgeInsets.zero,
        ),
        child: isLoading
            ? const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  color: Colors.white,
                  strokeWidth: 2,
                ),
              )
            : Text(
                text,
                style: AuthDesign.fontPoppins(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
      ),
    );
  }
}

class SocialAuthButton extends StatefulWidget {
  final String iconPath;
  final String label;
  final VoidCallback? onTap;
  final bool isLoading;
  final bool enabled;

  const SocialAuthButton({
    super.key,
    required this.iconPath,
    required this.label,
    this.onTap,
    this.isLoading = false,
    this.enabled = true,
  });

  @override
  State<SocialAuthButton> createState() => _SocialAuthButtonState();
}

class _SocialAuthButtonState extends State<SocialAuthButton> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 100),
    );
    _scaleAnimation = Tween<double>(begin: 1.0, end: 0.95).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bool isInteractive = widget.enabled && !widget.isLoading && widget.onTap != null;

    return GestureDetector(
      onTapDown: isInteractive ? (_) => _controller.forward() : null,
      onTapUp: isInteractive ? (_) {
        _controller.reverse();
        widget.onTap?.call();
      } : null,
      onTapCancel: isInteractive ? () => _controller.reverse() : null,
      child: ScaleTransition(
        scale: _scaleAnimation,
        child: Opacity(
          opacity: widget.enabled ? 1.0 : 0.6,
          child: Container(
            height: 50,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: const Color(0xFFE2E8F0),
                width: 1.5,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.04),
                  blurRadius: 6,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Center(
              child: widget.isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        color: AuthDesign.primaryIndigo,
                        strokeWidth: 2,
                      ),
                    )
                  : Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Image.asset(
                          widget.iconPath,
                          width: 20,
                          height: 20,
                        ),
                        const SizedBox(width: 8),
                        Text(
                          widget.label,
                          style: AuthDesign.fontPoppins(
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            color: AuthDesign.textHeading,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        ),
      ),
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// REUSABLE SOCIAL OUTLINE ICONS ROW
// ═════════════════════════════════════════════════════════════════════════════

class SocialIconRow extends StatefulWidget {
  final String actionPrefix; // "Sign in" or "Sign up"
  final String? role; // selected role from RegisterScreen

  const SocialIconRow({
    super.key,
    required this.actionPrefix,
    this.role,
  });

  @override
  State<SocialIconRow> createState() => _SocialIconRowState();
}

class _SocialIconRowState extends State<SocialIconRow> {
  bool _isGoogleLoading = false;
  bool _isGithubLoading = false;



  Future<void> _handleGoogleLogin() async {
    if (_isGoogleLoading || _isGithubLoading) return; // Prevent duplicate taps
    if (EnvConfig.googleClientId == 'YOUR_GOOGLE_CLIENT_ID' || EnvConfig.googleClientId.isEmpty) {
      AppToast.show(context, message: 'Google login is not configured yet.', type: ToastType.warning);
      return;
    }

    setState(() => _isGoogleLoading = true);
    try {
      final googleSignIn = GoogleSignIn(
        clientId: EnvConfig.googleClientId,
        scopes: ['email', 'profile'],
      );
      final account = await googleSignIn.signIn();
      if (account == null) {
        setState(() => _isGoogleLoading = false);
        return;
      }
      final auth = await account.authentication;
      final idToken = auth.idToken;

      final roleStr = widget.role ?? 'Student';
      final result = await ApiService.googleLogin(
        account.email,
        account.displayName ?? 'Google User',
        roleStr.toLowerCase(),
        avatarUrl: account.photoUrl,
        idToken: idToken,
      );

      if (!mounted) return;

      if (result.containsKey('access_token')) {
        await _completeSocialLogin(result, account.email);
      } else {
        throw Exception(result['detail'] ?? 'Google login failed');
      }
    } catch (e) {
      if (mounted) {
        final errorMsg = e.toString().replaceFirst('Exception: ', '');
        AppToast.show(context, message: errorMsg, type: ToastType.error);
      }
    } finally {
      if (mounted) {
        setState(() => _isGoogleLoading = false);
      }
    }
  }

  Future<void> _handleGithubLogin() async {
    if (_isGoogleLoading || _isGithubLoading) return; // Prevent duplicate taps
    if (EnvConfig.githubClientId == 'YOUR_GITHUB_CLIENT_ID' || EnvConfig.githubClientId.isEmpty) {
      AppToast.show(context, message: 'GitHub login is not configured yet.', type: ToastType.warning);
      return;
    }

    setState(() => _isGithubLoading = true);
    try {
      final callbackUrl = '${EnvConfig.apiUrl}/auth/github/callback';
      final authUrl = Uri.parse(
        'https://github.com/login/oauth/authorize'
        '?client_id=${EnvConfig.githubClientId}'
        '&scope=user:email'
        '&redirect_uri=${Uri.encodeComponent(callbackUrl)}'
      );

      if (await canLaunchUrl(authUrl)) {
        await launchUrl(authUrl, mode: LaunchMode.externalApplication);
      } else {
        throw Exception('Could not launch GitHub OAuth page');
      }

      if (!mounted) return;

      final code = await _showGithubCodeDialog(context);
      if (code == null || code.isEmpty) {
        setState(() => _isGithubLoading = false);
        return;
      }

      final roleStr = widget.role ?? 'Student';
      final result = await ApiService.githubLogin(code, roleStr.toLowerCase());

      if (!mounted) return;

      if (result.containsKey('access_token')) {
        await _completeSocialLogin(result, result['email'] ?? 'github-user@smartface.ai');
      } else {
        throw Exception(result['detail'] ?? 'GitHub login failed');
      }
    } catch (e) {
      if (mounted) {
        final errorMsg = e.toString().replaceFirst('Exception: ', '');
        AppToast.show(context, message: errorMsg, type: ToastType.error);
      }
    } finally {
      if (mounted) {
        setState(() => _isGithubLoading = false);
      }
    }
  }

  Future<void> _completeSocialLogin(Map<String, dynamic> result, String defaultEmail) async {
    final session = context.read<SessionManager>();
    final bool introCompleted = result['introCompleted'] ?? false;
    final bool wizardCompleted = result['wizardCompleted'] ?? result['biometric_registered'] ?? false;
    final bool bioRegistered = result['biometric_registered'] ?? false;
    final String role = result['role'] ?? 'student';
    final String name = result['full_name'] ?? result['name'] ?? 'User';
    final String email = result['email'] ?? defaultEmail;

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
    AppToast.show(context, message: 'Welcome, $name!', type: ToastType.success);

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
  }

  Future<String?> _showGithubCodeDialog(BuildContext context) async {
    final controller = TextEditingController();
    return showDialog<String>(
      context: context,
      barrierDismissible: true,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: Text(
            'Enter GitHub Code',
            style: AuthDesign.fontPoppins(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: AuthDesign.textHeading,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Paste the verification code displayed in your browser to complete authentication.',
                style: AuthDesign.fontPoppins(
                  fontSize: 11,
                  fontWeight: FontWeight.w400,
                  color: AuthDesign.textLabel,
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: controller,
                autofocus: true,
                decoration: InputDecoration(
                  hintText: 'GitHub OAuth Code',
                  hintStyle: AuthDesign.fontPoppins(
                    fontSize: 12,
                    fontWeight: FontWeight.w400,
                    color: AuthDesign.textPlaceholder,
                  ),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(10),
                    borderSide: const BorderSide(color: AuthDesign.primaryIndigo, width: 1.5),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text(
                'Cancel',
                style: AuthDesign.fontPoppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: AuthDesign.textLabel,
                ),
              ),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, controller.text.trim()),
              style: ElevatedButton.styleFrom(
                backgroundColor: AuthDesign.primaryIndigo,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                elevation: 0,
              ),
              child: Text(
                'Submit',
                style: AuthDesign.fontPoppins(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          children: [
            const Expanded(
              child: Divider(
                color: AuthDesign.underlineUnfocused,
                thickness: 1,
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12.0),
              child: Text(
                '${widget.actionPrefix} with',
                style: AuthDesign.fontPoppins(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: AuthDesign.textLabel,
                ),
              ),
            ),
            const Expanded(
              child: Divider(
                color: AuthDesign.underlineUnfocused,
                thickness: 1,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: SocialAuthButton(
                iconPath: 'assets/icons/google.png',
                label: 'Google',
                isLoading: _isGoogleLoading,
                enabled: !_isGoogleLoading && !_isGithubLoading,
                onTap: _handleGoogleLogin,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: SocialAuthButton(
                iconPath: 'assets/icons/github.png',
                label: 'GitHub',
                isLoading: _isGithubLoading,
                enabled: !_isGoogleLoading && !_isGithubLoading,
                onTap: _handleGithubLogin,
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ═════════════════════════════════════════════════════════════════════════════
// COMPACT SCREEN STRUCTURAL LAYOUT WRAPPER
//
// Layout strategy:
//   • The Scaffold body is wrapped in a full-screen Stack.
//   • Layer 0: pageBg color fills the entire screen.
//   • Layer 1: HeroOrbBackground sits at the top with a fixed height
//              (statusBarHeight + AuthDesign.heroHeight).
//   • Layer 2: The white AuthFormCard is positioned below the hero using
//              Positioned.fill with a top offset equal to the hero height
//              minus the 28-px overlap, so it always touches the bottom edge.
//   • The card's inner content is scrollable (SingleChildScrollView) so that
//              when the keyboard appears or content is tall, it remains usable.
// ═════════════════════════════════════════════════════════════════════════════

class AuthScreenLayout extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? topIcon;
  final VoidCallback? onBackTap;
  final Widget child;
  final Widget? bottomLink;

  const AuthScreenLayout({
    super.key,
    required this.title,
    this.subtitle,
    this.topIcon,
    this.onBackTap,
    required this.child,
    this.bottomLink,
  });

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    final double statusBarH = mq.padding.top;
    final double bottomInset = mq.padding.bottom;

    // The hero band: status bar + fixed hero content area
    final double heroTotalH = statusBarH + AuthDesign.heroHeight;

    // The card overlaps the hero by 28px (the rounded corner visual trick)
    const double cardOverlap = 28.0;

    // Card top position
    final double cardTop = heroTotalH - cardOverlap;

    return Theme(
      data: AuthDesign.themeData,
      child: Scaffold(
        // resizeToAvoidBottomInset keeps the layout stable; we handle scroll
        // inside the card ourselves
        resizeToAvoidBottomInset: true,
        body: Container(
          color: AuthDesign.pageBg,
          width: double.infinity,
          height: double.infinity,
          child: Stack(
            children: [
              // ── Hero band ──────────────────────────────────────────────
              Positioned(
                top: 0,
                left: 0,
                right: 0,
                child: HeroOrbBackground(
                  isCompact: true,
                  onBackTap: onBackTap,
                ),
              ),

              // ── White form card — fills from cardTop to bottom of screen ──
              Positioned(
                top: cardTop,
                left: 0,
                right: 0,
                bottom: 0,
                child: _AuthCardShell(
                  title: title,
                  subtitle: subtitle,
                  topIcon: topIcon,
                  bottomInset: bottomInset,
                  bottomLink: bottomLink,
                  child: child,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// Internal shell that draws the rounded-top white card and manages scrollable
// form content + bottom link pinned to the bottom.
class _AuthCardShell extends StatelessWidget {
  final String title;
  final String? subtitle;
  final Widget? topIcon;
  final Widget child;
  final Widget? bottomLink;
  final double bottomInset; // safe area bottom

  const _AuthCardShell({
    required this.title,
    this.subtitle,
    this.topIcon,
    required this.child,
    this.bottomLink,
    required this.bottomInset,
  });

  @override
  Widget build(BuildContext context) {
    final double hPad = MediaQuery.of(context).size.width * 0.056;
    final double keyboardHeight = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      decoration: const BoxDecoration(
        color: AuthDesign.cardBg,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(28),
          topRight: Radius.circular(28),
        ),
        boxShadow: [
          BoxShadow(
            color: Color(0x14323C96),
            blurRadius: 30,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: EdgeInsets.only(bottom: keyboardHeight),
          child: SingleChildScrollView(
            physics: const ClampingScrollPhysics(),
            child: Padding(
              padding: EdgeInsets.symmetric(horizontal: hPad),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  const SizedBox(height: 22),
                  if (topIcon != null) ...[
                    Center(child: topIcon!),
                    const SizedBox(height: 12),
                  ],
                  Text(
                    title,
                    style: AuthDesign.fontPoppins(
                      fontSize: 21,
                      fontWeight: FontWeight.w700,
                      color: AuthDesign.textHeading,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 6),
                    Text(
                      subtitle!,
                      style: AuthDesign.fontPoppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        color: AuthDesign.textLabel,
                      ),
                    ),
                  ],
                  const SizedBox(height: 22),
                  child,
                  if (bottomLink != null) ...[
                    const SizedBox(height: 24),
                    Center(child: bottomLink!),
                    const SizedBox(height: 24),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
