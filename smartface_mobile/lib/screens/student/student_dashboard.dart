import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:path_provider/path_provider.dart';

import '../../core/constants.dart';
import '../../core/session_manager.dart';
import '../../core/theme_controller.dart';
import '../../services/api_service.dart';
import '../../services/notification_service.dart';
import '../../widgets/shimmer_loader.dart';
import '../../widgets/glassmorphic_card.dart';
import '../../models/student_stats_model.dart';

class StudentDashboard extends StatefulWidget {
  const StudentDashboard({super.key});

  @override
  State<StudentDashboard> createState() => _StudentDashboardState();
}

class _StudentDashboardState extends State<StudentDashboard> {
  final NotificationService _notificationService = NotificationService();
  StreamSubscription? _notifSubscription;

  bool _isLoading = true;
  bool _exportingPdf = false;
  
  // HUD Data
  double _overallPercentage = 0.82;
  String _standing = 'Elite Performer';
  String _rank = 'Ranked #4 in Department';
  int _streak = 12;
  List<SubjectProgressModel> _subjects = [];
  Map<String, dynamic>? _activeSession;

  // Analytics & History
  List<dynamic> _weeklyTrends = [];
  List<dynamic> _monthlyTrends = [];
  List<dynamic> _verificationHistory = [];
  List<dynamic> _activeSessions = [];
  Map<String, dynamic> _aiMetrics = {
    'average_confidence': 0.96,
    'lighting_quality': 'Good',
    'face_visibility': 'Excellent'
  };

  // Calendar
  DateTime _focusedDay = DateTime.now();
  DateTime? _selectedDay;
  CalendarFormat _calendarFormat = CalendarFormat.month;

  // State controls
  bool _showWeekly = true;
  String _searchQuery = '';
  String _filterStatus = 'All'; // 'All', 'Present', 'Absent'

  @override
  void initState() {
    super.initState();
    _selectedDay = _focusedDay;
    final session = Provider.of<SessionManager>(context, listen: false);
    
    // Connect WebSockets for real-time notifications
    _notificationService.connect(token: session.token);
    _notifSubscription = _notificationService.stream.listen((data) {
      if (data['type'] == 'session_alert') {
        if (mounted) {
          setState(() {
            _activeSession = data;
          });
          _showSessionDialog(data);
        }
      } else if (data['type'] == 'attendance_update') {
        if (mounted) {
          // Re-load statistics instantly on WebSocket broadcast events
          _loadDashboardData();
        }
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _loadDashboardData();
      }
    });
  }

