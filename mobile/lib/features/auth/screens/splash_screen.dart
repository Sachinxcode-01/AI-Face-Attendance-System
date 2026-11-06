/*
|--------------------------------------------------------------------------
| File: splash_screen.dart
|--------------------------------------------------------------------------
| Project: SmartFace Attendance AI
|
| Design System Alignment:
| - Fully adheres to design.md canonical specifications.
| - Brand Indigo Hero Canvas (#3D4AB8, #4F46E5, #6366F1).
| - Calm Lavender (#E8EAF6) light canvas / Deep Midnight (#070A14) dark mode.
| - Multi-layered Ethereal Radial Gradient Orbs with continuous breathing motion.
| - Holographic Biometric Scanner HUD with laser scan-line and corner reticles.
| - Expressive Poppins headings with Inter body typography.
| - Fully responsive with LayoutBuilder adaptation (compact phones, tablets, landscape).
| - Real-time animated telemetry HUD with progress bar and network diagnosis.
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'package:smartface_attendance/app/config/cache_service.dart';
import 'package:smartface_attendance/core/animation/app_motion.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/auth/widgets/auth_shared_widgets.dart';
import 'package:smartface_attendance/features/sync/services/connectivity_service.dart';
import 'package:smartface_attendance/design_system/design_system.dart'
    hide PrimaryButton;

/// Modern, fully responsive, animated splash screen.
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen>
    with TickerProviderStateMixin {
  // Telemetry state
  String _bootMessage = 'INITIALIZING SECURE AI SUITE...';
  double _bootProgress = 0.10;
  bool _isDiagnosticsComplete = false;

  // Animation Controllers
  late final AnimationController _pulseController;
  late final AnimationController _scanController;
  late final AnimationController _rotationController;
  late final AnimationController _orbsController;

  @override
  void initState() {
    super.initState();

    // 1. Radar Pulse (1800ms looping)
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();

    // 2. Biometric Laser Scan line (2200ms reverse loop)
    _scanController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat(reverse: true);

    // 3. Holographic HUD Ring Rotation (12 seconds continuous)
    _rotationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..repeat();

    // 4. Background Orbs subtle floating breathing (6 seconds reverse loop)
    _orbsController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 6),
    )..repeat(reverse: true);

    // Begin async startup diagnostics
    _runStartupSequence();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _scanController.dispose();
    _rotationController.dispose();
    _orbsController.dispose();
    super.dispose();
  }

  /// Runs the full diagnostic and routing sequence
  Future<void> _runStartupSequence() async {
    final session = context.read<SessionManager>();

    Future<void> updateTelemetry(
      String msg,
      double progress,
      int delayMs,
    ) async {
      if (!mounted) return;
      setState(() {
        _bootMessage = msg;
        _bootProgress = progress;
      });
      await Future.delayed(Duration(milliseconds: delayMs));
    }

    try {
      await updateTelemetry('CONFIGURING DIAGNOSTIC PROTOCOLS...', 0.20, 250);

      // 1. Internet Connectivity Check
      await updateTelemetry('VERIFYING NETWORK LINK...', 0.38, 250);
      final connectivity = sl<ConnectivityService>();
      final isDeviceOnline = connectivity.isOnline;

      bool isBackendOnline = false;
      if (isDeviceOnline) {
        // 2. Backend Health Check
        await updateTelemetry('CONNECTING TO SMARTFACE CLOUD...', 0.58, 300);
        isBackendOnline = await ApiService.isServerOnline();
      }

      // 3. Cache & Version Check
      if (isBackendOnline) {
        await updateTelemetry('AI BIOMETRIC ENGINE READY', 0.72, 250);
      } else {
        await updateTelemetry('OFFLINE CACHE PROTOCOL ENGAGED', 0.72, 250);
      }

      // 4. Session Validation
      await updateTelemetry('VALIDATING ENCRYPTED PROFILE...', 0.88, 300);
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
              await updateTelemetry('SECURITY: SESSION EXPIRED', 0.94, 250);
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
            // Bypass on network glitch to support offline attendance
          }
        }
      }

      // 5. Route Resolution
      await updateTelemetry('LAUNCHING SECURE ENVIRONMENT...', 1.0, 300);
      if (mounted) {
        setState(() => _isDiagnosticsComplete = true);
      }

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

      // Navigation decisions
      if (!onboardingCompleted) {
        context.go('/auth/onboarding');
        return;
      }

      if (!introImagesCompleted) {
        context.go('/intro-images');
        return;
      }

      if (!session.isLoggedIn) {
        context.go('/auth/login');
        return;
      }

      if (!introCompleted) {
        context.go('/auth/intro');
        return;
      }

      final role = session.role?.toLowerCase() ?? 'student';

      if (!wizardCompleted) {
        context.go('/setup/$role');
        return;
      }

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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: isDark ? AppColors.bgDeep : AuthDesign.pageBg,
      body: Stack(
        fit: StackFit.expand,
        children: [
          // ── 1. DYNAMIC AMBIENT BACKGROUND WITH TEXTURE ─────────────────
          _buildBackground(isDark),

          // ── 2. ETHEREAL BREATHING ORBS ────────────────────────────────
          _buildFloatingOrbs(isDark, size),

          // ── 3. MAIN RESPONSIVE CONTENT ────────────────────────────────
          SafeArea(
            child: LayoutBuilder(
              builder: (context, constraints) {
                final isCompact = constraints.maxHeight < 700;
                final isLandscape = constraints.maxWidth > constraints.maxHeight;

                return Center(
                  child: ConstrainedBox(
                    constraints: const BoxConstraints(maxWidth: 480),
                    child: SingleChildScrollView(
                      physics: const BouncingScrollPhysics(),
                      padding: EdgeInsets.symmetric(
                        horizontal: (constraints.maxWidth * 0.06).clamp(16.0, 32.0),
                        vertical: isCompact ? 12.0 : 20.0,
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          if (!isCompact && !isLandscape)
                            SizedBox(height: constraints.maxHeight * 0.05),

                          // Top Subheading Pill Badge
                          _buildTopPillBadge(isDark)
                              .animate()
                              .fadeIn(duration: 600.ms, delay: 100.ms)
                              .slideY(begin: -0.2, end: 0, curve: Curves.easeOutBack),

                          SizedBox(height: isCompact ? 16 : 28),

                          // ── CENTRAL BIOMETRIC SCANNER EMBLEM ─────────────
                          _buildBiometricEmblem(isDark, isCompact),

                          SizedBox(height: isCompact ? 20 : 32),

                          // ── BRAND HEADLINE & TYPOGRAPHY ──────────────────
                          _buildBrandTypography(isDark, isCompact),

                          SizedBox(height: isCompact ? 12 : 20),

                          // ── FEATURE HIGHLIGHT PILLS ──────────────────────
                          if (!isCompact)
                            _buildFeaturePills(isDark)
                                .animate()
                                .fadeIn(duration: 500.ms, delay: 400.ms)
                                .scale(begin: const Offset(0.92, 0.92)),

                          SizedBox(height: isCompact ? 24 : 40),

                          // ── TELEMETRY & DIAGNOSTICS HUD ──────────────────
                          _buildTelemetryHUD(isDark, isCompact)
                              .animate()
                              .fadeIn(duration: 700.ms, delay: 500.ms)
                              .slideY(begin: 0.15, end: 0, curve: Curves.easeOutCubic),

                          if (!isCompact && !isLandscape)
                            SizedBox(height: constraints.maxHeight * 0.03),

                          // Version & Institutional Cloud Assurances
                          _buildFooter(isDark)
                              .animate()
                              .fadeIn(duration: 600.ms, delay: 650.ms),
                        ],
                      ),
                    ),
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // BACKGROUND BUILDERS
  // =========================================================================

  Widget _buildBackground(bool isDark) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Subtle background texture image
        Opacity(
          opacity: isDark ? 0.08 : 0.15,
          child: Image.asset(
            'assets/background/splash_background.jpeg',
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
          ),
        ),

        // Deep Radial Vignette Overlay
        Container(
          decoration: BoxDecoration(
            gradient: RadialGradient(
              center: Alignment.center,
              radius: 1.1,
              colors: isDark
                  ? [
                      const Color(0xFF101935).withValues(alpha: 0.50),
                      AppColors.bgDeep.withValues(alpha: 0.98),
                    ]
                  : [
                      Colors.white.withValues(alpha: 0.85),
                      AuthDesign.pageBg.withValues(alpha: 0.96),
                    ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildFloatingOrbs(bool isDark, Size size) {
    if (AppMotion.isReducedMotion(context)) {
      return const SizedBox.shrink();
    }

    return AnimatedBuilder(
      animation: _orbsController,
      builder: (context, child) {
        final double t = _orbsController.value;
        final double dy1 = math.sin(t * math.pi * 2) * 12;
        final double dx1 = math.cos(t * math.pi * 2) * 8;
        final double scale = 1.0 + (math.sin(t * math.pi * 2) * 0.06);

        return Stack(
          clipBehavior: Clip.none,
          children: [
            // Top Right Radiant Orb (Orb 1)
            Positioned(
              top: -60 + dy1,
              right: -50 + dx1,
              child: Transform.scale(
                scale: scale,
                child: _buildOrb(
                  size: size.width * 0.65,
                  innerColor: isDark ? const Color(0xFF6366F1).withValues(alpha: 0.35) : AuthDesign.orbLight.withValues(alpha: 0.65),
                  outerColor: isDark ? const Color(0xFF3D4AB8).withValues(alpha: 0.02) : AuthDesign.orbDark.withValues(alpha: 0.02),
                ),
              ),
            ),

            // Top Left Soft Orb (Orb 2)
            Positioned(
              top: size.height * 0.18 - dy1,
              left: -70 - dx1,
              child: Transform.scale(
                scale: 1.05 - (scale - 1.0),
                child: _buildOrb(
                  size: size.width * 0.50,
                  innerColor: isDark ? const Color(0xFF4F46E5).withValues(alpha: 0.25) : const Color(0xFFA5B4FC).withValues(alpha: 0.45),
                  outerColor: isDark ? Colors.transparent : Colors.transparent,
                ),
              ),
            ),

            // Bottom Right Accent Orb (Orb 3)
            Positioned(
              bottom: size.height * 0.12 + dy1,
              right: -30,
              child: _buildOrb(
                size: size.width * 0.42,
                innerColor: isDark ? const Color(0xFF22D3EE).withValues(alpha: 0.18) : const Color(0xFF818CF8).withValues(alpha: 0.35),
                outerColor: Colors.transparent,
              ),
            ),

            // Central Luminous Halo behind the Logo
            Positioned(
              top: (size.height / 2) - 150 + (dy1 * 0.5),
              left: (size.width / 2) - 150,
              child: Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [
                      const Color(0xFF6366F1).withValues(alpha: isDark ? 0.18 : 0.12),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildOrb({
    required double size,
    required Color innerColor,
    required Color outerColor,
  }) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          center: Alignment.center,
          radius: 0.5,
          colors: [innerColor, outerColor],
        ),
      ),
    );
  }

  // =========================================================================
  // TOP PILL BADGE
  // =========================================================================

  Widget _buildTopPillBadge(bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF18203E) : const Color(0xFFEEF2FF),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(
          color: isDark ? const Color(0xFF2C3766) : const Color(0xFFC7D2FE),
          width: 1.0,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF4F46E5).withValues(alpha: isDark ? 0.2 : 0.08),
            blurRadius: 12,
            offset: const Offset(0, 3),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 7,
            height: 7,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFF22D3EE),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF22D3EE).withValues(alpha: 0.8),
                  blurRadius: 6,
                  spreadRadius: 1,
                ),
              ],
            ),
          ),
          const SizedBox(width: 8),
          Text(
            'NEXT-GEN AI ATTENDANCE',
            style: GoogleFonts.inter(
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
              letterSpacing: 1.2,
              color: isDark ? const Color(0xFFA5B4FC) : const Color(0xFF4338CA),
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // CENTRAL BIOMETRIC SCANNER EMBLEM
  // =========================================================================

  Widget _buildBiometricEmblem(bool isDark, bool isCompact) {
    final double emblemSize = isCompact ? 108.0 : 132.0;
    final double outerRingSize = emblemSize + (isCompact ? 36.0 : 48.0);
    final double radarWaveSize = outerRingSize + (isCompact ? 32.0 : 44.0);

    return RepaintBoundary(
      child: SizedBox(
        width: radarWaveSize,
        height: radarWaveSize,
        child: Stack(
          alignment: Alignment.center,
          children: [
            // ── RADAR PULSE WAVE 1 ──
            if (!AppMotion.isReducedMotion(context))
              AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  final double progress = _pulseController.value;
                  final double scale = 1.0 + (progress * 0.35);
                  final double opacity = (1.0 - progress).clamp(0.0, 1.0);

                  return Transform.scale(
                    scale: scale,
                    child: Container(
                      width: outerRingSize,
                      height: outerRingSize,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: const Color(0xFF6366F1).withValues(alpha: opacity * 0.5),
                          width: 1.5,
                        ),
                      ),
                    ),
                  );
                },
              ),

            // ── RADAR PULSE WAVE 2 (Secondary Offset) ──
            if (!AppMotion.isReducedMotion(context))
              AnimatedBuilder(
                animation: _pulseController,
                builder: (context, child) {
                  final double progress = (_pulseController.value + 0.45) % 1.0;
                  final double scale = 1.0 + (progress * 0.45);
                  final double opacity = (1.0 - progress).clamp(0.0, 1.0);

                  return Transform.scale(
                    scale: scale,
                    child: Container(
                      width: outerRingSize,
                      height: outerRingSize,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: const Color(0xFF22D3EE).withValues(alpha: opacity * 0.35),
                          width: 1.0,
                        ),
                      ),
                    ),
                  );
                },
              ),

            // ── ROTATING HOLOGRAPHIC SCANNER RING ──
            AnimatedBuilder(
              animation: _rotationController,
              builder: (context, child) {
                return Transform.rotate(
                  angle: _rotationController.value * 2 * math.pi,
                  child: CustomPaint(
                    size: Size(outerRingSize, outerRingSize),
                    painter: _HolographicReticlePainter(
                      color: const Color(0xFF6366F1).withValues(alpha: isDark ? 0.45 : 0.35),
                      accentColor: const Color(0xFF22D3EE).withValues(alpha: isDark ? 0.8 : 0.6),
                    ),
                  ),
                );
              },
            ),

            // ── BIOMETRIC VIEWFINDER CORNER RETICLES ──
            CustomPaint(
              size: Size(emblemSize + 16, emblemSize + 16),
              painter: _BiometricCornerReticlesPainter(
                color: isDark ? const Color(0xFF818CF8) : const Color(0xFF4F46E5),
                bracketLength: 14.0,
                strokeWidth: 2.5,
              ),
            ),

            // ── CENTRAL CIRCULAR LOGO EMBLEM ──
            Hero(
              tag: 'app_logo_emblem',
              child: Container(
                width: emblemSize,
                height: emblemSize,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isDark ? const Color(0xFF0C1226) : Colors.white,
                  border: Border.all(
                    color: const Color(0xFF6366F1),
                    width: 2.2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF4F46E5).withValues(alpha: isDark ? 0.45 : 0.25),
                      blurRadius: 28,
                      spreadRadius: 2,
                      offset: const Offset(0, 8),
                    ),
                    BoxShadow(
                      color: const Color(0xFF22D3EE).withValues(alpha: isDark ? 0.25 : 0.15),
                      blurRadius: 16,
                      spreadRadius: -2,
                    ),
                  ],
                ),
                child: ClipOval(
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      // Inner ambient background gradient
                      Container(
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: isDark
                                ? [const Color(0xFF161F42), const Color(0xFF0A0F22)]
                                : [const Color(0xFFFFFFFF), const Color(0xFFEEF2FF)],
                          ),
                        ),
                      ),

                      // High-res App Logo Asset
                      Padding(
                        padding: EdgeInsets.all(isCompact ? 14.0 : 18.0),
                        child: Image.asset(
                          'assets/images/logo.png',
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) => Image.asset(
                            'assets/images/smartface_logo.png',
                            fit: BoxFit.contain,
                            errorBuilder: (ctx, err, st) => const Icon(
                              Icons.face_retouching_natural_rounded,
                              size: 56,
                              color: Color(0xFF4F46E5),
                            ),
                          ),
                        ),
                      ),

                      // ── LASER RADAR SCAN BAR ──
                      if (!AppMotion.isReducedMotion(context))
                        AnimatedBuilder(
                          animation: _scanController,
                          builder: (context, child) {
                            final double scanPos = (_scanController.value * 2.0) - 1.0; // -1.0 to 1.0
                            return Positioned(
                              top: ((emblemSize / 2) + (scanPos * (emblemSize * 0.42))) - 2,
                              left: 0,
                              right: 0,
                              child: Container(
                                height: 4,
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    colors: [
                                      Colors.transparent,
                                      const Color(0xFF22D3EE).withValues(alpha: 0.95),
                                      const Color(0xFF6366F1).withValues(alpha: 0.95),
                                      Colors.transparent,
                                    ],
                                  ),
                                  boxShadow: [
                                    BoxShadow(
                                      color: const Color(0xFF22D3EE).withValues(alpha: 0.8),
                                      blurRadius: 10,
                                      spreadRadius: 1,
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    )
        .animate()
        .fadeIn(duration: 800.ms)
        .scale(curve: Curves.easeOutBack, duration: 900.ms);
  }

  // =========================================================================
  // BRAND TYPOGRAPHY & TAGLINE
  // =========================================================================

  Widget _buildBrandTypography(bool isDark, bool isCompact) {
    return Column(
      children: [
        // Title: Smart Attendance AI
        Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Smart Attendance ',
              style: GoogleFonts.poppins(
                fontSize: isCompact ? 24 : 28,
                fontWeight: FontWeight.w800,
                letterSpacing: -0.6,
                color: isDark ? AppColors.textHeadingDark : AuthDesign.textHeading,
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                ),
                borderRadius: BorderRadius.circular(8),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFF4F46E5).withValues(alpha: 0.35),
                    blurRadius: 10,
                    offset: const Offset(0, 3),
                  ),
                ],
              ),
              child: Text(
                'AI',
                style: GoogleFonts.poppins(
                  fontSize: isCompact ? 20 : 24,
                  fontWeight: FontWeight.w800,
                  color: Colors.white,
                  letterSpacing: 0.5,
                ),
              ),
            ),
          ],
        )
            .animate()
            .fadeIn(duration: 600.ms, delay: 250.ms)
            .slideY(begin: 0.15, end: 0, curve: Curves.easeOutCubic),

        const SizedBox(height: 8),

        // Subtitle: Secure • Intelligent • Real-Time Biometrics
        Text(
          'Secure • Intelligent • Real-Time Biometrics',
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(
            fontSize: isCompact ? 12.5 : 14.0,
            fontWeight: FontWeight.w500,
            letterSpacing: 0.3,
            color: isDark ? const Color(0xFFA5B4FC) : const Color(0xFF5B6484),
          ),
        )
            .animate()
            .fadeIn(duration: 600.ms, delay: 350.ms)
            .slideY(begin: 0.1, end: 0, curve: Curves.easeOutCubic),
      ],
    );
  }

  // =========================================================================
  // FEATURE HIGHLIGHT PILLS
  // =========================================================================

  Widget _buildFeaturePills(bool isDark) {
    return Wrap(
      alignment: WrapAlignment.center,
      spacing: 8.0,
      runSpacing: 8.0,
      children: [
        _buildPill(
          icon: Icons.verified_user_outlined,
          label: 'Anti-Spoofing',
          isDark: isDark,
        ),
        _buildPill(
          icon: Icons.bolt_rounded,
          label: 'Zero Latency',
          isDark: isDark,
        ),
        _buildPill(
          icon: Icons.cloud_sync_outlined,
          label: 'Offline Resilient',
          isDark: isDark,
        ),
      ],
    );
  }

  Widget _buildPill({
    required IconData icon,
    required String label,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF141C38) : Colors.white.withValues(alpha: 0.85),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: isDark ? const Color(0xFF242E54) : const Color(0xFFE2E8F0),
          width: 1.0,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 13,
            color: const Color(0xFF6366F1),
          ),
          const SizedBox(width: 5),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: isDark ? Colors.white70 : const Color(0xFF475569),
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // TELEMETRY & DIAGNOSTICS HUD
  // =========================================================================

  Widget _buildTelemetryHUD(bool isDark, bool isCompact) {
    return Container(
      width: double.infinity,
      padding: EdgeInsets.symmetric(
        horizontal: isCompact ? 16 : 20,
        vertical: isCompact ? 14 : 16,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF101730).withValues(alpha: 0.88) : Colors.white.withValues(alpha: 0.90),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isDark ? const Color(0xFF25305A) : const Color(0xFFE5E7F0),
          width: 1.2,
        ),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withValues(alpha: 0.35)
                : const Color(0xFF8B98CE).withValues(alpha: 0.16),
            blurRadius: 24,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header Status Bar
          Row(
            children: [
              // Pulsing Live Beacon Indicator
              Container(
                width: 9,
                height: 9,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _isDiagnosticsComplete
                      ? const Color(0xFF10B981)
                      : const Color(0xFF6366F1),
                  boxShadow: [
                    BoxShadow(
                      color: (_isDiagnosticsComplete
                              ? const Color(0xFF10B981)
                              : const Color(0xFF6366F1))
                          .withValues(alpha: 0.7),
                      blurRadius: 8,
                      spreadRadius: 1,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                'SYSTEM TELEMETRY',
                style: GoogleFonts.robotoMono(
                  fontSize: 10,
                  fontWeight: FontWeight.w700,
                  letterSpacing: 1.2,
                  color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                ),
              ),
              const Spacer(),
              Text(
                '${(_bootProgress * 100).toInt()}%',
                style: GoogleFonts.robotoMono(
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                  color: const Color(0xFF6366F1),
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          // Fluid Animated Progress Bar
          ClipRRect(
            borderRadius: BorderRadius.circular(6),
            child: Stack(
              children: [
                // Track
                Container(
                  height: 6,
                  width: double.infinity,
                  color: isDark ? const Color(0xFF1E284D) : const Color(0xFFE2E8F0),
                ),
                // Indicator
                AnimatedFractionallySizedBox(
                  duration: const Duration(milliseconds: 300),
                  curve: Curves.easeOutCubic,
                  widthFactor: _bootProgress.clamp(0.0, 1.0),
                  child: Container(
                    height: 6,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [
                          Color(0xFF4F46E5),
                          Color(0xFF6366F1),
                          Color(0xFF22D3EE),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(6),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF6366F1).withValues(alpha: 0.6),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 12),

          // Live Monospace Telemetry Feed Message
          AnimatedSwitcher(
            duration: const Duration(milliseconds: 200),
            transitionBuilder: (child, animation) {
              return FadeTransition(
                opacity: animation,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: const Offset(0.0, 0.2),
                    end: Offset.zero,
                  ).animate(animation),
                  child: child,
                ),
              );
            },
            child: Row(
              key: ValueKey<String>(_bootMessage),
              children: [
                Icon(
                  Icons.terminal_rounded,
                  size: 13,
                  color: isDark ? const Color(0xFF7F8CA4) : const Color(0xFF94A3B8),
                ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    _bootMessage,
                    style: GoogleFonts.robotoMono(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w600,
                      letterSpacing: 0.8,
                      color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  // =========================================================================
  // FOOTER & COPYRIGHT
  // =========================================================================

  Widget _buildFooter(bool isDark) {
    return Column(
      children: [
        Text(
          'v2.5.0 • Institutional Cloud Edition',
          style: GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w500,
            letterSpacing: 0.4,
            color: isDark ? Colors.white38 : const Color(0xFF94A3B8),
          ),
        ),
        const SizedBox(height: 4),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.lock_outline_rounded,
              size: 11,
              color: isDark ? Colors.white30 : const Color(0xFFA0AEC0),
            ),
            const SizedBox(width: 4),
            Text(
              'End-to-End Encrypted ArcFace Biometrics',
              style: GoogleFonts.inter(
                fontSize: 10,
                color: isDark ? Colors.white30 : const Color(0xFFA0AEC0),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

// ===========================================================================
// CUSTOM PAINTERS: HOLOGRAPHIC SCANNER RETICLES & CORNER BRACKETS
// ===========================================================================

/// Paints the outer rotating holographic radar ring with segmented dashed arcs
class _HolographicReticlePainter extends CustomPainter {
  final Color color;
  final Color accentColor;

  _HolographicReticlePainter({
    required this.color,
    required this.accentColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width / 2) - 4;

    final basePaint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    final accentPaint = Paint()
      ..color = accentColor
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 2.2;

    // Draw segmented outer arcs (4 segments)
    const int segments = 4;
    const double sweepAngle = (math.pi / 2) * 0.65;
    const double gapAngle = (math.pi / 2) * 0.35;

    for (int i = 0; i < segments; i++) {
      final double startAngle = (i * (sweepAngle + gapAngle));
      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
        (i % 2 == 0) ? accentPaint : basePaint,
      );
    }

    // Inner subtle dotted guideline ring
    final dotPaint = Paint()
      ..color = color.withValues(alpha: 0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    canvas.drawCircle(center, radius - 6, dotPaint);
  }

  @override
  bool shouldRepaint(covariant _HolographicReticlePainter oldDelegate) {
    return oldDelegate.color != color || oldDelegate.accentColor != accentColor;
  }
}

/// Paints 4 high-tech corner viewfinder brackets (⌜ ⌝ ⌞ ⌟)
class _BiometricCornerReticlesPainter extends CustomPainter {
  final Color color;
  final double bracketLength;
  final double strokeWidth;

  _BiometricCornerReticlesPainter({
    required this.color,
    required this.bracketLength,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeWidth = strokeWidth;

    const double inset = 2.0;

    // 1. Top-Left Corner ⌜
    final pathTL = Path()
      ..moveTo(inset, inset + bracketLength)
      ..lineTo(inset, inset + 4)
      ..quadraticBezierTo(inset, inset, inset + 4, inset)
      ..lineTo(inset + bracketLength, inset);
    canvas.drawPath(pathTL, paint);

    // 2. Top-Right Corner ⌝
    final pathTR = Path()
      ..moveTo(size.width - inset - bracketLength, inset)
      ..lineTo(size.width - inset - 4, inset)
      ..quadraticBezierTo(size.width - inset, inset, size.width - inset, inset + 4)
      ..lineTo(size.width - inset, inset + bracketLength);
    canvas.drawPath(pathTR, paint);

    // 3. Bottom-Left Corner ⌞
    final pathBL = Path()
      ..moveTo(inset, size.height - inset - bracketLength)
      ..lineTo(inset, size.height - inset - 4)
      ..quadraticBezierTo(inset, size.height - inset, inset + 4, size.height - inset)
      ..lineTo(inset + bracketLength, size.height - inset);
    canvas.drawPath(pathBL, paint);

    // 4. Bottom-Right Corner ⌟
    final pathBR = Path()
      ..moveTo(size.width - inset - bracketLength, size.height - inset)
      ..lineTo(size.width - inset - 4, size.height - inset)
      ..quadraticBezierTo(
        size.width - inset,
        size.height - inset,
        size.width - inset,
        size.height - inset - 4,
      )
      ..lineTo(size.width - inset, size.height - inset - bracketLength);
    canvas.drawPath(pathBR, paint);
  }

  @override
  bool shouldRepaint(covariant _BiometricCornerReticlesPainter oldDelegate) {
    return oldDelegate.color != color ||
        oldDelegate.bracketLength != bracketLength ||
        oldDelegate.strokeWidth != strokeWidth;
  }
}
