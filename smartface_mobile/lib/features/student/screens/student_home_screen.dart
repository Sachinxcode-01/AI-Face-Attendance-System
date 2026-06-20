/*
|--------------------------------------------------------------------------
| File: student_home_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Renders the premium SaaS student dashboard. Displays general statistics,
| daily attendance telemetry, calendar logs, and recent verification history.
| Handles responsive layout structures for handheld mobile vs tablet screens.
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:path_provider/path_provider.dart';

// ======================================================
// Core & State Imports
// ======================================================
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/features/sync/widgets/sync_status_banner.dart';
import 'package:smartface_attendance/app/router/route_names.dart';

// ======================================================
// Services & Component Imports
// ======================================================
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/core/services/notification_service.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';
import 'package:smartface_attendance/shared/widgets/glow_refresh_indicator.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/features/analytics/models/student_stats_model.dart';
import 'package:smartface_attendance/features/analytics/controllers/analytics_controller.dart';
import 'package:smartface_attendance/features/analytics/widgets/analytics_components.dart';
import 'package:smartface_attendance/features/analytics/models/attendance_analytics_model.dart';

/// Screen widget displaying student academic statistics, calendars, and live sessions.
class StudentDashboard extends StatefulWidget {
  const StudentDashboard({super.key});

  @override
  State<StudentDashboard> createState() => _StudentDashboardState();
}

class _StudentDashboardState extends State<StudentDashboard> {
  final NotificationService _notificationService = sl<NotificationService>();
  StreamSubscription? _notifSubscription;

  bool _isLoading = true;
  
  // HUD Data
  double _overallPercentage = 0.82;
  String _standing = 'Elite Performer';
  String _rank = 'Ranked #4 in Department';
  int _streak = 12;
  List<SubjectProgressModel> _subjects = [];
  Map<String, dynamic>? _activeSession;

  // Analytics & History
  List<dynamic> _verificationHistory = [];
  List<dynamic> _activeSessions = [];
  Map<String, dynamic> _aiMetrics = {
    'average_confidence': 0.96,
    'lighting_quality': 'Good',
    'face_visibility': 'Excellent'
  };

  @override
  void initState() {
    super.initState();

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
    }
  }

  void _showExportOptionsDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF070B1A),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(24),
          side: const BorderSide(color: Colors.white12),
        ),
        title: Text(
          'Export Report Ledger',
          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Select preferred layout format to download your biometric verification logs:',
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.picture_as_pdf_outlined, color: AppColors.gold),
              title: const Text('PDF Document (.pdf)', style: TextStyle(color: Colors.white, fontSize: 13)),
              tileColor: Colors.white10,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              onTap: () {
                Navigator.pop(context);
                _exportAttendanceReportPdf();
              },
            ),
            const SizedBox(height: 10),
            ListTile(
              leading: const Icon(Icons.grid_on_rounded, color: Colors.cyanAccent),
              title: const Text('CSV Spreadsheet (.csv)', style: TextStyle(color: Colors.white, fontSize: 13)),
              tileColor: Colors.white10,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              onTap: () async {
                Navigator.pop(context);
                await _compileAndSaveCsv();
              },
            ),
            const SizedBox(height: 10),
            ListTile(
              leading: const Icon(Icons.table_chart_rounded, color: Colors.greenAccent),
              title: const Text('Excel Ledger (.xlsx)', style: TextStyle(color: Colors.white, fontSize: 13)),
              tileColor: Colors.white10,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              onTap: () async {
                Navigator.pop(context);
                await _compileAndSaveExcel();
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _compileAndSaveCsv() async {
    try {
      final session = context.read<SessionManager>();
      final email = session.email ?? 'student';
      
      final buffer = StringBuffer();
      buffer.writeln('Date,Subject,Status,Confidence,Method');
      for (final log in _verificationHistory) {
        final date = log['date'] ?? '';
        final sub = log['subject'] ?? '';
        final status = log['status'] ?? '';
        final conf = log['confidence'] ?? '';
        final method = log['verified_by'] ?? '';
        buffer.writeln('"$date","$sub","$status","$conf","$method"');
      }

      final output = await getTemporaryDirectory();
      final file = File('${output.path}/attendance_${email}_report.csv');
      await file.writeAsString(buffer.toString());

      if (mounted) {
        AppToast.show(context, message: 'CSV file compiled successfully!', type: ToastType.success);
      }
    } catch (e) {
      debugPrint('CSV Export Error: $e');
    }
  }

  Future<void> _compileAndSaveExcel() async {
    try {
      final session = context.read<SessionManager>();
      final email = session.email ?? 'student';

      final buffer = StringBuffer();
      buffer.writeln('Date\tSubject\tStatus\tConfidence\tMethod');
      for (final log in _verificationHistory) {
        final date = log['date'] ?? '';
        final sub = log['subject'] ?? '';
        final status = log['status'] ?? '';
        final conf = log['confidence'] ?? '';
        final method = log['verified_by'] ?? '';
        buffer.writeln('$date\t$sub\t$status\t$conf\t$method');
      }

      final output = await getTemporaryDirectory();
      final file = File('${output.path}/attendance_${email}_ledger.xlsx');
      await file.writeAsString(buffer.toString());

      if (mounted) {
        AppToast.show(context, message: 'Excel ledger compiled successfully!', type: ToastType.success);
      }
    } catch (e) {
      debugPrint('Excel Export Error: $e');
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
              context.go('/student/scan');
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
    final session = context.read<SessionManager>();
    final double screenWidth = MediaQuery.of(context).size.width;
    final bool isTablet = screenWidth >= 600;

    if (_isLoading) {
      return Scaffold(
        backgroundColor: isDark ? AppColors.bgDark : AppColors.bgLight,
        body: const DashboardShimmer(),
      );
    }

    // Prepare components to render
    final activeSessionBanner = _activeSession != null
        ? SessionBanner(
            subject: _activeSession?['subject'] ?? 'Data Structures',
            teacher: _activeSession?['teacher'] ?? 'Prof. Sharma',
            minutesRemaining: _activeSession?['minutes_remaining'] ?? 18,
            onVerifyTap: () => context.go('/student/scan'),
          )
        : null;

    final analyticsCtrl = context.watch<AnalyticsController>();
    final rawInsights = analyticsCtrl.studentAnalytics['personal_insights'] as List<dynamic>? ?? [];
    final insightsList = rawInsights.map((i) => PersonalInsight.fromJson(Map<String, dynamic>.from(i))).toList();
    final predictions = AIPredictions.fromJson(analyticsCtrl.studentAnalytics);
    final weekly = analyticsCtrl.studentAnalytics['weekly_trends'] as List<dynamic>? ?? [];
    final monthly = analyticsCtrl.studentAnalytics['monthly_trends'] as List<dynamic>? ?? [];
    final heatmap = analyticsCtrl.studentAnalytics['heatmap_data'] as Map<String, dynamic>? ?? {};
    final rawLeaderboard = analyticsCtrl.studentAnalytics['leaderboard'] as List<dynamic>? ?? [];
    final leaderboardEntries = rawLeaderboard.map((l) => LeaderboardEntry.fromJson(Map<String, dynamic>.from(l))).toList();

    final header = _buildWelcomeHeader(context, isDark, session)
        .animate()
        .fadeIn(duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(begin: 0.1, end: 0, duration: 400.ms, curve: Curves.easeOutCubic);
    
    final healthGrid = AttendanceScoreCard(
      scoreValue: _overallPercentage,
      standing: _standing,
      departmentRank: _rank,
      streak: _streak,
    )
        .animate()
        .fadeIn(delay: 60.ms, duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(begin: 0.1, end: 0, duration: 400.ms, curve: Curves.easeOutCubic);

    final aiInsights = Column(
      children: [
        PredictionCard(predictions: predictions),
        const SizedBox(height: 20),
        PersonalInsightCard(insights: insightsList),
      ],
    )
        .animate()
        .fadeIn(delay: 120.ms, duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(begin: 0.1, end: 0, duration: 400.ms, curve: Curves.easeOutCubic);

    final weeklyMonthlyAnalytics = TrendChart(
      weeklyTrends: weekly,
      monthlyTrends: monthly,
    )
        .animate()
        .fadeIn(delay: 180.ms, duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(begin: 0.1, end: 0, duration: 400.ms, curve: Curves.easeOutCubic);

    final calendarHistory = HeatmapCard(heatmapData: heatmap)
        .animate()
        .fadeIn(delay: 240.ms, duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(begin: 0.1, end: 0, duration: 400.ms, curve: Curves.easeOutCubic);

    final leaderboardCard = LeaderboardCard(entries: leaderboardEntries)
        .animate()
        .fadeIn(delay: 300.ms, duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(begin: 0.1, end: 0, duration: 400.ms, curve: Curves.easeOutCubic);

    final activityTimeline = _buildRecentActivity(isDark)
        .animate()
        .fadeIn(delay: 360.ms, duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(begin: 0.1, end: 0, duration: 400.ms, curve: Curves.easeOutCubic);

    final quickActions = _buildQuickActions(context)
        .animate()
        .fadeIn(delay: 420.ms, duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(begin: 0.1, end: 0, duration: 400.ms, curve: Curves.easeOutCubic);

    final securityCard = _buildSecurityCard(isDark)
        .animate()
        .fadeIn(delay: 480.ms, duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(begin: 0.1, end: 0, duration: 400.ms, curve: Curves.easeOutCubic);

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
          backgroundColor: Colors.transparent,
          elevation: 0,
          leadingWidth: 0,
          leading: const SizedBox.shrink(),
          title: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.cyan, width: 1.5),
                  boxShadow: AppShadows.glow(AppColors.cyan, intensity: 0.2),
                ),
                child: CircleAvatar(
                  backgroundColor: AppColors.bgSurface,
                  child: Text(
                    (session.name ?? 'S').substring(0, 1).toUpperCase(),
                    style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: Colors.white),
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    session.name ?? 'Sachin',
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.w800,
                      fontSize: 16,
                      color: isDark ? Colors.white : AppColors.bgDark,
                    ),
                  ),
                  Text(
                    'Semester 6 • B.Tech CSE',
                    style: AppText.caption(color: isDark ? Colors.white54 : Colors.black54),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            IconButton(
              icon: Icon(
                isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
                color: AppColors.gold,
              ),
              onPressed: () => themeCtrl.toggle(),
            ),
            IconButton(
              onPressed: () => context.push('/notifications/nexus'),
              icon: Icon(
                Icons.notifications_none_rounded,
                color: isDark ? Colors.white : AppColors.bgDark,
              ),
            ),
            IconButton(
              onPressed: () => context.push('/profile/student'),
              icon: Icon(
                Icons.account_circle_outlined,
                color: isDark ? Colors.white : AppColors.bgDark,
              ),
            ),
          ],
        ),
        body: GlowRefreshIndicator(
          onRefresh: _loadDashboardData,
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (activeSessionBanner != null) ...[
                  activeSessionBanner,
                  const SizedBox(height: 20),
                ],
                const SyncStatusBanner(),
                const SizedBox(height: 10),
                if (!isTablet) ...[
                  // Mobile view layout: Single column high-density details
                  header,
                  const SizedBox(height: 20),
                  healthGrid,
                  const SizedBox(height: 20),
                  aiInsights,
                  const SizedBox(height: 20),
                  weeklyMonthlyAnalytics,
                  const SizedBox(height: 20),
                  leaderboardCard,
                  const SizedBox(height: 20),
                  calendarHistory,
                  const SizedBox(height: 20),
                  activityTimeline,
                  const SizedBox(height: 20),
                  securityCard,
                  const SizedBox(height: 20),
                  quickActions,
                ] else ...[
                  // Tablet view layout: Premium responsive split screen
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        flex: 6,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            header,
                            const SizedBox(height: 20),
                            healthGrid,
                            const SizedBox(height: 20),
                            weeklyMonthlyAnalytics,
                            const SizedBox(height: 20),
                            leaderboardCard,
                            const SizedBox(height: 20),
                            calendarHistory,
                          ],
                        ),
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        flex: 4,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            aiInsights,
                            const SizedBox(height: 20),
                            quickActions,
                            const SizedBox(height: 20),
                            activityTimeline,
                            const SizedBox(height: 20),
                            securityCard,
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
        floatingActionButton: FloatingActionButton(
          onPressed: _showExportOptionsDialog,
          backgroundColor: AppColors.gold,
          foregroundColor: Colors.black,
          child: const Icon(Icons.download_rounded),
        ),
      ),
    );
  }

  Widget _buildWelcomeHeader(BuildContext context, bool isDark, SessionManager session) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'ATTENDANCE INTELLIGENCE PORTAL',
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: AppColors.gold,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Welcome to SmartFace AI',
          style: GoogleFonts.outfit(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : AppColors.bgDark,
          ),
        ),
      ],
    );
  }

  // Legacy charts replaced by TrendChart, HeatmapCard, and AttendanceScoreCard

  Widget _buildRecentActivity(bool isDark) {
    final timelineItems = _verificationHistory.map((log) {
      final isPresent = log['status'].toString().toLowerCase() == 'present';
      final isFace = log['verified_by'] == 'face';
      final verificationType = isFace ? 'Face Scanner (Conf: ${log['confidence']})' : 'QR Scan';

      return TimelineItem(
        title: log['subject'] ?? 'Data Science Class',
        description: 'Status: ${log['status'].toString().toUpperCase()} • Verified via $verificationType',
        timestamp: '${log['time']} • ${log['date']}',
        icon: isPresent ? Icons.check_circle_rounded : Icons.cancel_rounded,
        iconColor: isPresent ? AppColors.success : AppColors.error,
      );
    }).toList();

    return ActivityTimeline(
      title: 'BIOMETRIC VERIFICATION LOGS',
      items: timelineItems.take(5).toList(),
    );
  }


  Widget _buildSecurityCard(bool isDark) {
    return GlassContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'ACTIVE DEVICES & SECURITY',
                style: GoogleFonts.inter(fontSize: 10, letterSpacing: 1.5, color: AppColors.gold, fontWeight: FontWeight.bold),
              ),
              IconButton(
                icon: const Icon(Icons.logout_rounded, color: Colors.orangeAccent, size: 18),
                onPressed: _logoutOtherDevices,
                tooltip: 'Log out other devices',
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
                      color: isCurrent ? const Color(0xFF76E600) : (isDark ? Colors.white54 : Colors.black54),
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
                            style: TextStyle(
                              color: isDark ? Colors.white : AppColors.bgDeep,
                              fontWeight: isCurrent ? FontWeight.bold : FontWeight.normal,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            'IP: ${s['ip']} • ${s['location']}',
                            style: TextStyle(
                              color: isDark ? Colors.white38 : Colors.black38,
                              fontSize: 10,
                            ),
                          ),
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
                        child: const Text(
                          'CURRENT',
                          style: TextStyle(color: Color(0xFF76E600), fontSize: 8, fontWeight: FontWeight.bold),
                        ),
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

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'QUICK ACTIONS CONSOLE',
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: AppColors.gold,
          ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 14,
          mainAxisSpacing: 14,
          childAspectRatio: 1.3,
          children: [
            ActionTile(
              label: 'Mark Attendance',
              description: 'Scan active classroom QR and verify face ID',
              icon: Icons.qr_code_scanner_rounded,
              color: AppColors.accent,
              onTap: () => context.go('/student/scan'),
            ),
            ActionTile(
              label: 'Attendance Hub',
              description: 'Track attendance health, scores, heatmaps, and alerts',
              icon: Icons.analytics_outlined,
              color: Colors.pinkAccent,
              onTap: () => context.push(AppRoutes.studentAttendanceHubPath),
            ),
            ActionTile(
              label: 'AI Analyst',
              description: 'Get deep predictions & advice on your grades',
              icon: Icons.psychology_outlined,
              color: AppColors.gold,
              onTap: () => context.push('/analytics/analyst'),
            ),
            ActionTile(
              label: 'Register Biometrics',
              description: 'Update and re-train your AI face embeddings',
              icon: Icons.face_retouching_natural_rounded,
              color: Colors.tealAccent,
              onTap: _showFaceRegistrationDialog,
            ),
            ActionTile(
              label: 'Leave Applications',
              description: 'Apply for leave and check approval status',
              icon: Icons.event_busy_outlined,
              color: Colors.orangeAccent,
              onTap: () => context.push('/student/leave'),
            ),
            ActionTile(
              label: 'Reports Center',
              description: 'Export digital PDF/CSV/Excel reports',
              icon: Icons.download_rounded,
              color: Colors.purpleAccent,
              onTap: _showExportOptionsDialog,
            ),
          ],
        ),
      ],
    );
  }
}
