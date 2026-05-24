import 'dart:async';
import 'dart:convert';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:qr_flutter/qr_flutter.dart';

class QRGeneratorScreen extends StatefulWidget {
  const QRGeneratorScreen({super.key});

  @override
  State<QRGeneratorScreen> createState() => _QRGeneratorScreenState();
}

class _QRGeneratorScreenState extends State<QRGeneratorScreen> {
  String _qrData = '';
  late Timer _timer;
  int _counter = 0;
  final String _sessionId = 'session_${DateTime.now().millisecondsSinceEpoch}';

  @override
  void initState() {
    super.initState();
    _generateQRData();
    _timer = Timer.periodic(const Duration(seconds: 10), (timer) {
      _generateQRData();
    });
  }

  void _generateQRData() {
    setState(() {
      _counter++;
      _qrData = jsonEncode({
        'session_id': _sessionId,
        'token': 'token_${DateTime.now().millisecondsSinceEpoch}_$_counter',
        'timestamp': DateTime.now().toIso8601String(),
      });
    });
  }

  @override
  void dispose() {
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0A0E21), Color(0xFF1D2671)],
        ),
        image: DecorationImage(
          image: const NetworkImage(
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
          ),
          fit: BoxFit.cover,
          colorFilter: ColorFilter.mode(
            Colors.black.withValues(alpha: 0.15),
            BlendMode.dstATop,
          ),
        ),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: Text(
            'Live Session QR',
            style: GoogleFonts.inter(fontWeight: FontWeight.bold),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'STUDENT ATTENDANCE SCAN',
                style: GoogleFonts.inter(
                  color: const Color(0xFFFFD700),
                  letterSpacing: 2,
                  fontWeight: FontWeight.bold,
                  fontSize: 14,
                ),
              ).animate().fadeIn().slideY(begin: -0.2),
              const SizedBox(height: 10),
              Text(
                'Code refreshes every 10 seconds to prevent sharing',
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.5),
                  fontSize: 12,
                ),
              ).animate().fadeIn(delay: 200.ms),
              const SizedBox(height: 40),

              // Glassmorphic QR Container
              ClipRRect(
                borderRadius: BorderRadius.circular(30),
                child: BackdropFilter(
                  filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
                  child:
                      Container(
                            padding: const EdgeInsets.all(25),
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(30),
                              border: Border.all(
                                color: const Color(
                                  0xFFFFD700,
                                ).withValues(alpha: 0.5),
                                width: 2,
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: const Color(
                                    0xFFFFD700,
                                  ).withValues(alpha: 0.1),
                                  blurRadius: 30,
                                  spreadRadius: 5,
                                ),
                              ],
                            ),
                            child: Container(
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(15),
                              ),
                              padding: const EdgeInsets.all(10),
                              child: QrImageView(
                                data: _qrData,
                                version: QrVersions.auto,
                                size: 250.0,
                                backgroundColor: Colors.white,
                              ),
                            ),
                          )
                          .animate(key: ValueKey(_qrData))
                          .scale(duration: 300.ms, curve: Curves.easeOutBack),
                ),
              ).animate().fadeIn(delay: 400.ms),

              const SizedBox(height: 50),
              ElevatedButton.icon(
                onPressed: () => Navigator.pop(context),
                icon: const Icon(
                  Icons.stop_circle_outlined,
                  color: Colors.black,
                ),
                label: const Text(
                  'END SESSION',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: Colors.black,
                    letterSpacing: 1,
                  ),
                ),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFFFD700),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 40,
                    vertical: 15,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(20),
                  ),
                ),
              ).animate().fadeIn(delay: 600.ms).slideY(begin: 0.2),
            ],
          ),
        ),
      ),
    );
  }
}
