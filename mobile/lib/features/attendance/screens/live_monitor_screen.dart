/*
|--------------------------------------------------------------------------
| File: live_monitor_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the Live CCTV Portal / Surveillance screen for instructors.
| Connects to WebSocket streams to show real-time student check-ins, telemetry
| (camera FPS, scan rates), and intruder alerts.
|
| Responsibilities:
| - Connects to WebSocket via NotificationService.
| - Displays simulated camera feed with bounding boxes and scanner animation overlays.
| - Shows live validation feed of recent check-ins.
| - Presents risk model of absent students.
|
| Dependencies:
| - package:flutter/material.dart
| - package:flutter_animate/flutter_animate.dart
| - package:google_fonts/google_fonts.dart
| - package:provider/provider.dart
| - package:smartface_attendance/core/constants.dart
| - package:smartface_attendance/core/state/session_manager.dart
| - package:smartface_attendance/data/services/notification_service.dart
|--------------------------------------------------------------------------
*/

// ======================================================
// Standard Library Imports
// ======================================================
import 'dart:async';
import 'dart:math' as math;

// ======================================================
// External Packages
// ======================================================
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

// ======================================================
// Core & State Management
// ======================================================
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';

// ======================================================
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/core/services/notification_service.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

/// Screen displaying a simulated live CCTV monitor HUD with real-time face scanner tracking.
class LiveMonitorScreen extends StatefulWidget {
  const LiveMonitorScreen({super.key});

  @override
  State<LiveMonitorScreen> createState() => _LiveMonitorScreenState();
}

class _LiveMonitorScreenState extends State<LiveMonitorScreen> {
  final NotificationService _notificationService = sl<NotificationService>();
  StreamSubscription? _subscription;
  Timer? _fpsTimer;

  bool _isIntruderAlertActive = false;
  int _presentCount = 14;
  int _aiDetectedCount = 12;
  double _mockFps = 15.0;
  double _mockScanRate = 1.1;
  String _selectedClass = 'CS-402: Neural Networks';

  final List<Map<String, dynamic>> _recentCheckins = [
    {
      'name': 'ALEX CARTER',
      'roll': 'STU-104',
      'time': '09:02 AM',
      'confidence': '98.5%',
      'status': 'Present',
    },
    {
      'name': 'SOPHIA LI',
      'roll': 'STU-112',
      'time': '09:04 AM',
      'confidence': '96.2%',
      'status': 'Present',
    },
    {
      'name': 'LIAM NEESON',
      'roll': 'STU-242',
      'time': '09:05 AM',
      'confidence': '95.8%',
      'status': 'Present',
    },
  ];

  final List<Map<String, String>> _absentees = [
    {'name': 'James Wilson', 'id': 'STU-992', 'risk': 'High'},
    {'name': 'Emily Chen', 'id': 'STU-104', 'risk': 'Medium'},
    {'name': 'Marcus Miller', 'id': 'STU-552', 'risk': 'Low'},
  ];

  @override
  void initState() {
    super.initState();
    final session = Provider.of<SessionManager>(context, listen: false);

    // Connect WebSockets
    _notificationService.connect(token: session.token);
    _subscription = _notificationService.stream.listen((data) {
      if (data['type'] == 'attendance_update') {
        if (mounted) {
          setState(() {
            _presentCount++;
            _aiDetectedCount++;
            _recentCheckins.insert(0, {
              'name': data['student_email']
                  .toString()
                  .split('@')
                  .first
                  .toUpperCase(),
              'roll': 'STU-${math.Random().nextInt(800) + 100}',
              'time': 'Just now',
              'confidence':
                  '${(92.0 + math.Random().nextDouble() * 7.5).toStringAsFixed(1)}%',
              'status': 'Present',
            });
            if (_recentCheckins.length > 8) {
              _recentCheckins.removeLast();
            }
          });
        }
      } else if (data['type'] == 'intruder_alert') {
        if (mounted) {
          setState(() => _isIntruderAlertActive = true);
        }
      }
    });

    // Fluctuating FPS and scan rate telemetry simulation
    _fpsTimer = Timer.periodic(const Duration(seconds: 2), (timer) {
      if (mounted) {
        setState(() {
          _mockFps = 14.2 + math.Random().nextDouble() * 1.5;
          _mockScanRate = 0.9 + math.Random().nextDouble() * 0.4;
        });
      }
    });
  }

