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
|
| Dependencies:
| - package:flutter/material.dart
| - package:qr_flutter/qr_flutter.dart
| - package:flutter_animate/flutter_animate.dart
| - package:google_fonts/google_fonts.dart
| - package:provider/provider.dart
| - package:smartface_attendance/core/state/session_manager.dart
| - package:smartface_attendance/data/services/api_service.dart
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'dart:async';
import 'dart:convert';
import 'package:flutter_animate/flutter_animate.dart';
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
  Timer? _timer;
  int _secondsRemaining = 15;
  bool _isInitializing = true;

  @override
  void initState() {
    super.initState();
    _initSession();
  }

  Future<void> _initSession() async {
    final session = context.read<SessionManager>();
    final args = ModalRoute.of(context)?.settings.arguments as Map?;
    final teacherEmail =
        args?['email'] ?? session.email ?? 'teacher@smartface.elite';
    final subject = args?['subject'] ?? 'Advanced AI';

    final result = await ApiService.startSession(teacherEmail, subject);
    if (result.containsKey('session_id')) {
      setState(() {
        _sessionId = result['session_id'];
        _isInitializing = false;
        _generateNewQR();
        _startTimer();
      });
    } else {
      setState(() {
        _qrData = 'ERROR: SESSION FAILED';
        _isInitializing = false;
      });
    }
  }

  void _generateNewQR() {
    if (_sessionId == null) return;
    setState(() {
      final token = DateTime.now().millisecondsSinceEpoch.toString();
      _qrData = jsonEncode({
        'session_id': _sessionId,
        'token': token,
        'type': 'attendance_qr',
      });
      _secondsRemaining = 15;
    });
  }

  void _startTimer() {
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 0) {
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

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0E21),
      appBar: const PremiumAppBar(title: 'Dynamic Attendance QR'),
      body: _isInitializing
          ? const Center(
              child: CircularProgressIndicator(color: Color(0xFFFFD700)),
            )
          : Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                        'SESSION ACTIVE',
                        style: GoogleFonts.inter(
                          color: Colors.greenAccent,
                          letterSpacing: 3,
                          fontWeight: FontWeight.bold,
                        ),
                      )
                      .animate(onPlay: (c) => c.repeat())
                      .shimmer(duration: 2.seconds),
                  const SizedBox(height: 40),

                  // --- THE ROTATING QR CODE ---
                  Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(30),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(
                                0xFFFFD700,
                              ).withValues(alpha: 0.3),
                              blurRadius: 40,
                              spreadRadius: 5,
                            ),
                          ],
                        ),
                        child: QrImageView(
                          data: _qrData,
                          version: QrVersions.auto,
                          size: 250.0,
                          gapless: false,
                        ),
                      )
                      .animate(key: ValueKey(_qrData))
                      .scale(duration: 400.ms, curve: Curves.easeOutBack)
                      .fadeIn(),

                  const SizedBox(height: 50),

                  // --- PROGRESS CIRCLE ---
                  Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        height: 80,
                        width: 80,
                        child: CircularProgressIndicator(
                          value: _secondsRemaining / 15,
                          strokeWidth: 8,
                          backgroundColor: Colors.white10,
                          valueColor: const AlwaysStoppedAnimation<Color>(
                            Color(0xFFFFD700),
                          ),
                        ),
                      ),
                      Text(
                        '$_secondsRemaining',
                        style: GoogleFonts.inter(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 30),
                  const Text(
                    'QR ROTATES EVERY 15 SECONDS FOR SECURITY',
                    style: TextStyle(
                      color: Colors.white38,
                      fontSize: 10,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
