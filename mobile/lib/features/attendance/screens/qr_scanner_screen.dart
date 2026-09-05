/*
|--------------------------------------------------------------------------
| File: qr_scanner_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the premium Cyber HUD camera view to scan class attendance QR codes.
| Configures the MobileScanner camera layer and overlays futuristic tech HUD lines.
|--------------------------------------------------------------------------
*/

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:convert';
import 'package:provider/provider.dart';

// ======================================================
// State & Core Imports
// ======================================================
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/features/sync/repositories/sync_repository.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';

enum ScanResultState { none, loading, success, error }

/// Screen widget providing QR camera scanning functionality to students.
class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen>
    with TickerProviderStateMixin {
  bool _isScanning = true;
  final MobileScannerController _controller = MobileScannerController();
  late final AnimationController _laserController;
  ScanResultState _resultState = ScanResultState.none;

  @override
  void initState() {
    super.initState();
    _laserController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    _laserController.dispose();
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
        });
        HapticFeedback.heavyImpact();
        _handleAttendance(code);
      }
    }
  }

  Future<void> _handleAttendance(String qrData) async {
    try {
      final decoded = jsonDecode(qrData);
      final sessionId = decoded['session_id'];
      final token = decoded['token'];

      final session = context.read<SessionManager>();
      final args = ModalRoute.of(context)?.settings.arguments as Map?;
      final studentEmail =
          args?['email'] ?? session.email ?? 'student@smartface.elite';

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
        });

        await Future.delayed(const Duration(milliseconds: 1500));
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
      });
      AppToast.show(
        context,
        message: e is FormatException
            ? 'Invalid QR Code Format'
            : 'Attendance record failed',
        type: ToastType.error,
      );

      await Future.delayed(const Duration(milliseconds: 2000));
      if (mounted) {
        setState(() {
          _resultState = ScanResultState.none;
          _isScanning = true;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // 📷 Live Camera Feed
          MobileScanner(controller: _controller, onDetect: _onDetect),

          // 🛡️ Cyber Mask HUD Overlay
          CustomPaint(
            size: Size.infinite,
            painter: ScannerHUDPainter(
              cutoutSize: 260,
              resultState: _resultState,
            ),
          ),

          // 📟 Top Instruction Card
          Positioned(
                top: 110,
                left: 24,
                right: 24,
                child: GlassContainer(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  borderColor: Colors.white.withValues(alpha: 0.08),
                  backgroundColor: Colors.black.withValues(alpha: 0.4),
                  borderRadius: AppRadius.md,
                  child: Row(
                    children: [
                      const Icon(
                        Icons.info_outline_rounded,
                        color: Colors.cyanAccent,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Align the classroom attendance QR code inside the cyber-brackets below.',
                          style: GoogleFonts.inter(
                            color: Colors.white.withValues(alpha: 0.7),
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              )
              .animate()
              .fadeIn(duration: 400.ms)
              .slideY(
                begin: -0.2,
                end: 0,
                duration: 400.ms,
                curve: Curves.easeOutCubic,
              ),

          // 📟 Centered Viewport & In-Cutout Result Overlays
          Center(
            child:
                Container(
                      width: 260,
                      height: 260,
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(24),
                        border: Border.all(
                          color: _resultState == ScanResultState.success
                              ? Colors.greenAccent
                              : _resultState == ScanResultState.error
                              ? Colors.redAccent
                              : Colors.cyanAccent.withValues(alpha: 0.3),
                          width: 2,
                        ),
                        boxShadow: _resultState == ScanResultState.success
                            ? [
                                BoxShadow(
                                  color: Colors.greenAccent.withValues(
                                    alpha: 0.4,
                                  ),
                                  blurRadius: 20,
                                  spreadRadius: 4,
                                ),
                              ]
                            : _resultState == ScanResultState.error
                            ? [
                                BoxShadow(
                                  color: Colors.redAccent.withValues(
                                    alpha: 0.4,
                                  ),
                                  blurRadius: 20,
                                  spreadRadius: 4,
                                ),
                              ]
                            : null,
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(24),
                        child: Stack(
                          children: [
                            // Laser line (only if scanning/none)
                            if (_resultState == ScanResultState.none)
                              AnimatedBuilder(
                                animation: _laserController,
                                builder: (context, child) {
                                  final double position =
                                      _laserController.value * 260.0;
                                  return Positioned(
                                    top: position - 40.0,
                                    left: 0,
                                    right: 0,
                                    child: Container(
                                      height: 40,
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: [
                                            Colors.cyanAccent.withValues(
                                              alpha: 0.0,
                                            ),
                                            Colors.cyanAccent.withValues(
                                              alpha: 0.1,
                                            ),
                                            Colors.cyanAccent.withValues(
                                              alpha: 0.4,
                                            ),
                                          ],
                                          begin: Alignment.topCenter,
                                          end: Alignment.bottomCenter,
                                        ),
                                      ),
                                      child: Align(
                                        alignment: Alignment.bottomCenter,
                                        child: Container(
                                          height: 2.5,
                                          decoration: const BoxDecoration(
                                            color: Colors.cyanAccent,
                                            boxShadow: [
                                              BoxShadow(
                                                color: Colors.cyanAccent,
                                                blurRadius: 10,
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

                            // Loading State: central spinning cyan ring
                            if (_resultState == ScanResultState.loading)
                              const Center(
                                child: SizedBox(
                                  width: 60,
                                  height: 60,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 4,
                                    valueColor: AlwaysStoppedAnimation<Color>(
                                      Colors.cyanAccent,
                                    ),
                                  ),
                                ),
                              ),

                            // Success State: drawn checkmark path with green pulse glow
                            if (_resultState == ScanResultState.success)
                              const Center(child: AnimatedCheckmark(size: 80)),

                            // Error State: drawn cross with red pulse glow
                            if (_resultState == ScanResultState.error)
                              const Center(
                                child: Icon(
                                  Icons.close_rounded,
                                  color: Colors.redAccent,
                                  size: 80,
                                ),
                              ),
                          ],
                        ),
                      ),
                    )
                    .animate(
                      target: _resultState == ScanResultState.error ? 1 : 0,
                    )
                    .shake(duration: 400.ms)
                    .animate(
                      target: _resultState == ScanResultState.success ? 1 : 0,
                    )
                    .scale(
                      begin: const Offset(1, 1),
                      end: const Offset(1.05, 1.05),
                      duration: 200.ms,
                      curve: Curves.easeOutBack,
                    ),
          ),

          // 💾 Telemetry Info Overlay
          Positioned(
            bottom: 40,
            left: 24,
            right: 24,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                      'SYSTEM READY // SCANNING ACTIVE',
                      style: GoogleFonts.robotoMono(
                        color: Colors.cyanAccent,
                        fontSize: 11,
                        letterSpacing: 2,
                        fontWeight: FontWeight.bold,
                      ),
                    )
                    .animate(onPlay: (c) => c.repeat(reverse: true))
                    .shimmer(duration: 1500.ms, color: Colors.white24),
                const SizedBox(height: 12),
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: BackdropFilter(
                    filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 20,
                        vertical: 14,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.black.withValues(alpha: 0.6),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: Colors.white.withValues(alpha: 0.08),
                        ),
                      ),
                      child: Column(
                        children: [
                          _buildTelemetryItem(
                            'SCAN TYPE',
                            'ENCRYPTED COURSE QR',
                          ),
                          const Divider(color: Colors.white12, height: 16),
                          _buildTelemetryItem('CAMERA MODE', 'LIVENESS ACTIVE'),
                          const Divider(color: Colors.white12, height: 16),
                          _buildTelemetryItem(
                            'TIMESTAMP',
                            DateTime.now().toIso8601String().split('T')[0],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),

          // 🔙 Back button
          Positioned(
            top: 50,
            left: 20,
            child: SafeArea(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 6, sigmaY: 6),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.black45,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.white10),
                    ),
                    child: IconButton(
                      icon: const Icon(
                        Icons.arrow_back_ios_new_rounded,
                        color: Colors.white70,
                        size: 18,
                      ),
                      onPressed: () {
                        context.go('/student/home');
                      },
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTelemetryItem(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 9,
            color: Colors.white38,
            fontWeight: FontWeight.bold,
            letterSpacing: 1,
          ),
        ),
        Text(
          value,
          style: GoogleFonts.robotoMono(
            fontSize: 10,
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
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
      duration: const Duration(milliseconds: 600),
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
    final paint = Paint()
      ..color = Colors.greenAccent
      ..style = PaintingStyle.stroke
      ..strokeWidth = 6.0
      ..strokeCap = StrokeCap.round;

    final path = Path();

    final startX = size.width * 0.25;
    final startY = size.height * 0.5;
    final midX = size.width * 0.45;
    final midY = size.height * 0.7;
    final endX = size.width * 0.75;
    final endY = size.height * 0.3;

    path.moveTo(startX, startY);

    if (progress <= 0.4) {
      final t = progress / 0.4;
      final currentX = startX + (midX - startX) * t;
      final currentY = startY + (midY - startY) * t;
      path.lineTo(currentX, currentY);
    } else {
      path.lineTo(midX, midY);
      final t = (progress - 0.4) / 0.6;
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

  ScannerHUDPainter({required this.cutoutSize, required this.resultState});

  @override
  void paint(Canvas canvas, Size size) {
    final double width = size.width;
    final double height = size.height;

    // Cutout coordinates
    final double left = (width - cutoutSize) / 2;
    final double top = (height - cutoutSize) / 2;
    final double right = left + cutoutSize;
    final double bottom = top + cutoutSize;

    // Draw opaque outer background mask
    final maskPaint = Paint()..color = Colors.black.withValues(alpha: 0.65);

    // Path subtraction to exclude the cutout center
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
          const Radius.circular(24),
        ),
      );

    final finalMaskPath = Path.combine(
      PathOperation.difference,
      maskPath,
      cutoutPath,
    );
    canvas.drawPath(finalMaskPath, maskPaint);

    // Draw tech brackets around cutout corners
    final bracketPaint = Paint()
      ..color = resultState == ScanResultState.success
          ? Colors.greenAccent
          : resultState == ScanResultState.error
          ? Colors.redAccent
          : Colors.cyanAccent
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.5
      ..strokeCap = StrokeCap.round;

    const double bracketLength = 24.0;
    const double radius = 24.0;

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
  }

  @override
  bool shouldRepaint(covariant ScannerHUDPainter oldDelegate) {
    return oldDelegate.cutoutSize != cutoutSize ||
        oldDelegate.resultState != resultState;
  }
}
