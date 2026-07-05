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
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/shared/widgets/glow_button.dart';
import 'package:smartface_attendance/shared/widgets/auth_blob_background.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/features/sync/services/connectivity_service.dart';
import 'package:smartface_attendance/app/config/cache_service.dart';
import 'package:smartface_attendance/core/network/api_service.dart';

/// App startup splash screen widget.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  String _bootMessage = 'BOOT: INITIALIZING SECURE AI SUITE...';
  Timer? _bootTimer;
  final bool _showWelcome = false;

  @override
  void initState() {
    super.initState();
    _runStartupSequence();
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
            final profileResult = await ApiService.getUserProfile(session.token!);
            if (profileResult.containsKey('detail') && 
                (profileResult['detail'].toString().toLowerCase().contains('invalid') || 
                 profileResult['detail'].toString().toLowerCase().contains('expired'))) {
              await session.logout();
              await updateMessage('SECURITY: SESSION EXPIRED', 300);
            } else {
              if (profileResult.containsKey('email')) {
                final isBioRegistered = profileResult['biometric_registered'] ?? session.biometricRegistered;
                await session.saveSession(
                  token: session.token!,
                  email: profileResult['email'],
                  role: profileResult['role'] ?? session.role ?? 'student',
                  name: profileResult['full_name'] ?? session.name,
                  biometricRegistered: isBioRegistered,
                );
                if (profileResult['setup_completed'] == true || isBioRegistered) {
                  await CacheService.set('sf_wizard_completed', true, persist: true);
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

      final onboardingCompleted = await CacheService.get<bool>('sf_onboarding_completed') ?? false;
      final introCompleted = await CacheService.get<bool>('sf_intro_completed') ?? false;
      final wizardCompleted = session.biometricRegistered || (await CacheService.get<bool>('sf_wizard_completed') ?? false);

      if (!mounted) return;

      // • First Install -> Onboarding
      if (!onboardingCompleted) {
        context.go('/auth/onboarding');
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
              : (role == 'parent' ? '/parent/dashboard' : '/student/dashboard'));

      context.go(targetDashboard);
    } catch (e) {
      debugPrint('[Splash] Boot diagnostic error: $e');
      if (mounted) {
        context.go('/auth/login');
      }
    }
  }

  @override
  void dispose() {
    _bootTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const primaryColor = Color(0xFF3559E0);
    const primaryGlow = Color(0x333559E0);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Stack(
        children: [
          // 🌌 Fluid blob gradient background (project palette)
          const AuthBlobBackground(),

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
                            color: primaryColor,
                            width: 2.0,
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: primaryColor.withValues(alpha: 0.30),
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
                  ],
                ),
              )
              .animate()
              .fadeIn(duration: 800.ms)
              .scale(curve: Curves.elasticOut, duration: 1000.ms),

          const SizedBox(height: 45),

          // --- BRAND TEXT ---
          Text(
                'Smart Attendance AI',
                textAlign: TextAlign.center,
                style: GoogleFonts.outfit(
                  fontSize: 28,
                  fontWeight: FontWeight.w900,
                  letterSpacing: 1,
                  color: const Color(0xFF1B2C56),
                  shadows: [
                    Shadow(
                      color: primaryGlow.withValues(alpha: 0.2),
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
            'PRECISION ATTENDANCE, POWERED BY AI',
            style: GoogleFonts.inter(
              fontSize: 10.5,
              color: const Color(0xFF7F8CA4),
              letterSpacing: 2.5,
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
              ).animate().scale(duration: 600.ms, curve: Curves.easeOutBack),

              const SizedBox(height: 28),

              Text(
                    'Welcome to Smart Next-Gen\nAI Face Recognition Attendance',
                    textAlign: TextAlign.center,
                    style: GoogleFonts.outfit(
                      fontSize: 24,
                      height: 1.3,
                      fontWeight: FontWeight.w900,
                      color: const Color(0xFF1B2C56),
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
                  color: const Color(0xFF7F8CA4),
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
                      color: const Color(0xFFF6F8FF),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(
                        color: const Color(0xFFE2E6FF),
                        width: 1.2,
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
                  color: const Color(0xFF8F9BB3),
                  fontWeight: FontWeight.w500,
                ),
              ).animate().fadeIn(delay: 650.ms, duration: 500.ms),

              const SizedBox(height: 40),

              SizedBox(
                    width: double.infinity,
                    height: 54,
                    child: GlowButton(
                      onPressed: () => context.go('/auth/login'),
                      color: primaryColor,
                      glowColor: primaryGlow,
                      borderRadius: 14,
                      child: Text(
                        'GET STARTED',
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
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
    return Text(
      label,
      style: GoogleFonts.inter(
        color: const Color(0xFF3559E0),
        fontWeight: FontWeight.bold,
        fontSize: 12,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _buildBadgeDivider() {
    return const Padding(
      padding: EdgeInsets.symmetric(horizontal: 10),
      child: Text(
        '•',
        style: TextStyle(
          color: Color(0xFF8F9BB3),
          fontWeight: FontWeight.bold,
          fontSize: 12,
        ),
      ),
    );
  }

  // Futuristic diagnostics & dots loader
  Widget _buildNeuralLoadingIndicator() {
    const primaryColor = Color(0xFF3559E0);

    return Column(
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
              color: const Color(0xFF7F8CA4),
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
