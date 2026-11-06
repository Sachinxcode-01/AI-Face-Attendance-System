/*
|--------------------------------------------------------------------------
| File: qr_generator_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Generates a dynamic, high-security rotating QR code for faculty/teachers
| to display in the classroom.
|
| Responsibilities:
| - Registers and starts active teacher class sessions via ApiService.
| - Generates rotating QR payloads encoded with session IDs and timestamps.
| - Rotates the QR token hash every 15 seconds to prevent student sharing/fraud.
| - Displays fluid countdown telemetry, danger pulse alerts, and copy actions.
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

// ======================================================
// Core & Service Imports
// ======================================================
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

/// Screen widget for teachers to generate class attendance QR tokens.
class QRGeneratorScreen extends StatefulWidget {
  const QRGeneratorScreen({super.key});

  @override
  State<QRGeneratorScreen> createState() => _QRGeneratorScreenState();
}

class _QRGeneratorScreenState extends State<QRGeneratorScreen> {
  String _qrData = 'INITIALIZING...';
  String? _sessionId;
  String _subject = 'Advanced AI';
  Timer? _timer;
  int _secondsRemaining = 15;
  bool _isInitializing = true;
  bool _isGenerating = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _initSession());
  }

  Future<void> _initSession() async {
    final session = context.read<SessionManager>();
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    final teacherEmail =
        args?['email'] ?? session.email ?? 'teacher@smartface.elite';
    _subject = args?['subject'] ?? 'Advanced AI';

    final result = await ApiService.startSession(
      teacherEmail,
      _subject,
      session.token,
    );
    if (mounted) {
      if (result.containsKey('session_id')) {
        setState(() {
          _sessionId = result['session_id'];
          _isInitializing = false;
        });
        await _generateNewQR(isInitial: true);
        if (!mounted) return;
        _startTimer();
        context.showSuccessToast(
          'Attendance session started for $_subject',
          title: 'Session Live',
        );
      } else {
        setState(() {
          _qrData = 'ERROR: SESSION FAILED';
          _isInitializing = false;
        });
        context.showErrorToast(
          'Failed to initialize classroom attendance session.',
          title: 'Session Error',
        );
      }
    }
  }

  Future<void> _generateNewQR({bool isInitial = false}) async {
    if (_sessionId == null || _isGenerating) return;
    _isGenerating = true;
    try {
      final session = context.read<SessionManager>();
      final issued = await ApiService.getSessionQrToken(
        _sessionId!,
        session.token,
      );
      final token = issued['token'];
      if (token is! String || token.isEmpty) throw const FormatException();
      if (!mounted) return;
      setState(() {
        _qrData = jsonEncode({
          'session_id': _sessionId,
          'token': token,
          'type': 'attendance_qr',
        });
        _secondsRemaining = 15;
      });
      if (!isInitial) AppHaptics.light();
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _qrData = 'ERROR: QR TOKEN UNAVAILABLE';
        _secondsRemaining = 0;
      });
      context.showErrorToast(
        'Could not refresh the secure QR code.',
        title: 'QR Error',
      );
    } finally {
      _isGenerating = false;
    }
  }

  void _startTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted) return;
      if (_secondsRemaining > 1) {
        setState(() => _secondsRemaining--);
      } else {
        _generateNewQR();
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Color get _timerColor {
    if (_secondsRemaining > 6) {
      return AppColors.goldLight;
    } else if (_secondsRemaining > 2) {
      return AppColors.warning;
    } else {
      return AppColors.error;
    }
  }

  void _copySessionCode() {
    if (_sessionId == null) return;
    Clipboard.setData(ClipboardData(text: _sessionId!));
    context.showSuccessToast(
      'Session ID copied to clipboard: $_sessionId',
      title: 'Copied',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: const PremiumAppBar(title: 'Dynamic Attendance QR'),
      body: PremiumScaffold(
        child: _isInitializing
            ? Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const PulseGlow(
                      glowColor: AppColors.gold,
                      child: SizedBox(
                        width: 48,
                        height: 48,
                        child: CircularProgressIndicator(
                          valueColor: AlwaysStoppedAnimation<Color>(
                            AppColors.gold,
                          ),
                          strokeWidth: 3,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Initializing Biometric Gateway...',
                      style: GoogleFonts.inter(
                        color: Colors.white70,
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              )
            : SafeArea(
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 16,
                  ),
                  child: Column(
                    children: [
                      // Active Session Indicator Pill
                      PulseGlow(
                        glowColor: AppColors.success,
                        maxBlur: 14,
                        maxSpread: 2,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: AppColors.success.withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(99),
                            border: Border.all(
                              color: AppColors.success.withValues(alpha: 0.4),
                              width: 1.2,
                            ),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Container(
                                width: 8,
                                height: 8,
                                decoration: const BoxDecoration(
                                  color: AppColors.success,
                                  shape: BoxShape.circle,
                                ),
                              ),
                              const SizedBox(width: 8),
                              Text(
                                'SESSION ACTIVE: $_subject',
                                style: GoogleFonts.inter(
                                  color: AppColors.successLight,
                                  fontSize: 12,
                                  letterSpacing: 1.2,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 28),

                      // Rotating QR Card with Ambient Glow
                      Center(
                        child: Container(
                          padding: const EdgeInsets.all(22),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(28),
                            border: Border.all(
                              color: const Color(
                                0xFFFFD700,
                              ).withValues(alpha: 0.4),
                              width: 2,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: _timerColor.withValues(alpha: 0.25),
                                blurRadius: 36,
                                spreadRadius: 2,
                                offset: const Offset(0, 8),
                              ),
                              BoxShadow(
                                color: Colors.black.withValues(alpha: 0.5),
                                blurRadius: 20,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: SmoothAnimatedSwitcher(
                            duration: const Duration(milliseconds: 350),
                            child: QrImageView(
                              key: ValueKey(_qrData),
                              data: _qrData,
                              version: QrVersions.auto,
                              size: 240.0,
                              gapless: false,
                              backgroundColor: Colors.white,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 32),

                      // Countdown Ring & Label
                      Stack(
                        alignment: Alignment.center,
                        children: [
                          SizedBox(
                            height: 84,
                            width: 84,
                            child: TweenAnimationBuilder<double>(
                              tween: Tween<double>(
                                begin: 0.0,
                                end: _secondsRemaining / 15.0,
                              ),
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeOut,
                              builder: (context, value, _) {
                                return CircularProgressIndicator(
                                  value: value,
                                  strokeWidth: 7,
                                  strokeCap: StrokeCap.round,
                                  backgroundColor: Colors.white.withValues(
                                    alpha: 0.08,
                                  ),
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    _timerColor,
                                  ),
                                );
                              },
                            ),
                          ),
                          Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                '$_secondsRemaining',
                                style: GoogleFonts.inter(
                                  fontSize: 26,
                                  fontWeight: FontWeight.bold,
                                  color: _timerColor,
                                ),
                              ),
                              Text(
                                'SEC',
                                style: GoogleFonts.inter(
                                  fontSize: 9,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white54,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),

                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.shield_outlined,
                            size: 14,
                            color: Colors.white.withValues(alpha: 0.45),
                          ),
                          const SizedBox(width: 6),
                          Text(
                            'ANTI-PROXY: ROTATES EVERY 15 SECONDS',
                            style: GoogleFonts.inter(
                              color: Colors.white54,
                              fontSize: 11,
                              letterSpacing: 1.1,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 36),

                      // Quick Action Buttons
                      Row(
                        children: [
                          Expanded(
                            child: PremiumButton.glass(
                              onPressed: _copySessionCode,
                              leadingIcon: const Icon(
                                Icons.copy_rounded,
                                size: 18,
                                color: Colors.white,
                              ),
                              child: const Text('Copy Session ID'),
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: PremiumButton(
                              onPressed: () => _generateNewQR(),
                              leadingIcon: const Icon(
                                Icons.refresh_rounded,
                                size: 18,
                                color: Colors.black,
                              ),
                              child: const Text('Rotate Token'),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                    ],
                  ),
                ),
              ),
      ),
    );
  }
}
