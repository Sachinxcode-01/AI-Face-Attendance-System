import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:convert';
import 'package:provider/provider.dart';
import '../../core/session_manager.dart';
import '../../services/api_service.dart';
import '../../core/constants.dart';

class QRScannerScreen extends StatefulWidget {
  const QRScannerScreen({super.key});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  bool _isScanning = true;

  void _onDetect(BarcodeCapture capture) {
    if (!_isScanning) return;

    final List<Barcode> barcodes = capture.barcodes;
    if (barcodes.isNotEmpty) {
      final String? code = barcodes.first.rawValue;
      if (code != null) {
        setState(() => _isScanning = false);
        _handleAttendance(code);
      }
    }
  }

  Future<void> _handleAttendance(String qrData) async {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => const Center(
        child: CircularProgressIndicator(color: Color(0xFFFFD700)),
      ),
    );

    try {
      final decoded = jsonDecode(qrData);
      final sessionId = decoded['session_id'];
      final token = decoded['token'];

      final session = context.read<SessionManager>();
      final args = ModalRoute.of(context)?.settings.arguments as Map?;
      final studentEmail =
          args?['email'] ?? session.email ?? 'student@smartface.elite';

      final result = await ApiService.markAttendance(
        studentEmail,
        sessionId,
        token,
        session.token,
      );

      if (!mounted) return;
      Navigator.pop(context); // Close loading dialog

      bool success = result.containsKey('message');
      String message = success
          ? 'Your attendance has been verified and logged.'
          : (result['detail'] ?? 'Verification failed');

      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
          backgroundColor: AppColors.bgModal,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: BorderSide(
              color: AppColors.gold.withValues(alpha: 0.15),
              width: 1.5,
            ),
          ),
          title: Row(
            children: [
              Icon(
                success
                    ? Icons.check_circle_rounded
                    : Icons.error_outline_rounded,
                color: success ? AppColors.success : AppColors.error,
                size: 26,
              ),
              const SizedBox(width: 12),
              Text(
                success ? 'VALIDATED ✓' : 'VERIFICATION FAILED',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  letterSpacing: 0.5,
                ),
              ),
            ],
          ),
          content: Text(
            message,
            style: GoogleFonts.inter(
              color: Colors.white70,
              fontSize: 13,
              height: 1.4,
            ),
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(context); // Close dialog
                if (success) {
                  Navigator.pop(context); // Go back to dashboard
                } else {
                  setState(() => _isScanning = true); // Resume scanning
                }
              },
              child: Text(
                'DISMISS',
                style: GoogleFonts.inter(
                  color: AppColors.gold,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1,
                ),
              ),
            ),
          ],
        ),
      );
    } catch (e) {
      if (!mounted) return;
      Navigator.pop(context); // Close loading dialog
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Invalid QR Code Format')));
      setState(() => _isScanning = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          MobileScanner(onDetect: _onDetect),

          // Overlay
          BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 3.0, sigmaY: 3.0),
            child: Container(
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.5),
              ),
              child: Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      width: 250,
                      height: 250,
                      decoration: BoxDecoration(
                        border: Border.all(
                          color: AppColors.gold.withValues(alpha: 0.6),
                          width: 2,
                        ),
                        borderRadius: BorderRadius.circular(30),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.gold.withValues(alpha: 0.08),
                            blurRadius: 20,
                            spreadRadius: 2,
                          ),
                        ],
                      ),
                      child: Stack(
                        children: [
                          // Glowing Laser Scanning animation line
                          Positioned(
                            top: 0,
                            left: 0,
                            right: 0,
                            child:
                                Container(
                                      height: 4,
                                      decoration: BoxDecoration(
                                        gradient: LinearGradient(
                                          colors: [
                                            AppColors.gold.withValues(
                                              alpha: 0.0,
                                            ),
                                            AppColors.gold,
                                            AppColors.gold.withValues(
                                              alpha: 0.0,
                                            ),
                                          ],
                                        ),
                                        boxShadow: [
                                          BoxShadow(
                                            color: AppColors.gold.withValues(
                                              alpha: 0.6,
                                            ),
                                            blurRadius: 10,
                                            spreadRadius: 1.5,
                                          ),
                                        ],
                                      ),
                                    )
                                    .animate(onPlay: (c) => c.repeat())
                                    .moveY(
                                      begin: 0,
                                      end: 250,
                                      duration: 2.seconds,
                                      curve: Curves.easeInOut,
                                    ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 40),
                    Text(
                          'ALIGN WITH TEACHER\'S QR',
                          style: GoogleFonts.inter(
                            color: AppColors.gold,
                            letterSpacing: 2,
                            fontWeight: FontWeight.bold,
                          ),
                        )
                        .animate(onPlay: (c) => c.repeat(reverse: true))
                        .shimmer(duration: 2.seconds),
                  ],
                ),
              ),
            ),
          ),

          // Back button
          Positioned(
            top: 50,
            left: 20,
            child: IconButton(
              icon: const Icon(Icons.arrow_back_ios, color: Colors.white),
              onPressed: () => Navigator.pop(context),
            ),
          ),
        ],
      ),
    );
  }
}
