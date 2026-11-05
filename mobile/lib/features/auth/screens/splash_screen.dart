import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'package:smartface_attendance/app/config/cache_service.dart';
import 'package:smartface_attendance/core/animation/app_animated_heading.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/auth/widgets/auth_shared_widgets.dart';
import 'package:smartface_attendance/features/sync/services/connectivity_service.dart';
import 'package:smartface_attendance/design_system/design_system.dart'
    hide PrimaryButton;

/// App startup splash screen widget.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with SingleTickerProviderStateMixin {
  String _bootMessage = 'BOOT: INITIALIZING SECURE AI SUITE...';
  Timer? _bootTimer;
  final bool _showWelcome = false;
  late final AnimationController _logoAnimController;

  @override
  void initState() {
    super.initState();
    _logoAnimController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    );
    _runStartupSequence();
  }

  @override
  void dispose() {
    _bootTimer?.cancel();
    _logoAnimController.dispose();
    super.dispose();
  }

  Future<void> _runStartupSequence() async {
    final session = context.read<SessionManager>();

    Future<void> updateMessage(String msg, int delayMs) async {
      if (!mounted) return;
      setState(() {
        _bootMessage = msg;
      });
      await Future.delayed(Duration(milliseconds: delayMs));
    }

    try {
      await updateMessage('BOOT: CONFIGURING DIAGNOSTICS...', 200);

      // 1. Internet Check
      await updateMessage('BOOT: TESTING SYSTEM INTERNET LINK...', 250);
      final connectivity = sl<ConnectivityService>();
      final isDeviceOnline = connectivity.isOnline;

      bool isBackendOnline = false;
      if (isDeviceOnline) {
        // 2. Backend Health Check
        await updateMessage('BOOT: PINGING SMARTFACE BACKEND...', 250);
        isBackendOnline = await ApiService.isServerOnline();
      }

      // 3. Version Check
      if (isBackendOnline) {
        await updateMessage('BOOT: COMPILING API VERSION... OK', 200);
      } else {
        await updateMessage('BOOT: OFFLINE CACHE PROTOCOL ENABLED', 300);
      }

      // 4. Session Validation
      await updateMessage('SECURITY: RETRIEVING CACHED PROFILE...', 250);
      final isLoggedIn = session.isLoggedIn;

      if (isLoggedIn) {
        if (isBackendOnline) {
          try {
            final profileResult = await ApiService.getUserProfile(
              session.token!,
            );
            if (profileResult.containsKey('detail') &&
                (profileResult['detail'].toString().toLowerCase().contains(
                      'invalid',
                    ) ||
                    profileResult['detail'].toString().toLowerCase().contains(
                      'expired',
                    ))) {
              await session.logout();
              await updateMessage('SECURITY: SESSION EXPIRED', 300);
            } else {
              if (profileResult.containsKey('email')) {
                final isBioRegistered =
                    profileResult['biometric_registered'] ??
                    session.biometricRegistered;
                await session.saveSession(
                  token: session.token!,
                  email: profileResult['email'],
                  role: profileResult['role'] ?? session.role ?? 'student',
                  name: profileResult['full_name'] ?? session.name,
                  biometricRegistered: isBioRegistered,
                );
                if (profileResult['setup_completed'] == true ||
                    isBioRegistered) {
                  await CacheService.set(
                    'sf_wizard_completed',
                    true,
                    persist: true,
                  );
                }
              }
            }
          } catch (_) {
            // Bypass to offline mode on profile load failure (like timeout)
          }
        }
      }

      // 5. Decision Engine
      await updateMessage('DECISION ENGINE: RESOLVING ROUTE...', 150);

      final onboardingCompleted =
          await CacheService.get<bool>('sf_onboarding_completed') ?? false;
      final introImagesCompleted =
          await CacheService.get<bool>('sf_intro_images_completed') ?? false;
      final introCompleted =
          await CacheService.get<bool>('sf_intro_completed') ?? false;
      final wizardCompleted =
          session.biometricRegistered ||
          (await CacheService.get<bool>('sf_wizard_completed') ?? false);

      if (!mounted) return;

      // • First Install -> Onboarding
      if (!onboardingCompleted) {
        context.go('/auth/onboarding');
        return;
      }

      // • Intro Images not completed -> Intro Images Screen
      if (!introImagesCompleted) {
        context.go('/intro-images');
        return;
      }

      // • Returning User (Not Logged In) -> Login
      if (!session.isLoggedIn) {
        context.go('/auth/login');
        return;
      }

      // • Logged In + Intro Not Completed -> Intro Cards
      if (!introCompleted) {
        context.go('/auth/intro');
        return;
      }

      final role = session.role?.toLowerCase() ?? 'student';

      // • Intro Completed + Wizard Not Completed -> Role Wizard
      if (!wizardCompleted) {
        context.go('/setup/$role');
        return;
      }

      // • Everything Completed -> Dashboard
      final String targetDashboard = role == 'admin'
          ? '/admin/dashboard'
          : (role == 'teacher' || role == 'faculty' || role == 'lecturer'
                ? '/teacher/dashboard'
                : (role == 'parent'
                      ? '/parent/dashboard'
                      : '/student/dashboard'));

      context.go(targetDashboard);
    } catch (e) {
      debugPrint('[Splash] Boot diagnostic error: $e');
      if (mounted) {
        context.go('/auth/login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = AuthDesign.primaryIndigo;
    final primaryGlow = AuthDesign.primaryIndigo.withValues(alpha: 0.28);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.bgDark : AuthDesign.pageBg,
      body: Stack(
        children: [
          // Full-screen background image
          Image.asset(
            'assets/background/splash_background.jpeg',
            fit: BoxFit.cover,
            width: double.infinity,
            height: double.infinity,
          ),
          // Adaptive contrast overlay adhering to design.md (#E8EAF6 in light mode, #0D1225 in dark mode)
          Container(
            width: double.infinity,
            height: double.infinity,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: isDark
                    ? [
                        AppColors.bgDark.withValues(alpha: 0.70),
                        AppColors.bgDeep.withValues(alpha: 0.92),
                      ]
                    : [
                        AuthDesign.pageBg.withValues(alpha: 0.75),
                        Colors.white.withValues(alpha: 0.92),
                      ],
              ),
            ),
          ),

          AnimatedSwitcher(
            duration: const Duration(milliseconds: 600),
            transitionBuilder: (child, animation) {
              return FadeTransition(
                opacity: animation,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0.0, 0.04),
                    end: Offset.zero,
                  ).animate(animation),
                  child: child,
                ),
              );
            },
            child: _showWelcome
                ? _buildWelcomeUI(primaryColor, primaryGlow)
                : _buildBootUI(primaryColor, primaryGlow),
          ),
        ],
      ),
    );
  }

  Widget _buildBootUI(Color primaryColor, Color primaryGlow) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    // Dynamic responsive font sizes matching design.md (#0F1225 dark / #1A1A3A light)
    final double titleFontSize = (MediaQuery.of(context).size.width * 0.08)
        .clamp(28.0, 36.0);
    final titleColor = isDark
        ? AppColors.textHeadingDark
        : AuthDesign.textHeading;
    final subtitleColor = isDark
        ? AppColors.textMutedDark
        : AuthDesign.textLabel;
    final shadowColor = isDark ? Colors.black54 : AuthDesign.primaryIndigo;

    return SafeArea(
      key: const ValueKey('boot_ui'),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Spacer(),

          // --- THE PERFECT CIRCLE LOGO WITH HAPTIC SUBTLE BOUNCE ---
          RepaintBoundary(
                child: Center(
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Outer Glowing Ring Wave — subtle pulse
                      Container(
                            height: 165,
                            width: 165,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.primaryBright.withValues(
                                  alpha: 0.20,
                                ),
                                width: 1.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: primaryGlow.withValues(alpha: 0.25),
                                  blurRadius: 40,
                                  spreadRadius: 6,
                                ),
                              ],
                            ),
                          )
                          .animate(onPlay: (c) => c.repeat(reverse: true))
                          .scale(
                            begin: const Offset(1, 1),
                            end: const Offset(1.12, 1.12),
                            duration: 2.seconds,
                            curve: Curves.easeInOut,
                          ),

                      // Holographic Tracker Ring (Rotating slowly)
                      Container(
                            height: 142,
                            width: 142,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.primaryBright.withValues(
                                  alpha: 0.35,
                                ),
                                width: 1.5,
                              ),
                            ),
                          )
                          .animate(onPlay: (c) => c.repeat())
                          .rotate(duration: 10.seconds),

                      // Central logo emblem — fills the circle edge-to-edge
                      Hero(
                        tag: 'logo',
                        child: Container(
                          height: 116,
                          width: 116,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFF0A1024),
                            border: Border.all(
                              color: AuthDesign.primaryIndigo,
                              width: 2.0,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: AuthDesign.primaryIndigo.withValues(
                                  alpha: 0.35,
                                ),
                                blurRadius: 22,
                                spreadRadius: 1,
                              ),
                            ],
                          ),
                          child: ClipOval(
                            child: Transform.scale(
                              scale: 1.2,
                              child: Image.asset(
                                'assets/images/logo.png',
                                fit: BoxFit.cover,
                              ),
                            ),
                          ),
                        ),
                      ),

                      // Floating teardrop accents (Liquid Orb Swirl)
                      Container(
                            width: 40,
                            height: 40,
                            margin: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.accentLight.withValues(
                                  alpha: 0.35,
                                ),
                                width: 1.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.accentLight.withValues(
                                    alpha: 0.25,
                                  ),
                                  blurRadius: 14,
                                ),
                              ],
                            ),
                          )
                          .animate(target: 0.0)
                          .rotate(duration: 5.seconds, curve: Curves.easeInOut)
                          .scale(
                            delay: 100.ms,
                            duration: 1500.ms,
                            begin: const Offset(0.6, 0.6),
                            end: const Offset(1.4, 1.4),
                          ),

                      Container(
                            width: 32,
                            height: 32,
                            margin: const EdgeInsets.symmetric(horizontal: 20),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              border: Border.all(
                                color: AppColors.goldBright.withValues(
                                  alpha: 0.4,
                                ),
                                width: 1.5,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.goldBright.withValues(
                                    alpha: 0.3,
                                  ),
                                  blurRadius: 12,
                                ),
                              ],
                            ),
                          )
                          .animate(target: 0.0)
                          .rotate(duration: 6.seconds, curve: Curves.easeInOut)
                          .scale(
                            delay: 300.ms,
                            duration: 1800.ms,
                            begin: const Offset(0.5, 0.5),
                            end: const Offset(1.25, 1.25),
                          ),
                    ],
                  ),
                ),
              )
              .animate()
              .fadeIn(duration: 800.ms)
              .scale(curve: Curves.elasticOut, duration: 1000.ms),

          const SizedBox(height: 45),

          // --- BRAND TEXT with Enter Key animation ---
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child: AppAnimatedHeading(
              text: 'Smart Attendance AI',
              style: GoogleFonts.poppins(
                fontSize: titleFontSize,
                fontWeight: FontWeight.w700,
                letterSpacing: -0.5,
                color: titleColor,
                shadows: [
                  Shadow(
                    color: shadowColor.withValues(alpha: isDark ? 0.6 : 0.2),
                    blurRadius: isDark ? 14 : 8,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 12),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 24.0),
            child:
                Text(
                      'Secure. Intelligent. Effortless Attendance.',
                      textAlign: TextAlign.center,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: subtitleColor,
                        letterSpacing: 0.2,
                      ),
                    )
                    .animate()
                    .fadeIn(
                      delay: 1000.ms,
                      duration: 600.ms,
                      curve: Curves.easeOutCubic,
                    )
                    .slideY(
                      begin: 0.1,
                      end: 0,
                      duration: 600.ms,
                      curve: Curves.easeOutCubic,
                    ),
          ),

          const Spacer(),

          // --- STYLISH NEURAL LOADING ---
          _buildNeuralLoadingIndicator().animate(
            onPlay: (controller) {
              controller.repeat(reverse: true);
            },
          ),

          const SizedBox(height: 35),
        ],
      ),
    );
  }

  Widget _buildWelcomeUI(Color primaryColor, Color primaryGlow) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return SafeArea(
      key: const ValueKey('welcome_ui'),
      child: Center(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 28.0, vertical: 20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              // Logo entry — bounce in then settle
              Hero(
                    tag: 'logo',
                    child: Container(
                      height: 92,
                      width: 92,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFF0A1024),
                        border: Border.all(
                          color: primaryColor.withValues(alpha: 0.5),
                          width: 1.5,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: primaryGlow.withValues(alpha: 0.1),
                            blurRadius: 20,
                            spreadRadius: 1,
                          ),
                        ],
                      ),
                      child: ClipOval(
                        child: Transform.scale(
                          scale: 1.2,
                          child: Image.asset(
                            'assets/images/logo.png',
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ),
                  )
                  .animate()
                  .fadeIn(delay: 200.ms)
                  .scale(curve: Curves.easeOutBack, duration: 600.ms),

              const SizedBox(height: 28),

              Text(
                    'Welcome to Smart Next-Gen\nAI Face Recognition Attendance',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.poppins(
                      fontSize: 24,
                      height: 1.3,
                      fontWeight: FontWeight.w700,
                      color: isDark
                          ? AppColors.textHeadingDark
                          : AuthDesign.textHeading,
                    ),
                  )
                  .animate()
                  .fadeIn(delay: 200.ms, duration: 500.ms)
                  .slideY(
                    begin: 0.1,
                    end: 0,
                    duration: 500.ms,
                    curve: Curves.easeOutCubic,
                  ),

              const SizedBox(height: 20),

              Text(
                'Experience the future of smart attendance management with advanced AI-powered face recognition technology designed for schools, colleges, and institutions. Enjoy fast, secure, accurate, and real-time attendance tracking with a modern, professional, and luxury user experience built for the next generation.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  height: 1.55,
                  color: isDark
                      ? AppColors.textMutedDark
                      : AuthDesign.textLabel,
                  fontWeight: FontWeight.w400,
                ),
              ).animate().fadeIn(delay: 350.ms, duration: 500.ms),

              const SizedBox(height: 28),

              // Feature pills — animate upward, staggered
              Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: isDark
                          ? AppColors.surfaceDark
                          : const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: isDark
                            ? AppColors.borderDark
                            : const Color(0xFFE2E8F0),
                        width: 1.2,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildBadgeItem('Smart')
                            .animate()
                            .fadeIn(delay: 500.ms, duration: 400.ms)
                            .slideY(begin: -0.1),
                        _buildBadgeDivider(),
                        _buildBadgeItem('Secure')
                            .animate()
                            .fadeIn(delay: 600.ms, duration: 400.ms)
                            .slideY(begin: -0.1),
                        _buildBadgeDivider(),
                        _buildBadgeItem('Intelligent')
                            .animate()
                            .fadeIn(delay: 700.ms, duration: 400.ms)
                            .slideY(begin: -0.1),
                        _buildBadgeDivider(),
                        _buildBadgeItem('Real-Time')
                            .animate()
                            .fadeIn(delay: 800.ms, duration: 400.ms)
                            .slideY(begin: -0.1),
                      ],
                    ),
                  )
                  .animate()
                  .fadeIn(delay: 500.ms, duration: 500.ms)
                  .scale(
                    delay: 600.ms,
                    begin: const Offset(0.95, 0.95),
                    end: const Offset(1, 1),
                  ),

              const SizedBox(height: 28),

              Text(
                'Effortlessly manage attendance, student records, teacher profiles, analytics, notifications, and AI-powered automation — all in one powerful platform.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  height: 1.5,
                  color: isDark
                      ? AppColors.textMutedDark
                      : AuthDesign.textLabel,
                  fontWeight: FontWeight.w500,
                ),
              ).animate().fadeIn(delay: 650.ms, duration: 500.ms),

              const SizedBox(height: 40),

              // CTA button — magnetic pulse glow
              PrimaryButton(
                    text: 'GET STARTED',
                    onPressed: () => context.go('/auth/login'),
                  )
                  .animate()
                  .fadeIn(delay: 800.ms, duration: 500.ms)
                  .slideY(
                    begin: 0.2,
                    end: 0,
                    duration: 500.ms,
                    curve: Curves.easeOutCubic,
                  )
                  .then()
                  .glow(duration: 1800.ms, color: AuthDesign.primaryIndigo),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBadgeItem(String label) {
    return Text(
      label,
      style: GoogleFonts.inter(
        color: AuthDesign.primaryIndigo,
        fontWeight: FontWeight.w600,
        fontSize: 12,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _buildBadgeDivider() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: Text(
        '•',
        style: TextStyle(
          color: isDark ? AppColors.textMutedDark : AuthDesign.textLabel,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  // Futuristic diagnostics & dots loader
  Widget _buildNeuralLoadingIndicator() {
    const primaryColor = AuthDesign.primaryIndigo;

    return RepaintBoundary(
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(3, (index) {
              return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 5),
                    height: 6,
                    width: 6,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: primaryColor,
                      boxShadow: [
                        BoxShadow(
                          color: primaryColor,
                          blurRadius: 8,
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                  )
                  .animate(
                    onPlay: (controller) {
                      controller.repeat(reverse: true);
                    },
                  )
                  .scale(
                    delay: (index * 150).ms,
                    duration: 500.ms,
                    begin: const Offset(0.4, 0.4),
                    end: const Offset(1.4, 1.4),
                  )
                  .fadeIn(delay: (index * 150).ms, duration: 500.ms)
                  .then()
                  .fadeOut(duration: 500.ms);
            }),
          ),
          const SizedBox(height: 16),
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            child: Text(
              _bootMessage,
              key: ValueKey<String>(_bootMessage),
              textAlign: TextAlign.center,
              style: GoogleFonts.robotoMono(
                color: const Color(0xFF7F8CA4),
                fontSize: 10,
                letterSpacing: 1.5,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