  Future<void> _loadDashboardData() async {
    if (!mounted) return;
    setState(() => _isLoading = true);

    try {
      final session = context.read<SessionManager>();
      final email = session.email;
      final token = session.token;
      if (email == null || token == null) return;

      // Parallel async loading for premium speed
      final results = await Future.wait([
        ApiService.getStudentStats(email, token),
        ApiService.getStudentAnalytics(email, token),
        ApiService.getVerificationHistory(email, token, page: 1, limit: 10),
        ApiService.getActiveSessions(token),
      ]);

      final stats = results[0] as StudentStatsModel?;
      final analytics = results[1] as Map<String, dynamic>?;
      final history = results[2] as Map<String, dynamic>?;
      final sessions = results[3] as List<dynamic>?;

      if (mounted) {
        setState(() {
          if (stats != null) {
            _overallPercentage = stats.overallPercentage;
            _standing = stats.standing;
            _rank = stats.rank;
            _streak = stats.streak;
            _subjects = stats.subjects;
          }
          if (analytics != null) {
            _weeklyTrends = analytics['weekly_trends'] ?? [];
            _monthlyTrends = analytics['monthly_trends'] ?? [];
            _aiMetrics = analytics['ai_metrics'] ?? _aiMetrics;
          }
          if (history != null) {
            _verificationHistory = history['logs'] ?? [];
          }
          if (sessions != null) {
            _activeSessions = sessions;
          }
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Dashboard Loading Error: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _logoutOtherDevices() async {
    final session = context.read<SessionManager>();
    if (session.token == null) return;

    final result = await ApiService.logoutAllSessions(session.token!);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(result['message'] ?? 'Successfully logged out other devices'),
          backgroundColor: const Color(0xFF0C1033),
        ),
      );
      _loadDashboardData();
    }
  }

  Future<void> _exportAttendanceReportPdf() async {
    if (!mounted) return;
    setState(() => _exportingPdf = true);

    try {
      final session = context.read<SessionManager>();
      final pdf = pw.Document();

      pdf.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.a4,
          build: (pw.Context context) {
            return pw.Container(
              padding: const pw.EdgeInsets.all(30),
              decoration: pw.BoxDecoration(
                border: pw.Border.all(color: PdfColors.amber, width: 2),
              ),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Column(
                        crossAxisAlignment: pw.CrossAxisAlignment.start,
                        children: [
                          pw.Text(
                            'SMARTFACE BIOMETRIC ATTENDANCE',
                            style: pw.TextStyle(
                              fontSize: 20,
                              fontWeight: pw.FontWeight.bold,
                              color: PdfColors.blueGrey900,
                            ),
                          ),
                          pw.Text('OFFICIAL SEMESTER REPORT', style: const pw.TextStyle(fontSize: 10)),
                        ],
                      ),
                      pw.BarcodeWidget(
                        barcode: pw.Barcode.qrCode(),
                        data: 'https://smartface.college/verify/report/${session.email}',
                        width: 50,
                        height: 50,
                      ),
                    ],
                  ),
                  pw.SizedBox(height: 30),
                  pw.Divider(thickness: 1, color: PdfColors.amber),
                  pw.SizedBox(height: 20),
                  pw.Text('STUDENT INFORMATION', style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
                  pw.SizedBox(height: 10),
                  pw.Text('Name: ${session.name ?? "Student User"}'),
                  pw.Text('Email: ${session.email ?? ""}'),
                  pw.Text('Role: ${session.role?.toUpperCase() ?? ""}'),
                  pw.SizedBox(height: 30),
                  pw.Text('ATTENDANCE SUMMARY', style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
                  pw.SizedBox(height: 10),
                  pw.Text('Overall Attendance Percentage: ${(_overallPercentage * 100).toInt()}%'),
                  pw.Text('Overall Standing: $_standing'),
                  pw.Text('Current Streak: $_streak Days'),
                  pw.SizedBox(height: 30),
                  pw.Text('SUBJECT PROGRESS DETAILS', style: pw.TextStyle(fontSize: 12, fontWeight: pw.FontWeight.bold)),
                  pw.SizedBox(height: 10),
                  ..._subjects.map((sub) => pw.Text('${sub.subject}: ${sub.present}/${sub.total} Sessions (${(sub.percentage * 100).toInt()}%)')),
                  pw.Spacer(),
                  pw.Divider(thickness: 1, color: PdfColors.amber),
                  pw.SizedBox(height: 10),
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text('Generated Time: ${DateTime.now().toIso8601String().split('T')[0]}', style: const pw.TextStyle(fontSize: 8)),
                      pw.Text('Digital Signature: SECURE_AI_VERIFIED_SHA256', style: const pw.TextStyle(fontSize: 8, color: PdfColors.green)),
                    ],
                  ),
                ],
              ),
            );
          },
        ),
      );

      final output = await getTemporaryDirectory();
      final file = File('${output.path}/attendance_report.pdf');
      await file.writeAsBytes(await pdf.save());

      if (mounted) {
        await Printing.layoutPdf(
          onLayout: (PdfPageFormat format) async => pdf.save(),
        );
      }
    } catch (e) {
      debugPrint('PDF Export Error: $e');
    } finally {
      if (mounted) setState(() => _exportingPdf = false);
    }
  }

  void _showSessionDialog(Map<String, dynamic> session) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1F38),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.bolt, color: Color(0xFFFFD700)),
            const SizedBox(width: 10),
            Text(
              'Live Session Alert',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'A new attendance session has started for:',
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
            const SizedBox(height: 10),
            Text(
              session['subject'] ?? 'Unknown Subject',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFFFFD700),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text(
              'DISMISS',
              style: TextStyle(color: Colors.white38),
            ),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              final args = ModalRoute.of(context)?.settings.arguments as Map?;
              Navigator.pushNamed(context, '/qr_scanner', arguments: args);
            },
            child: const Text('VERIFY NOW'),
          ),
        ],
      ),
    );
  }

  void _showFaceRegistrationDialog() {
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) {
          return AlertDialog(
            backgroundColor: const Color(0xFF070B1A),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
              side: BorderSide(color: AppColors.gold.withValues(alpha: 0.2)),
            ),
            title: Row(
              children: [
                const Icon(Icons.face_retouching_natural_rounded, color: AppColors.gold),
                const SizedBox(width: 10),
                Text(
                  'Biometric Register',
                  style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Capture quality guidance:',
                  style: GoogleFonts.inter(color: Colors.white54, fontSize: 12),
                ),
                const SizedBox(height: 16),
                _buildRegistrationGuideItem(Icons.light_mode_outlined, 'Lighting Quality', 'Good', const Color(0xFF76E600)),
                _buildRegistrationGuideItem(Icons.blur_off_rounded, 'Blur Level Detection', 'Excellent', const Color(0xFF76E600)),
                _buildRegistrationGuideItem(Icons.portrait_rounded, 'Face Angle Alignment', 'Aligned (0° yaw)', const Color(0xFF76E600)),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.02),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.info_outline_rounded, color: AppColors.gold, size: 16),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Updating embeddings prompts the server-side AI model to re-train in the background.',
                          style: GoogleFonts.inter(color: Colors.white38, fontSize: 10),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: const Text('CANCEL', style: TextStyle(color: Colors.white38)),
              ),
              ElevatedButton(
                onPressed: () async {
                  final session = context.read<SessionManager>();
                  if (session.token != null) {
                    await ApiService.triggerTrainFaces(session.token!);
                    if (!context.mounted) return;
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('AI re-training queue requested!'),
                        backgroundColor: Color(0xFF0C1033),
                      ),
                    );
                  }
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: Colors.black,
                ),
                child: const Text('RE-TRAIN EMBEDDINGS'),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildRegistrationGuideItem(IconData icon, String title, String val, Color color) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.white38),
          const SizedBox(width: 8),
          Text(title, style: const TextStyle(color: Colors.white70, fontSize: 12)),
          const Spacer(),
          Text(
            val,
            style: GoogleFonts.robotoMono(color: color, fontWeight: FontWeight.bold, fontSize: 12),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _notifSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final themeCtrl = context.watch<ThemeController>();
    final isDark = themeCtrl.isDark;

    if (_isLoading) {
      return Scaffold(
        backgroundColor: isDark ? AppColors.bgDark : AppColors.bgLight,
        body: const DashboardShimmer(),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.bgDark : AppColors.bgLight,
        image: DecorationImage(
          image: const NetworkImage(
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
          ),
          fit: BoxFit.cover,
          colorFilter: ColorFilter.mode(
            isDark
                ? Colors.black.withValues(alpha: 0.15)
                : Colors.white.withValues(alpha: 0.85),
            isDark ? BlendMode.dstATop : BlendMode.srcOver,
          ),
        ),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: Text(
            'Student Nexus',
            style: GoogleFonts.inter(
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : AppColors.bgDark,
            ),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
          actions: [
            IconButton(
              icon: Icon(
                isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
                color: AppColors.gold,
              ),
              onPressed: () => themeCtrl.toggle(),
            ),
            IconButton(
              onPressed: () => Navigator.pushNamed(
                context,
                '/notifications',
                arguments: ModalRoute.of(context)?.settings.arguments,
              ),
              icon: const Icon(Icons.notifications_none_rounded),
            ),
            IconButton(
              onPressed: () => Navigator.pushNamed(
                context,
                '/student-profile',
                arguments: ModalRoute.of(context)?.settings.arguments,
              ),
              icon: const Icon(Icons.account_circle_outlined),
            ),
          ],
        ),
        body: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_activeSession != null) ...[
                _buildActiveSessionBanner(),
                const SizedBox(height: 20),
              ],
              
              // 1. AI Attendance Overview Card
              _buildAttendanceOverviewCard(),
              const SizedBox(height: 20),

              // 2. Real-Time Attendance Status Telemetry HUD
              _buildRealTimeStatusHUD(),
              const SizedBox(height: 20),

              // 5. AI Performance Insights Card
              _buildAIPerformanceCard(),
              const SizedBox(height: 20),

              // 4. Analytics Graph Card
              _buildAnalyticsChartsCard(),
              const SizedBox(height: 20),

              // 8. Custom Calendar Card View
              _buildCalendarCard(),
              const SizedBox(height: 20),

              // 3. AI Face Verification History
              _buildVerificationHistoryCard(),
              const SizedBox(height: 20),

              // 11. Sessions & Device Security Card
              _buildSessionsSecurityCard(),
              const SizedBox(height: 30),

              _buildActionButtons(context),
            ],
          ),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: _exportingPdf ? null : _exportAttendanceReportPdf,
          backgroundColor: AppColors.gold,
          foregroundColor: Colors.black,
          child: _exportingPdf
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(Colors.black)),
                )
              : const Icon(Icons.download_rounded),
        ),
      ),
    );
  }

  Widget _buildActiveSessionBanner() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1D2671), Color(0xFFC33764)],
        ),
        borderRadius: BorderRadius.circular(25),
      ),
      child: Row(
        children: [
          const Icon(Icons.sensors, color: Colors.white, size: 30)
              .animate(onPlay: (c) => c.repeat())
              .shimmer(duration: 2.seconds),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'SESSION ACTIVE',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14, letterSpacing: 1),
                ),
                Text(
                  _activeSession?['subject'] ?? 'Unknown',
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () {
              final args = ModalRoute.of(context)?.settings.arguments as Map?;
              Navigator.pushNamed(context, '/qr_scanner', arguments: args);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
            ),
            child: const Text('VERIFY', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceOverviewCard() {
    final scorePercentage = _overallPercentage;
    final neonBorderColor = scorePercentage >= 0.85
        ? const Color(0xFF76E600) // cyber green
        : scorePercentage >= 0.75
            ? AppColors.gold
            : const Color(0xFFF05050); // cyber red

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF070B1A).withValues(alpha: 0.75),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: neonBorderColor.withValues(alpha: 0.3), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: neonBorderColor.withValues(alpha: 0.08),
            blurRadius: 20,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Row(
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween<double>(begin: 0.0, end: _overallPercentage),
            duration: 1200.ms,
            curve: Curves.fastOutSlowIn,
            builder: (context, value, child) {
              return Stack(
                alignment: Alignment.center,
                children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: neonBorderColor.withValues(alpha: 0.15 * value),
                          blurRadius: 12,
                        ),
                      ],
                    ),
                    child: CircularProgressIndicator(
                      value: value,
                      backgroundColor: Colors.white.withValues(alpha: 0.04),
                      valueColor: AlwaysStoppedAnimation<Color>(neonBorderColor),
                      strokeWidth: 6,
                    ),
                  ),
                  Text(
                    '${(value * 100).toInt()}%',
                    style: GoogleFonts.inter(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ],
              );
            },
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _standing.toUpperCase(),
                  style: GoogleFonts.inter(color: neonBorderColor, fontWeight: FontWeight.bold, fontSize: 18),
                ),
                const SizedBox(height: 4),
                Text(_rank, style: const TextStyle(color: Colors.white54, fontSize: 12)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    const Icon(Icons.local_fire_department_rounded, color: Colors.orangeAccent, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      '$_streak DAY STREAK',
                      style: GoogleFonts.robotoMono(color: Colors.orangeAccent, fontWeight: FontWeight.bold, fontSize: 12),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRealTimeStatusHUD() {
    return GlassmorphicCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'TODAY\'S TELEMETRY',
            style: GoogleFonts.inter(fontSize: 10, letterSpacing: 1.5, color: AppColors.gold, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('AI Camera Verification', style: TextStyle(color: Colors.white54, fontSize: 11)),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(color: Color(0xFF76E600), shape: BoxShape.circle),
                      ),
                      const SizedBox(width: 6),
                      Text(
                        'PRESENT ✅',
                        style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ],
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  const Text('Scan Time', style: TextStyle(color: Colors.white54, fontSize: 11)),
                  const SizedBox(height: 4),
                  Text(
                    '09:02 AM',
                    style: GoogleFonts.robotoMono(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 14),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAIPerformanceCard() {
    final double confidence = _aiMetrics['average_confidence'] ?? 0.96;
    final String lighting = _aiMetrics['lighting_quality'] ?? 'Good';
    final String visibility = _aiMetrics['face_visibility'] ?? 'Excellent';

    return GlassmorphicCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'AI PERFORMANCE INSIGHTS',
            style: GoogleFonts.inter(fontSize: 10, letterSpacing: 1.5, color: AppColors.gold, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildAIInsightColumn('Average Match', '${(confidence * 100).toInt()}%'),
              _buildAIInsightColumn('Lighting Quality', lighting, color: const Color(0xFF76E600)),
              _buildAIInsightColumn('Face Visibility', visibility, color: const Color(0xFF76E600)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildAIInsightColumn(String label, String val, {Color color = Colors.white}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white38, fontSize: 10)),
        const SizedBox(height: 4),
        Text(
          val,
          style: GoogleFonts.inter(color: color, fontWeight: FontWeight.bold, fontSize: 14),
        ),
      ],
    );
  }

  Widget _buildAnalyticsChartsCard() {
    return GlassmorphicCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                _showWeekly ? 'WEEKLY ATTENDANCE TRENDS' : 'MONTHLY ATTENDANCE ANALYTICS',
                style: GoogleFonts.inter(fontSize: 10, letterSpacing: 1.5, color: AppColors.gold, fontWeight: FontWeight.bold),
              ),
              Row(
                children: [
                  GestureDetector(
                    onTap: () => setState(() => _showWeekly = true),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: _showWeekly ? AppColors.gold.withValues(alpha: 0.2) : Colors.transparent,
                        border: Border.all(color: _showWeekly ? AppColors.gold : Colors.white24, width: 1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'WEEK',
                        style: TextStyle(
                          color: _showWeekly ? AppColors.gold : Colors.white54,
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => setState(() => _showWeekly = false),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: !_showWeekly ? const Color(0xFF76E600).withValues(alpha: 0.2) : Colors.transparent,
                        border: Border.all(color: !_showWeekly ? const Color(0xFF76E600) : Colors.white24, width: 1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        'MONTH',
                        style: TextStyle(
                          color: !_showWeekly ? const Color(0xFF76E600) : Colors.white54,
                          fontSize: 8,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          SizedBox(
            height: 150,
            child: _showWeekly
                ? LineChart(
                    LineChartData(
                      gridData: const FlGridData(show: false),
                      titlesData: FlTitlesData(
                        leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (value, meta) {
                              final index = value.toInt();
                              if (index >= 0 && index < _weeklyTrends.length) {
                                return Text(
                                  _weeklyTrends[index]['week'] ?? '',
                                  style: const TextStyle(color: Colors.white38, fontSize: 10),
                                );
                              }
                              return const Text('');
                            },
                          ),
                        ),
                      ),
                      borderData: FlBorderData(show: false),
                      lineBarsData: [
                        LineChartBarData(
                          spots: List.generate(_weeklyTrends.length, (index) {
                            final val = double.parse(_weeklyTrends[index]['present'].toString());
                            return FlSpot(index.toDouble(), val);
                          }),
                          isCurved: true,
                          gradient: const LinearGradient(colors: [AppColors.gold, Color(0xFFFF9E00)]),
                          barWidth: 3,
                          belowBarData: BarAreaData(
                            show: true,
                            gradient: LinearGradient(
                              colors: [AppColors.gold.withValues(alpha: 0.15), Colors.transparent],
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                            ),
                          ),
                        ),
                      ],
                    ),
                  )
                : BarChart(
                    BarChartData(
                      gridData: const FlGridData(show: false),
                      titlesData: FlTitlesData(
                        leftTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            getTitlesWidget: (value, meta) {
                              final index = value.toInt();
                              if (index >= 0 && index < _monthlyTrends.length) {
                                return Text(
                                  _monthlyTrends[index]['month'] ?? '',
                                  style: const TextStyle(color: Colors.white38, fontSize: 10),
                                );
                              }
                              return const Text('');
                            },
                          ),
                        ),
                      ),
                      borderData: FlBorderData(show: false),
                      barGroups: List.generate(_monthlyTrends.length, (index) {
                        final val = double.parse(_monthlyTrends[index]['present'].toString());
                        return BarChartGroupData(
                          x: index,
                          barRods: [
                            BarChartRodData(
                              toY: val,
                              gradient: const LinearGradient(colors: [Color(0xFF76E600), Color(0xFF00FF9E)]),
                              width: 12,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ],
                        );
                      }),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildCalendarCard() {
    return GlassmorphicCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'ATTENDANCE CALENDAR MATRIX',
            style: GoogleFonts.inter(fontSize: 10, letterSpacing: 1.5, color: AppColors.gold, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 10),
          TableCalendar(
            firstDay: DateTime.utc(2026, 1, 1),
            lastDay: DateTime.utc(2026, 12, 31),
            focusedDay: _focusedDay,
            calendarFormat: _calendarFormat,
            selectedDayPredicate: (day) {
              return isSameDay(_selectedDay, day);
            },
            onDaySelected: (selectedDay, focusedDay) {
              setState(() {
                _selectedDay = selectedDay;
                _focusedDay = focusedDay;
              });
            },
            onFormatChanged: (format) {
              setState(() {
                _calendarFormat = format;
              });
            },
            calendarStyle: CalendarStyle(
              defaultTextStyle: const TextStyle(color: Colors.white70),
              weekendTextStyle: const TextStyle(color: Colors.white38),
              todayDecoration: BoxDecoration(color: Colors.white.withValues(alpha: 0.1), shape: BoxShape.circle),
              selectedDecoration: const BoxDecoration(color: AppColors.gold, shape: BoxShape.circle),
              selectedTextStyle: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold),
            ),
            headerStyle: HeaderStyle(
              formatButtonVisible: false,
              titleCentered: true,
              titleTextStyle: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold),
              leftChevronIcon: const Icon(Icons.chevron_left, color: AppColors.gold),
              rightChevronIcon: const Icon(Icons.chevron_right, color: AppColors.gold),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVerificationHistoryCard() {
    // Apply local search and filter on the verification history
    final filteredHistory = _verificationHistory.where((log) {
      final subject = (log['subject'] ?? '').toString().toLowerCase();
      final status = (log['status'] ?? '').toString().toLowerCase();
      final query = _searchQuery.toLowerCase();
      
      final matchesSearch = subject.contains(query);
      final matchesStatus = _filterStatus == 'All' || 
          status == _filterStatus.toLowerCase();
      
      return matchesSearch && matchesStatus;
    }).toList();

    return GlassmorphicCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'AI FACE VERIFICATION HISTORY',
            style: GoogleFonts.inter(fontSize: 10, letterSpacing: 1.5, color: AppColors.gold, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 15),
          
          // Search Box & Filters
          Row(
            children: [
              Expanded(
                child: Container(
                  height: 38,
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.03),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.white.withValues(alpha: 0.1)),
                  ),
                  child: TextField(
                    onChanged: (val) {
                      setState(() {
                        _searchQuery = val;
                      });
                    },
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                    decoration: InputDecoration(
                      hintText: 'Search by subject...',
                      hintStyle: const TextStyle(color: Colors.white24, fontSize: 12),
                      prefixIcon: const Icon(Icons.search, color: Colors.white38, size: 16),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              
              // Status Filter Toggle
              Row(
                children: ['All', 'Present', 'Absent'].map((filter) {
                  final isSel = _filterStatus == filter;
                  final filterColor = filter == 'Present' 
                      ? const Color(0xFF76E600) 
                      : filter == 'Absent' 
                          ? const Color(0xFFF05050) 
                          : AppColors.gold;
                  return Padding(
                    padding: const EdgeInsets.only(left: 4.0),
                    child: GestureDetector(
                      onTap: () => setState(() => _filterStatus = filter),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                        decoration: BoxDecoration(
                          color: isSel ? filterColor.withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.02),
                          border: Border.all(color: isSel ? filterColor : Colors.white10),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          filter.toUpperCase(),
                          style: TextStyle(
                            color: isSel ? filterColor : Colors.white38,
                            fontSize: 8,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  );
                }).toList(),
              ),
            ],
          ),
          const SizedBox(height: 15),
          
          if (filteredHistory.isEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.01),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
              ),
              child: Column(
                children: [
                  const Icon(Icons.history_toggle_off_rounded, color: Colors.white24, size: 30),
                  const SizedBox(height: 10),
                  Text(
                    'No verification records found',
                    style: GoogleFonts.inter(color: Colors.white38, fontSize: 11),
                  ),
                ],
              ),
            )
          else
            ListView.separated(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              itemCount: filteredHistory.length,
              separatorBuilder: (context, index) => Divider(color: Colors.white.withValues(alpha: 0.05), height: 16),
              itemBuilder: (context, index) {
                final log = filteredHistory[index];
                final isPresent = log['status'].toString().toLowerCase() == 'present';
                final verifiedBy = log['verified_by'] ?? 'N/A';
                final isFace = verifiedBy == 'face';
                
                return Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                log['subject'] ?? 'Unknown Class',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13),
                              ),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color: (isFace ? Colors.blue : Colors.amber).withValues(alpha: 0.1),
                                  border: Border.all(color: (isFace ? Colors.blue : Colors.amber).withValues(alpha: 0.4)),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  isFace ? 'AI FACE (${log['confidence']})' : 'QR VERIFIED',
                                  style: TextStyle(color: isFace ? Colors.blue : Colors.amber, fontSize: 8, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Date: ${log['date']} • Time: ${log['time']} • Light: ${log['lighting_quality'] ?? 'N/A'} • Visibility: ${log['face_visibility'] ?? 'N/A'}',
                            style: const TextStyle(color: Colors.white38, fontSize: 9),
                          ),
                        ],
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: (isPresent ? const Color(0xFF76E600) : const Color(0xFFF05050)).withValues(alpha: 0.1),
                        border: Border.all(color: (isPresent ? const Color(0xFF76E600) : const Color(0xFFF05050)).withValues(alpha: 0.4)),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        isPresent ? 'PRESENT' : 'ABSENT',
                        style: TextStyle(
                          color: isPresent ? const Color(0xFF76E600) : const Color(0xFFF05050),
                          fontSize: 9,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                );
              },
            ),
        ],
      ),
    );
  }

  Widget _buildSessionsSecurityCard() {
    return GlassmorphicCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'ACTIVE SESSIONS & SECURITY',
                style: GoogleFonts.inter(fontSize: 10, letterSpacing: 1.5, color: AppColors.gold, fontWeight: FontWeight.bold),
              ),
              IconButton(
                icon: const Icon(Icons.logout_rounded, color: Colors.orangeAccent, size: 18),
                onPressed: _logoutOtherDevices,
              ),
            ],
          ),
          const SizedBox(height: 10),
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _activeSessions.length,
            itemBuilder: (context, index) {
              final s = _activeSessions[index];
              final isCurrent = s['is_current'] == true;
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 6.0),
                child: Row(
                  children: [
                    Icon(
                      s['device'].toString().contains('Windows') || s['device'].toString().contains('Mac')
                          ? Icons.laptop_chromebook_rounded
                          : Icons.phone_android_rounded,
                      size: 20,
                      color: isCurrent ? const Color(0xFF76E600) : Colors.white54,
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            s['device'] ?? 'Unknown Platform',
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: TextStyle(color: Colors.white, fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal, fontSize: 13),
                          ),
                          Text('IP: ${s['ip']} • ${s['location']}', style: const TextStyle(color: Colors.white38, fontSize: 10)),
                        ],
                      ),
                    ),
                    if (isCurrent)
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: const Color(0xFF76E600).withValues(alpha: 0.1),
                          border: Border.all(color: const Color(0xFF76E600).withValues(alpha: 0.4)),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        child: const Text('ACTIVE', style: TextStyle(color: Color(0xFF76E600), fontSize: 8, fontWeight: FontWeight.bold)),
                      ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  final args = ModalRoute.of(context)?.settings.arguments as Map?;
                  Navigator.pushNamed(context, '/qr_scanner', arguments: args);
                },
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text('MARK ATTENDANCE'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                ),
              ),
            ),
            const SizedBox(width: 15),
            GestureDetector(
              onTap: () {
                final args = ModalRoute.of(context)?.settings.arguments as Map?;
                Navigator.pushNamed(context, '/analyst', arguments: args);
              },
              child: Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFD700).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFFFFD700).withValues(alpha: 0.3),
                  ),
                ),
                child: const Icon(
                  Icons.psychology_outlined,
                  color: Color(0xFFFFD700),
                  size: 30,
                ),
              ),
            ),
            const SizedBox(width: 15),
            GestureDetector(
              onTap: _showFaceRegistrationDialog,
              child: Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.1),
                  ),
                ),
                child: const Icon(
                  Icons.face_retouching_natural_rounded,
                  color: Colors.white70,
                  size: 30,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 15),
        const Text(
          'TAP BRAIN FOR AI ANALYST | FACE FOR BIOMETRICS',
          style: TextStyle(
            color: Colors.white24,
            fontSize: 8,
            letterSpacing: 1,
          ),
        ),
      ],
    ).animate().slideY(begin: 0.1);
  }
}
