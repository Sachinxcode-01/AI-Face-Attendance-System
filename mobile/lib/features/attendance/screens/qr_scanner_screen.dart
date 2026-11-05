/*
|--------------------------------------------------------------------------
| File: qr_scanner_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Renders the state-of-the-art Cyber Biometric HUD camera view to scan class
| attendance QR codes. Features high-fidelity glassmorphism, animated laser
| sweeps, telemetry status readouts, and tactile haptic feedback.
|--------------------------------------------------------------------------
*/

import 'dart:convert';
import 'dart:math' as math;
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:provider/provider.dart';

// ======================================================
// State & Core Imports
// ======================================================
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/features/sync/repositories/sync_repository.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/app/router/route_names.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';

enum ScanResultState { none, loading, success, error }

/// High-tech cyber biometric QR camera scanner screen for students.
class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen>
    with TickerProviderStateMixin {
  bool _isScanning = true;
  bool _torchEnabled = false;
  final MobileScannerController _controller = MobileScannerController();
  late final AnimationController _laserController;
  late final AnimationController _pulseController;
  ScanResultState _resultState = ScanResultState.none;
  String _statusMessage = 'SYSTEM READY // AI RADAR ACTIVE';

  @override
  void initState() {
    super.initState();
    _laserController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2200),
    )..repeat();

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    _laserController.dispose();
    _pulseController.dispose();
    super.dispose();
  }

  void _onDetect(BarcodeCapture capture) {
    if (!_isScanning || _resultState != ScanResultState.none) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final String? code = barcodes.first.rawValue;
      if (code != null) {
        setState(() {
          _isScanning = false;
          _resultState = ScanResultState.loading;
          _statusMessage = 'TOKEN DETECTED // DECRYPTING PAYLOAD...';
        });
        HapticFeedback.heavyImpact();
        _handleAttendance(code);
      }
    }
  }

  String _resolveStudentEmail({bool listen = false}) {
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    final session = Provider.of<SessionManager>(context, listen: listen);
    return args?['email'] ?? session.email ?? 'student@smartface.elite';
  }

  Future<void> _handleAttendance(String qrData) async {
    try {
      final decoded = jsonDecode(qrData);
      final sessionId = decoded['session_id'];
      final token = decoded['token'];

      final studentEmail = _resolveStudentEmail();

      final record = await sl<SyncRepository>().recordAttendance(
        studentEmail: studentEmail,
        sessionId: sessionId,
        qrToken: token,
      );
      debugPrint('[QRScanner] Enqueued offline record: ${record.id}');

      if (!mounted) return;

      final success = record.id.isNotEmpty;

      if (success) {
        HapticFeedback.vibrate();
        setState(() {
          _resultState = ScanResultState.success;
          _statusMessage = 'VERIFICATION CONFIRMED // ATTENDANCE RECORDED';
        });

        await Future.delayed(const Duration(milliseconds: 1600));
        if (mounted) {
          context.go('/student/home');
        }
      } else {
        throw Exception('Failed to record attendance');
      }
    } catch (e, stackTrace) {
      debugPrint('[QRScanner] _handleAttendance error: $e\n$stackTrace');
      if (!mounted) return;
      HapticFeedback.heavyImpact();
      setState(() {
        _resultState = ScanResultState.error;
        _statusMessage = e is FormatException
            ? 'AUTHENTICATION FAILED // INVALID QR CODE'
            : 'ATTENDANCE FAILED // REPOSITORY ERROR';
      });
      AppToast.show(
        context,
        message: e is FormatException
            ? 'Invalid QR Code Format'
            : 'Attendance verification failed',
        type: ToastType.error,
      );

      await Future.delayed(const Duration(milliseconds: 2200));
      if (mounted) {
        setState(() {
          _resultState = ScanResultState.none;
          _isScanning = true;
          _statusMessage = 'SYSTEM READY // AI RADAR ACTIVE';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const double cutoutSize = 270.0;
    final studentEmail = _resolveStudentEmail(listen: true);

    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 📷 Live Camera Feed
          MobileScanner(
            controller: _controller,
            onDetect: _onDetect,
          ),

          // 🛡️ High-Tech Cyber Mask HUD Overlay
          AnimatedBuilder(
            animation: _pulseController,
            builder: (context, child) {
              return CustomPaint(
                size: Size.infinite,
                painter: ScannerHUDPainter(
                  cutoutSize: cutoutSize,
                  resultState: _resultState,
                  pulseValue: _pulseController.value,
                  repaint: _pulseController,
                ),
              );
            },
          ),

          // 🌌 Dynamic Ambient Radial Glow
          Positioned.fill(
            child: IgnorePointer(
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 400),
                decoration: BoxDecoration(
                  gradient: RadialGradient(
                    center: Alignment.center,
                    radius: 0.65,
                    colors: [
                      if (_resultState == ScanResultState.success)
                        Colors.greenAccent.withValues(alpha: 0.15)
                      else if (_resultState == ScanResultState.error)
                        Colors.redAccent.withValues(alpha: 0.18)
                      else if (_resultState == ScanResultState.loading)
                        Colors.cyanAccent.withValues(alpha: 0.12)
                      else
                        Colors.cyanAccent.withValues(alpha: 0.04),
                      Colors.transparent,
                    ],
                  ),
                ),
              ),
            ),
          ),

          // 📟 Centered Viewport & Laser Scan FX
          Center(
            child: Container(
              width: cutoutSize,
              height: cutoutSize,
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(28),
                boxShadow: [
                  if (_resultState == ScanResultState.success)
                    BoxShadow(
                      color: Colors.greenAccent.withValues(alpha: 0.45),
                      blurRadius: 28,
                      spreadRadius: 6,
                    )
                  else if (_resultState == ScanResultState.error)
                    BoxShadow(
                      color: Colors.redAccent.withValues(alpha: 0.45),
                      blurRadius: 28,
                      spreadRadius: 6,
                    )
                  else
                    BoxShadow(
                      color: Colors.cyanAccent.withValues(alpha: 0.15),
                      blurRadius: 18,
                      spreadRadius: 2,
                    ),
                ],
              ),
              child: RepaintBoundary(
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(28),
                child: Stack(
                  children: [
                    // Subtle background grid lines
                    CustomPaint(
                      size: const Size(cutoutSize, cutoutSize),
                      painter: _ViewfinderGridPainter(
                        activeColor: _resultState == ScanResultState.success
                            ? Colors.greenAccent.withValues(alpha: 0.15)
                            : _resultState == ScanResultState.error
                                ? Colors.redAccent.withValues(alpha: 0.15)
                                : Colors.cyanAccent.withValues(alpha: 0.08),
                      ),
                    ),

                    // Sweeping Holographic Laser Line
                    if (_resultState == ScanResultState.none)
                      AnimatedBuilder(
                        animation: _laserController,
                        builder: (context, child) {
                          final double position =
                              _laserController.value * cutoutSize;
                          return Positioned(
                            top: position - 50.0,
                            left: 0,
                            right: 0,
                            child: Container(
                              height: 50,
                              decoration: BoxDecoration(
                                gradient: LinearGradient(
                                  begin: Alignment.topCenter,
                                  end: Alignment.bottomCenter,
                                  colors: [
                                    Colors.cyanAccent.withValues(alpha: 0.0),
                                    Colors.cyanAccent.withValues(alpha: 0.08),
                                    Colors.cyanAccent.withValues(alpha: 0.35),
                                  ],
                                ),
                              ),
                              child: Align(
                                alignment: Alignment.bottomCenter,
                                child: Container(
                                  height: 3.0,
                                  decoration: BoxDecoration(
                                    color: Colors.cyanAccent,
                                    borderRadius: BorderRadius.circular(2),
                                    boxShadow: const [
                                      BoxShadow(
                                        color: Colors.cyanAccent,
                                        blurRadius: 12,
                                        spreadRadius: 2,
                                      ),
                                      BoxShadow(
                                        color: Colors.white,
                                        blurRadius: 4,
                                        spreadRadius: 1,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          );
                        },
                      ),

                    // Loading State: High-tech dual spinning biometric rings
                    if (_resultState == ScanResultState.loading)
                      Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Stack(
                              alignment: Alignment.center,
                              children: [
                                SizedBox(
                                  width: 72,
                                  height: 72,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 3,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      Colors.cyanAccent.withValues(alpha: 0.3),
                                    ),
                                  ),
                                ),
                                const SizedBox(
                                  width: 54,
                                  height: 54,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 4,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      Colors.cyanAccent,
                                    ),
                                  ),
                                ),
                                const Icon(
                                  Icons.lock_clock_rounded,
                                  color: Colors.cyanAccent,
                                  size: 26,
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'AUTHENTICATING',
                              style: GoogleFonts.robotoMono(
                                color: Colors.cyanAccent,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 2,
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Success State: Animated Checkmark with radiant aura
                    if (_resultState == ScanResultState.success)
                      Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const AnimatedCheckmark(size: 88),
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 14,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: Colors.greenAccent.withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: Colors.greenAccent.withValues(alpha: 0.4),
                                ),
                              ),
                              child: Text(
                                'ATTENDANCE CONFIRMED',
                                style: GoogleFonts.robotoMono(
                                  color: Colors.greenAccent,
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),

                    // Error State: Cyber alert cross
                    if (_resultState == ScanResultState.error)
                      Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                shape: BoxShape.circle,
                                color: Colors.redAccent.withValues(alpha: 0.15),
                                border: Border.all(
                                  color: Colors.redAccent,
                                  width: 2,
                                ),
                              ),
                              child: const Icon(
                                Icons.close_rounded,
                                color: Colors.redAccent,
                                size: 54,
                              ),
                            ),
                            const SizedBox(height: 14),
                            Text(
                              'ACCESS DENIED',
                              style: GoogleFonts.robotoMono(
                                color: Colors.redAccent,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 2,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),
            ),
          )
                .animate(target: _resultState == ScanResultState.error ? 1 : 0)
                .shake(duration: 400.ms, hz: 6)
                .animate(target: _resultState == ScanResultState.success ? 1 : 0)
                .scale(
                  begin: const Offset(1, 1),
                  end: const Offset(1.04, 1.04),
                  duration: 250.ms,
                  curve: Curves.easeOutBack,
                ),
          ),

          // 🧭 Top Floating Navigation Bar
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: SafeArea(
              bottom: false,
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    // Back Button
                    _buildGlassIconButton(
                      icon: Icons.arrow_back_ios_new_rounded,
                      iconSize: 18,
                      onTap: () {
                        HapticFeedback.lightImpact();
                        context.go('/student/home');
                      },
                    ),

                    // Title & Engine Pill
                    ClipRRect(
                      borderRadius: BorderRadius.circular(30),
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withValues(alpha: 0.55),
                            borderRadius: BorderRadius.circular(30),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.12),
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: _resultState == ScanResultState.error
                                      ? Colors.redAccent
                                      : _resultState == ScanResultState.success
                                          ? Colors.greenAccent
                                          : Colors.cyanAccent,
                                  boxShadow: [
                                    BoxShadow(
                                      color: _resultState == ScanResultState.error
                                          ? Colors.redAccent
                                          : _resultState == ScanResultState.success
                                              ? Colors.greenAccent
                                              : Colors.cyanAccent,
                                      blurRadius: 6,
                                      spreadRadius: 1,
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'SMARTFACE HUD',
                                style: GoogleFonts.robotoMono(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 1.5,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    // Flashlight Toggle Button
                    _buildGlassIconButton(
                      icon: _torchEnabled
                          ? Icons.flash_on_rounded
                          : Icons.flash_off_rounded,
                      iconColor: _torchEnabled
                          ? Colors.amberAccent
                          : Colors.white70,
                      glowColor: _torchEnabled
                          ? Colors.amberAccent.withValues(alpha: 0.4)
                          : null,
                      onTap: () async {
                        HapticFeedback.lightImpact();
                        try {
                          await _controller.toggleTorch();
                          if (!mounted) return;
                          setState(() {
                            _torchEnabled = !_torchEnabled;
                          });
                        } catch (e) {
                          debugPrint('Torch toggle error: $e');
                        }
                      },
                    ),
                    const SizedBox(width: 8),

                    // Biometric Face Check-in Switch Button
                    _buildGlassIconButton(
                      icon: Icons.face_retouching_natural_rounded,
                      iconColor: const Color(0xFF67E8F9),
                      glowColor: const Color(0xFF6366F1).withValues(alpha: 0.4),
                      onTap: () {
                        HapticFeedback.lightImpact();
                        context.push(AppRoutes.studentFaceCheckinPath);
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 🎯 Floating Alignment Instruction Banner
          Positioned(
            top: 110,
            left: 24,
            right: 24,
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 10,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: Colors.cyanAccent.withValues(alpha: 0.2),
                    ),
                  ),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: BoxDecoration(
                          color: Colors.cyanAccent.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: const Icon(
                          Icons.qr_code_scanner_rounded,
                          color: Colors.cyanAccent,
                          size: 18,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              'ALIGN ATTENDANCE QR',
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1,
                              ),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'Hold steady within holographic brackets',
                              style: GoogleFonts.inter(
                                color: Colors.white.withValues(alpha: 0.65),
                                fontSize: 11,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1, end: 0),

          // 💾 Premium Cyber Telemetry HUD Console
          Positioned(
            bottom: 28,
            left: 20,
            right: 20,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Live Status Beacon
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 14,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.black.withValues(alpha: 0.6),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: _resultState == ScanResultState.error
                          ? Colors.redAccent.withValues(alpha: 0.3)
                          : _resultState == ScanResultState.success
                              ? Colors.greenAccent.withValues(alpha: 0.3)
                              : Colors.cyanAccent.withValues(alpha: 0.3),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _resultState == ScanResultState.error
                              ? Colors.redAccent
                              : _resultState == ScanResultState.success
                                  ? Colors.greenAccent
                                  : Colors.cyanAccent,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        _statusMessage,
                        style: GoogleFonts.robotoMono(
                          color: _resultState == ScanResultState.error
                              ? Colors.redAccent
                              : _resultState == ScanResultState.success
                                  ? Colors.greenAccent
                                  : Colors.cyanAccent,
                          fontSize: 10,
                          letterSpacing: 1.5,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                )
                    .animate(onPlay: (c) => c.repeat(reverse: true))
                    .shimmer(duration: 2000.ms, color: Colors.white12),

                const SizedBox(height: 12),

                // Frosted Glass Telemetry Matrix
                ClipRRect(
                  borderRadius: BorderRadius.circular(20),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.65),
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.1),
                        ),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.4),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Row(
                            children: [
                              Expanded(
                                child: _buildTelemetryBlock(
                                  icon: Icons.qr_code_2_rounded,
                                  title: 'SCAN PAYLOAD',
                                  value: 'SESSION QR TOKEN',
                                  valueColor: Colors.cyanAccent,
                                ),
                              ),
                              Container(
                                width: 1,
                                height: 32,
                                color: Colors.white10,
                              ),
                              Expanded(
                                child: _buildTelemetryBlock(
                                  icon: Icons.track_changes_rounded,
                                  title: 'SCANNER STATUS',
                                  value: _resultState == ScanResultState.success
                                      ? 'VERIFIED'
                                      : _resultState == ScanResultState.loading
                                          ? 'PROCESSING'
                                          : _resultState == ScanResultState.error
                                              ? 'FAILED'
                                              : 'AWAITING CODE',
                                  valueColor: _resultState == ScanResultState.success
                                      ? Colors.greenAccent
                                      : _resultState == ScanResultState.error
                                          ? Colors.redAccent
                                          : Colors.cyanAccent,
                                ),
                              ),
                            ],
                          ),
                          const Padding(
                            padding: EdgeInsets.symmetric(vertical: 8),
                            child: Divider(color: Colors.white12, height: 1),
                          ),
                          Row(
                            children: [
                              Expanded(
                                child: _buildTelemetryBlock(
                                  icon: Icons.badge_outlined,
                                  title: 'STUDENT IDENTITY',
                                  value: studentEmail,
                                  valueColor: Colors.white,
                                ),
                              ),
                              Container(
                                width: 1,
                                height: 32,
                                color: Colors.white10,
                              ),
                              Expanded(
                                child: _buildTelemetryBlock(
                                  icon: Icons.sync_alt_rounded,
                                  title: 'ATTENDANCE DISPATCH',
                                  value: 'LOCAL SYNC QUEUE',
                                  valueColor: AppColors.gold,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.1, end: 0),
        ],
      ),
    );
  }

  Widget _buildGlassIconButton({
    required IconData icon,
    required VoidCallback onTap,
    double iconSize = 20,
    Color iconColor = Colors.white70,
    Color? glowColor,
  }) {
    return ClipRRect(
      borderRadius: BorderRadius.circular(16),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.black.withValues(alpha: 0.5),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(
              color: glowColor ?? Colors.white.withValues(alpha: 0.12),
            ),
            boxShadow: glowColor != null
                ? [
                    BoxShadow(
                      color: glowColor,
                      blurRadius: 12,
                      spreadRadius: 2,
                    ),
                  ]
                : null,
          ),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              borderRadius: BorderRadius.circular(16),
              onTap: onTap,
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Icon(icon, color: iconColor, size: iconSize),
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTelemetryBlock({
    required IconData icon,
    required String title,
    required String value,
    required Color valueColor,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.white38),
          const SizedBox(width: 8),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 8.5,
                    color: Colors.white38,
                    fontWeight: FontWeight.bold,
                    letterSpacing: 0.8,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.robotoMono(
                    fontSize: 10.5,
                    color: valueColor,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────
//  Viewfinder Interior Grid Painter
// ─────────────────────────────────────────────

class _ViewfinderGridPainter extends CustomPainter {
  final Color activeColor;

  _ViewfinderGridPainter({required this.activeColor});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = activeColor
      ..strokeWidth = 1.0;

    // Draw central target crosshair
    final double midX = size.width / 2;
    final double midY = size.height / 2;
    const double crossSize = 14.0;

    canvas.drawLine(
      Offset(midX - crossSize, midY),
      Offset(midX + crossSize, midY),
      paint,
    );
    canvas.drawLine(
      Offset(midX, midY - crossSize),
      Offset(midX, midY + crossSize),
      paint,
    );

    // Draw small target center ring
    final circlePaint = Paint()
      ..color = activeColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    canvas.drawCircle(Offset(midX, midY), 6.0, circlePaint);
  }

  @override
  bool shouldRepaint(covariant _ViewfinderGridPainter oldDelegate) {
    return oldDelegate.activeColor != activeColor;
  }
}

// ─────────────────────────────────────────────
//  Animated Checkmark Widget
// ─────────────────────────────────────────────

class AnimatedCheckmark extends StatefulWidget {
  final double size;
  const AnimatedCheckmark({super.key, this.size = 80.0});

  @override
  State<AnimatedCheckmark> createState() => _AnimatedCheckmarkState();
}

class _AnimatedCheckmarkState extends State<AnimatedCheckmark>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 650),
    )..forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          size: Size(widget.size, widget.size),
          painter: _CheckmarkPainter(_controller.value),
        );
      },
    );
  }
}

class _CheckmarkPainter extends CustomPainter {
  final double progress;
  _CheckmarkPainter(this.progress);

  @override
  void paint(Canvas canvas, Size size) {
    // Outer circle
    final circlePaint = Paint()
      ..color = Colors.greenAccent
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0;

    if (progress > 0) {
      canvas.drawArc(
        Rect.fromLTWH(0, 0, size.width, size.height),
        -math.pi / 2,
        2 * math.pi * progress,
        false,
        circlePaint,
      );
    }

    // Checkmark path
    final paint = Paint()
      ..color = Colors.greenAccent
      ..style = PaintingStyle.stroke
      ..strokeWidth = 5.5
      ..strokeCap = StrokeCap.round;

    final path = Path();
    final startX = size.width * 0.28;
    final startY = size.height * 0.52;
    final midX = size.width * 0.44;
    final midY = size.height * 0.68;
    final endX = size.width * 0.72;
    final endY = size.height * 0.36;

    path.moveTo(startX, startY);

    if (progress <= 0.45) {
      final t = progress / 0.45;
      final currentX = startX + (midX - startX) * t;
      final currentY = startY + (midY - startY) * t;
      path.lineTo(currentX, currentY);
    } else {
      path.lineTo(midX, midY);
      final t = (progress - 0.45) / 0.55;
      final currentX = midX + (endX - midX) * t;
      final currentY = midY + (endY - midY) * t;
      path.lineTo(currentX, currentY);
    }

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant _CheckmarkPainter oldDelegate) {
    return oldDelegate.progress != progress;
  }
}

// ─────────────────────────────────────────────
//  Scanner HUD Custom Painter
// ─────────────────────────────────────────────

class ScannerHUDPainter extends CustomPainter {
  final double cutoutSize;
  final ScanResultState resultState;
  final double pulseValue;

  ScannerHUDPainter({
    required this.cutoutSize,
    required this.resultState,
    required this.pulseValue,
    super.repaint,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final double width = size.width;
    final double height = size.height;

    final double left = (width - cutoutSize) / 2;
    final double top = (height - cutoutSize) / 2;
    final double right = left + cutoutSize;
    final double bottom = top + cutoutSize;

    // Dark outer mask with smooth opacity
    final maskPaint = Paint()..color = Colors.black.withValues(alpha: 0.68);

    final maskPath = Path()
      ..moveTo(0, 0)
      ..lineTo(width, 0)
      ..lineTo(width, height)
      ..lineTo(0, height)
      ..close();

    final cutoutPath = Path()
      ..addRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTRB(left, top, right, bottom),
          const Radius.circular(28),
        ),
      );

    final finalMaskPath = Path.combine(
      PathOperation.difference,
      maskPath,
      cutoutPath,
    );
    canvas.drawPath(finalMaskPath, maskPaint);

    // Color definitions
    final Color primaryColor = resultState == ScanResultState.success
        ? Colors.greenAccent
        : resultState == ScanResultState.error
            ? Colors.redAccent
            : Colors.cyanAccent;

    // Outer subtle border
    final thinBorderPaint = Paint()
      ..color = primaryColor.withValues(alpha: 0.2 + (0.15 * pulseValue))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5;

    canvas.drawRRect(
      RRect.fromRectAndRadius(
        Rect.fromLTRB(left, top, right, bottom),
        const Radius.circular(28),
      ),
      thinBorderPaint,
    );

    // Heavy cyber corner brackets
    final bracketPaint = Paint()
      ..color = primaryColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = 4.0
      ..strokeCap = StrokeCap.round;

    const double bracketLength = 28.0;
    const double radius = 28.0;

    // Top-Left corner
    canvas.drawPath(
      Path()
        ..moveTo(left, top + bracketLength)
        ..lineTo(left, top + radius)
        ..arcToPoint(
          Offset(left + radius, top),
          radius: const Radius.circular(radius),
        )
        ..lineTo(left + bracketLength, top),
      bracketPaint,
    );

    // Top-Right corner
    canvas.drawPath(
      Path()
        ..moveTo(right - bracketLength, top)
        ..lineTo(right - radius, top)
        ..arcToPoint(
          Offset(right, top + radius),
          radius: const Radius.circular(radius),
        )
        ..lineTo(right, top + bracketLength),
      bracketPaint,
    );

    // Bottom-Left corner
    canvas.drawPath(
      Path()
        ..moveTo(left, bottom - bracketLength)
        ..lineTo(left, bottom - radius)
        ..arcToPoint(
          Offset(left + radius, bottom),
          radius: const Radius.circular(radius),
          rotation: 90,
          clockwise: false,
        )
        ..lineTo(left + bracketLength, bottom),
      bracketPaint,
    );

    // Bottom-Right corner
    canvas.drawPath(
      Path()
        ..moveTo(right - bracketLength, bottom)
        ..lineTo(right - radius, bottom)
        ..arcToPoint(
          Offset(right, bottom - radius),
          radius: const Radius.circular(radius),
        )
        ..lineTo(right, bottom - bracketLength),
      bracketPaint,
    );

    // Corner decorative indicator pips
    final pipPaint = Paint()..color = primaryColor;
    const double pipRadius = 2.5;

    canvas.drawCircle(Offset(left + bracketLength + 6, top), pipRadius, pipPaint);
    canvas.drawCircle(Offset(right - bracketLength - 6, top), pipRadius, pipPaint);
    canvas.drawCircle(Offset(left + bracketLength + 6, bottom), pipRadius, pipPaint);
    canvas.drawCircle(Offset(right - bracketLength - 6, bottom), pipRadius, pipPaint);

    // Side measurement tick marks
    final tickPaint = Paint()
      ..color = primaryColor.withValues(alpha: 0.4)
      ..strokeWidth = 1.5;

    final double centerY = (top + bottom) / 2;
    for (int i = -2; i <= 2; i++) {
      final double y = centerY + (i * 18.0);
      final double tickWidth = (i == 0) ? 8.0 : 4.0;
      canvas.drawLine(Offset(left - tickWidth - 4, y), Offset(left - 4, y), tickPaint);
      canvas.drawLine(Offset(right + 4, y), Offset(right + tickWidth + 4, y), tickPaint);
    }
  }

  @override
  bool shouldRepaint(covariant ScannerHUDPainter oldDelegate) {
    return oldDelegate.cutoutSize != cutoutSize ||
        oldDelegate.resultState != resultState ||
        oldDelegate.pulseValue != pulseValue;
  }
}
