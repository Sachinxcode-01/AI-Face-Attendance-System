/*
|--------------------------------------------------------------------------
| File: splash_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the initial loading screen of the application. Displays a luxury
| animated logo HUD and manages routing decisions based on stored user sessions.
|
| Responsibilities:
| - Simulates boot check diagnostics in neural animation sequence.
| - Retrieves persistence state from session manager.
| - Routes to setup wizard (if first-time biometric signup) or dashboard.
|
| Dependencies:
| - package:flutter/material.dart
| - package:flutter_animate/flutter_animate.dart
| - package:google_fonts/google_fonts.dart
| - package:provider/provider.dart
| - package:smartface_attendance/core/constants.dart
| - package:smartface_attendance/core/state/session_manager.dart
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

// ======================================================
// Core & State Imports
// ======================================================
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/app/theme/dark_theme.dart';
import 'package:smartface_attendance/shared/widgets/animated_mesh_background.dart';
import 'package:smartface_attendance/shared/widgets/glow_button.dart';

/// App startup splash screen widget.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  String _bootMessage = 'BOOT SEQUENCE STARTED...';
  int _bootIndex = 0;
  late Timer _bootTimer;
  final bool _showWelcome = false;
  final List<String> _bootChecks = [
    'INITIALIZING SECURE AI SUITE...',
    'PARSING BIOMETRIC MATRIX...',
    'ESTABLISHING ENCRYPTED API HANDSHAKE...',
    'DECRYPTING HARDWARE SIGNATURE...',
    'READY FOR SECURE ATTENDANCE FLOW ✓',
  ];

  @override
  void initState() {
    super.initState();
    _bootTimer = Timer.periodic(const Duration(milliseconds: 150), (timer) {
      if (mounted && _bootIndex < _bootChecks.length) {
        setState(() {
          _bootMessage = _bootChecks[_bootIndex];
          _bootIndex++;
        });
      } else {
        timer.cancel();
      }
    });

    Future.delayed(const Duration(milliseconds: 1200), () async {
      if (mounted) {
        final session = context.read<SessionManager>();
        if (session.isLoggedIn) {
          final String targetRoute = session.biometricRegistered
              ? (session.role?.toLowerCase() == 'admin'
                  ? '/admin/home'
                  : (session.role?.toLowerCase() == 'teacher' || session.role?.toLowerCase() == 'faculty' || session.role?.toLowerCase() == 'lecturer'
                      ? '/teacher/home'
                      : '/student/home'))
              : '/auth/setup';
          context.go(targetRoute);
        } else {
          context.go('/auth/login');
        }
      }
    });
  }

  @override
  void dispose() {
    _bootTimer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final darkColors = theme.extension<DarkAppColors>();
    final primaryColor = darkColors?.primary ?? const Color(0xFF2563EB);
    final primaryGlow = darkColors?.primaryGlow ?? const Color(0x332563EB);

    return Scaffold(
      body: Stack(
        children: [
          // 🌌 Unified Breathing Ambient Glow Mesh Background
          const AnimatedMeshBackground(),

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
            child: _showWelcome ? _buildWelcomeUI(primaryColor, primaryGlow) : _buildBootUI(primaryColor, primaryGlow),
          ),
        ],
      ),
    );
  }

  Widget _buildBootUI(Color primaryColor, Color primaryGlow) {
    return SafeArea(
      key: const ValueKey('boot_ui'),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Spacer(),

          // --- THE PERFECT CIRCLE LOGO ---
          Center(
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    // Outer Glowing Ring Wave
                    Container(
                          height: 165,
                          width: 165,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: primaryColor.withValues(alpha: 0.15),
                              width: 1.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: primaryGlow.withValues(alpha: 0.35),
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

                    // Holographic Tracker Ring (Rotating)
                    Container(
                          height: 142,
                          width: 142,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: primaryColor.withValues(alpha: 0.35),
                              width: 1.5,
                            ),
                          ),
                        )
                        .animate(onPlay: (c) => c.repeat())
                        .rotate(duration: 10.seconds),

                    // Central glass logo case
                    Hero(
                      tag: 'logo',
                      child: Container(
                        height: 115,
                        width: 115,
                        padding: const EdgeInsets.all(22),
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.bgDeep,
                          border: Border.all(
                            color: primaryColor.withValues(alpha: 0.6),
                            width: 2.0,
                          ),
                          boxShadow: const [
                            BoxShadow(
                              color: Colors.black45,
                              blurRadius: 10,
                              offset: Offset(0, 5),
                            ),
                          ],
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(60),
                          child: Image.asset(
                            'assets/images/logo.png',
                            fit: BoxFit.cover,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              )
              .animate()
              .fadeIn(duration: 800.ms)
              .scale(curve: Curves.elasticOut, duration: 1000.ms),

          const SizedBox(height: 45),

          // --- BRAND TEXT ---
          Text(
                'SMARTFACE ELITE',
                style: GoogleFonts.inter(
                  fontSize: 34,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 7,
                  color: primaryColor,
                  shadows: [
                    Shadow(
                      color: primaryGlow.withValues(alpha: 0.5),
                      blurRadius: 18,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
              )
              .animate()
              .fadeIn(delay: 300.ms, duration: 500.ms)
              .slideY(begin: 0.25, end: 0, duration: 500.ms),

          const SizedBox(height: 8),

          Text(
            'PRECISION ATTENDANCE AI',
            style: GoogleFonts.inter(
              fontSize: 11,
              color: Colors.white38,
              letterSpacing: 4,
              fontWeight: FontWeight.bold,
            ),
          ).animate().fadeIn(delay: 600.ms, duration: 400.ms),

          const Spacer(),

          // --- STYLISH NEURAL LOADING ---
          _buildNeuralLoadingIndicator().animate().fadeIn(
            delay: 900.ms,
            duration: 500.ms,
          ),

          const SizedBox(height: 35),
        ],
      ),
    );
  }

  Widget _buildWelcomeUI(Color primaryColor, Color primaryGlow) {
    return SafeArea(
      key: const ValueKey('welcome_ui'),
      child: Center(
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 28.0, vertical: 20.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Hero(
                tag: 'logo',
                child: Container(
                  height: 90,
                  width: 90,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: AppColors.bgDeep,
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
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(50),
                    child: Image.asset(
                      'assets/images/logo.png',
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),

              const SizedBox(height: 28),

              Text(
                    'Welcome to Smart Next-Gen\nAI Face Recognition Attendance',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.inter(
                      fontSize: 24,
                      height: 1.3,
                      fontWeight: FontWeight.w900,
                      color: Colors.white,
                      shadows: [
                        const Shadow(
                          color: Colors.black54,
                          offset: Offset(0, 3),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                  )
                  .animate()
                  .fadeIn(delay: 200.ms, duration: 500.ms)
                  .slideY(begin: 0.1, end: 0),

              const SizedBox(height: 20),

              Text(
                'Experience the future of smart attendance management with advanced AI-powered face recognition technology designed for schools, colleges, and institutions. Enjoy fast, secure, accurate, and real-time attendance tracking with a modern, professional, and luxury user experience built for the next generation.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  height: 1.55,
                  color: Colors.white70,
                  fontWeight: FontWeight.w400,
                ),
              ).animate().fadeIn(delay: 350.ms, duration: 500.ms),

              const SizedBox(height: 28),

              Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 10,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.03),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: Colors.white.withValues(alpha: 0.05),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        _buildBadgeItem('Smart'),
                        _buildBadgeDivider(),
                        _buildBadgeItem('Secure'),
                        _buildBadgeDivider(),
                        _buildBadgeItem('Intelligent'),
                        _buildBadgeDivider(),
                        _buildBadgeItem('Real-Time'),
                      ],
                    ),
                  )
                  .animate()
                  .fadeIn(delay: 500.ms, duration: 500.ms)
                  .scale(begin: const Offset(0.95, 0.95)),

              const SizedBox(height: 28),

              Text(
                'Effortlessly manage attendance, student records, teacher profiles, analytics, notifications, and AI-powered automation — all in one powerful platform.',
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  height: 1.5,
                  color: Colors.white38,
                  fontWeight: FontWeight.w500,
                ),
              ).animate().fadeIn(delay: 650.ms, duration: 500.ms),

              const SizedBox(height: 40),

              SizedBox(
                width: double.infinity,
                height: 60,
                child: GlowButton(
                  onPressed: () => context.go('/auth/login'),
                  color: primaryColor,
                  glowColor: primaryGlow,
                  borderRadius: 20,
                  child: Text(
                    'GET STARTED',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2,
                      color: Colors.white,
                    ),
                  ),
                ),
              )
              .animate()
              .fadeIn(delay: 800.ms, duration: 500.ms)
              .slideY(begin: 0.2, end: 0),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBadgeItem(String label) {
    final theme = Theme.of(context);
    final darkColors = theme.extension<DarkAppColors>();
    final primaryColor = darkColors?.primary ?? const Color(0xFF2563EB);

    return Text(
      label,
      style: GoogleFonts.inter(
        color: primaryColor,
        fontWeight: FontWeight.bold,
        fontSize: 12,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _buildBadgeDivider() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 10),
      child: Text(
        '•',
        style: GoogleFonts.inter(
          color: Colors.white24,
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  // Futuristic diagnostics & dots loader
  Widget _buildNeuralLoadingIndicator() {
    final theme = Theme.of(context);
    final darkColors = theme.extension<DarkAppColors>();
    final primaryColor = darkColors?.primary ?? const Color(0xFF2563EB);

    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(3, (index) {
            return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 5),
                  height: 6,
                  width: 6,
                  decoration: BoxDecoration(
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
                .animate(onPlay: (controller) => controller.repeat())
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
              color: Colors.white38,
              fontSize: 10,
              letterSpacing: 1.5,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }
}