  @override
  void dispose() {
    _subscription?.cancel();
    _fpsTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AuroraBackground(
      baseColor: AppColors.bgDark,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: PremiumAppBar(
          title: 'Live CCTV Portal',
          leading: IconButton(
            icon: const Icon(
              Icons.arrow_back_ios_new_rounded,
              color: Colors.white,
            ),
            onPressed: () => Navigator.pop(context),
          ),
          actions: [_buildIntruderBadge()],
        ),
        body: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildClassPickerRow(),
              const SizedBox(height: 15),
              _buildLiveFeedHUD(),
              const SizedBox(height: 20),
              _buildHardwareStats(),
              const SizedBox(height: 25),

              Text(
                'REAL-TIME SCANNER VERIFICATION FEED',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  letterSpacing: 2,
                  color: Colors.greenAccent,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 15),
              _buildLiveScansFeed(),
              const SizedBox(height: 25),

              _buildAbsenteeList(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildClassPickerRow() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: AppColors.bgDeep.withValues(alpha: 0.6),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.gold.withValues(alpha: 0.2)),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedClass,
                dropdownColor: const Color(0xFF070B1A),
                icon: const Icon(
                  Icons.keyboard_arrow_down_rounded,
                  color: AppColors.gold,
                ),
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
                onChanged: (val) {
                  if (val != null) {
                    setState(() => _selectedClass = val);
                  }
                },
                items: ['CS-402: Neural Networks', 'CS-301: Data Structures']
                    .map((cl) {
                      return DropdownMenuItem<String>(
                        value: cl,
                        child: Text(cl),
                      );
                    })
                    .toList(),
              ),
            ),
          ),
        ),
        const SizedBox(width: 15),
        IconButton(
          onPressed: () {
            setState(() {
              _isIntruderAlertActive = false;
            });
          },
          icon: const Icon(Icons.refresh_rounded, color: AppColors.gold),
        ),
      ],
    );
  }

  Widget _buildIntruderBadge() {
    return Container(
          margin: const EdgeInsets.only(right: 16, top: 8, bottom: 8),
          child: Chip(
            avatar: Icon(
              Icons.security,
              color: _isIntruderAlertActive ? Colors.white : Colors.greenAccent,
              size: 14,
            ),
            label: Text(
              _isIntruderAlertActive ? 'INTRUDER DETECTED' : 'SECURE',
              style: TextStyle(
                color: _isIntruderAlertActive
                    ? Colors.white
                    : Colors.greenAccent,
                fontWeight: FontWeight.bold,
                fontSize: 9,
              ),
            ),
            backgroundColor: _isIntruderAlertActive
                ? AppColors.error
                : Colors.white.withValues(alpha: 0.05),
          ),
        )
        .animate(target: _isIntruderAlertActive ? 1 : 0)
        .shimmer(duration: 1.seconds);
  }

  Widget _buildLiveFeedHUD() {
    return Container(
      height: 250,
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.black,
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: Colors.white10),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.5),
            blurRadius: 20,
            spreadRadius: 5,
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(30),
        child: Stack(
          children: [
            // Dark futuristic surveillance grid placeholder
            Positioned.fill(
              child: Image.network(
                'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&q=80',
                fit: BoxFit.cover,
                color: Colors.black.withValues(alpha: 0.5),
                colorBlendMode: BlendMode.srcOver,
              ),
            ),

            // Surveillance scanning grid line animation
            Positioned.fill(
              child: CustomPaint(painter: SurveillanceOverlayPainter()),
            ),

            // Scanning Overlay Laser line
            Positioned.fill(
              child:
                  Container(
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              Colors.transparent,
                              Color(0x2000FFCC),
                              Colors.transparent,
                            ],
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                          ),
                        ),
                      )
                      .animate(onPlay: (c) => c.repeat())
                      .slideY(begin: -1, end: 1, duration: 3.seconds),
            ),

            // Bounding boxes simulating face identification
            Positioned(
              top: 50,
              left: 60,
              child: _buildSurveillanceFaceBox('Alex STU-104', '98.5%'),
            ),
            Positioned(
              top: 100,
              right: 80,
              child: _buildSurveillanceFaceBox('Sophia STU-112', '96.2%'),
            ),

            Positioned(
              top: 20,
              left: 20,
              child: Row(
                children: [
                  Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                      )
                      .animate(onPlay: (c) => c.repeat())
                      .fadeOut(duration: 1.seconds),
                  const SizedBox(width: 8),
                  const Text(
                    'REC FEED',
                    style: TextStyle(
                      color: Colors.white70,
                      fontWeight: FontWeight.bold,
                      fontSize: 10,
                      letterSpacing: 1,
                    ),
                  ),
                ],
              ),
            ),

            Positioned(
              bottom: 20,
              left: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'SCANRATE: ${_mockScanRate.toStringAsFixed(2)}s',
                  style: GoogleFonts.robotoMono(
                    color: AppColors.warning,
                    fontSize: 9,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),

            Positioned(
              bottom: 20,
              right: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 4,
                ),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.7),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Text(
                  'CAM_01: CS HALLWAY',
                  style: TextStyle(color: Colors.white70, fontSize: 9),
                ),
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn().scale(begin: const Offset(0.98, 0.98));
  }

  Widget _buildSurveillanceFaceBox(String label, String conf) {
    return Column(
      children: [
        Container(
          width: 50,
          height: 50,
          decoration: BoxDecoration(
            border: Border.all(color: AppColors.success, width: 1.5),
            color: const Color(0x1000FFCC),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [_hudCorner(), _hudCorner()],
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [_hudCorner(), _hudCorner()],
              ),
            ],
          ),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
          color: Colors.black87,
          child: Text(
            '$label ($conf)',
            style: const TextStyle(
              color: Color(0xFF00FFCC),
              fontSize: 7,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ],
    );
  }

  Widget _hudCorner() {
    return Container(width: 4, height: 4, color: AppColors.success);
  }

  Widget _buildHardwareStats() {
    return Row(
      children: [
        Expanded(
          child: _buildSurveillanceTelemetryBox(
            'CAMERA FPS',
            '${_mockFps.toStringAsFixed(1)} FPS',
            const Color(0xFF00C6FF),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildSurveillanceTelemetryBox(
            'PRESENTS',
            '$_presentCount STUDENTS',
            AppColors.warning,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildSurveillanceTelemetryBox(
            'AI MATCHED',
            '$_aiDetectedCount RECOGNITIONS',
            AppColors.gold,
          ),
        ),
      ],
    );
  }

  Widget _buildSurveillanceTelemetryBox(
    String label,
    String value,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: AppColors.bgDeep.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.15)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              color: Colors.white38,
              fontSize: 8,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: GoogleFonts.robotoMono(
              color: color,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLiveScansFeed() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.bgDeep.withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: ListView.separated(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: _recentCheckins.length,
        separatorBuilder: (context, index) =>
            Divider(color: Colors.white.withValues(alpha: 0.05), height: 16),
        itemBuilder: (context, index) {
          final scan = _recentCheckins[index];
          return Row(
            children: [
              CircleAvatar(
                backgroundColor: AppColors.warning.withValues(alpha: 0.1),
                radius: 18,
                child: const Icon(
                  Icons.person,
                  color: Color(0xFF76E600),
                  size: 18,
                ),
              ),
              const SizedBox(width: 15),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      scan['name'] ?? '',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Roll: ${scan['roll']} • Time: ${scan['time']}',
                      style: const TextStyle(
                        color: Colors.white38,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 3,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.1),
                      border: Border.all(
                        color: AppColors.success.withValues(alpha: 0.3),
                      ),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      'AI: ${scan['confidence']}',
                      style: GoogleFonts.robotoMono(
                        color: AppColors.success,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildAbsenteeList() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'AI ABSENTEE DETECTION & RISK MODEL',
              style: GoogleFonts.inter(
                fontSize: 10,
                letterSpacing: 2,
                color: AppColors.gold,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Icon(Icons.auto_awesome, color: AppColors.gold, size: 14),
          ],
        ),
        const SizedBox(height: 15),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: AppColors.bgDeep.withValues(alpha: 0.6),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          ),
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _absentees.length,
            separatorBuilder: (context, index) => Divider(
              color: Colors.white.withValues(alpha: 0.05),
              height: 16,
            ),
            itemBuilder: (context, index) {
              final student = _absentees[index];
              final riskColor = _getRiskColor(student['risk']!);
              return Row(
                children: [
                  CircleAvatar(
                    backgroundColor: Colors.white.withValues(alpha: 0.05),
                    radius: 18,
                    child: Text(
                      student['name']![0],
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  const SizedBox(width: 15),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          student['name']!,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          student['id']!,
                          style: const TextStyle(
                            color: Colors.white38,
                            fontSize: 10,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: riskColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: riskColor.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Text(
                      '${student['risk']} Risk',
                      style: TextStyle(
                        color: riskColor,
                        fontSize: 9,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              );
            },
          ),
        ),
      ],
    );
  }

  Color _getRiskColor(String risk) {
    switch (risk) {
      case 'High':
        return const Color(0xFFF05050);
      case 'Medium':
        return Colors.orangeAccent;
      default:
        return const Color(0xFF00C6FF);
    }
  }
}

class SurveillanceOverlayPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withValues(alpha: 0.03)
      ..strokeWidth = 1.0;

    // Draw surveillance grids
    const int numLines = 8;
    for (int i = 1; i < numLines; i++) {
      final double x = size.width * (i / numLines);
      canvas.drawLine(Offset(x, 0), Offset(x, size.height), paint);

      final double y = size.height * (i / numLines);
      canvas.drawLine(Offset(0, y), Offset(size.width, y), paint);
    }

    // Draw crosshair at the center
    final centerPaint = Paint()
      ..color = Colors.white24
      ..strokeWidth = 1.5;

    final Offset center = Offset(size.width / 2, size.height / 2);
    canvas.drawLine(
      Offset(center.dx - 15, center.dy),
      Offset(center.dx + 15, center.dy),
      centerPaint,
    );
    canvas.drawLine(
      Offset(center.dx, center.dy - 15),
      Offset(center.dx, center.dy + 15),
      centerPaint,
    );
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
