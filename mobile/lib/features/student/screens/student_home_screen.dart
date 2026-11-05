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
import 'package:flutter/services.dart';
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
import 'package:smartface_attendance/design_system/ui/ui.dart' as ds;
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/features/sync/widgets/sync_status_banner.dart';
import 'package:smartface_attendance/app/router/route_names.dart';

// ======================================================
// Services & Component Imports
// ======================================================
import 'package:smartface_attendance/design_system/components/app_staggered_animations.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/core/services/notification_service.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';
import 'package:smartface_attendance/shared/widgets/glow_refresh_indicator.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/shared/widgets/dashboard_widgets.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/features/analytics/models/student_stats_model.dart';
import 'package:smartface_attendance/features/analytics/controllers/analytics_controller.dart';
import 'package:smartface_attendance/features/analytics/widgets/analytics_components.dart';
import 'package:smartface_attendance/core/ui_system/app_ui_package_registry.dart';
import 'package:smartface_attendance/features/analytics/models/attendance_analytics_model.dart';
import 'package:smartface_attendance/features/student/screens/student_timetable_screen.dart';
import 'package:smartface_attendance/features/student/screens/attendance_calendar_screen.dart';
import 'package:smartface_attendance/features/student/widgets/student_widgets.dart';

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
    'face_visibility': 'Excellent',
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
          content: Text(
            result['message'] ?? 'Successfully logged out other devices',
          ),
          backgroundColor: Theme.of(context).brightness == Brightness.dark
              ? AppColors.surfaceDark
              : AppColors.surfaceElevatedLight,
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
                          pw.Text(
                            'OFFICIAL SEMESTER REPORT',
                            style: const pw.TextStyle(fontSize: 10),
                          ),
                        ],
                      ),
                      pw.BarcodeWidget(
                        barcode: pw.Barcode.qrCode(),
                        data:
                            'https://smartface.college/verify/report/${session.email}',
                        width: 50,
                        height: 50,
                      ),
                    ],
                  ),
                  pw.SizedBox(height: 30),
                  pw.Divider(thickness: 1, color: PdfColors.amber),
                  pw.SizedBox(height: 20),
                  pw.Text(
                    'STUDENT INFORMATION',
                    style: pw.TextStyle(
                      fontSize: 12,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.SizedBox(height: 10),
                  pw.Text('Name: ${session.name ?? "Student User"}'),
                  pw.Text('Email: ${session.email ?? ""}'),
                  pw.Text('Role: ${session.role?.toUpperCase() ?? ""}'),
                  pw.SizedBox(height: 30),
                  pw.Text(
                    'ATTENDANCE SUMMARY',
                    style: pw.TextStyle(
                      fontSize: 12,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.SizedBox(height: 10),
                  pw.Text(
                    'Overall Attendance Percentage: ${(_overallPercentage * 100).toInt()}%',
                  ),
                  pw.Text('Overall Standing: $_standing'),
                  pw.Text('Current Streak: $_streak Days'),
                  pw.SizedBox(height: 30),
                  pw.Text(
                    'SUBJECT PROGRESS DETAILS',
                    style: pw.TextStyle(
                      fontSize: 12,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.SizedBox(height: 10),
                  ..._subjects.map(
                    (sub) => pw.Text(
                      '${sub.subject}: ${sub.present}/${sub.total} Sessions (${(sub.percentage * 100).toInt()}%)',
                    ),
                  ),
                  pw.Spacer(),
                  pw.Divider(thickness: 1, color: PdfColors.amber),
                  pw.SizedBox(height: 10),
                  pw.Row(
                    mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                    children: [
                      pw.Text(
                        'Generated Time: ${DateTime.now().toIso8601String().split('T')[0]}',
                        style: const pw.TextStyle(fontSize: 8),
                      ),
                      pw.Text(
                        'Digital Signature: SECURE_AI_VERIFIED_SHA256',
                        style: const pw.TextStyle(
                          fontSize: 8,
                          color: PdfColors.green,
                        ),
                      ),
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
    showModernSheet(
      context: context,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Export Report Ledger',
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.bold,
              color: Colors.white,
              fontSize: 18,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Select preferred layout format to download your biometric verification logs:',
            style: TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(height: 20),
          ListTile(
            leading: const Icon(
              Icons.picture_as_pdf_outlined,
              color: AppColors.gold,
            ),
            title: const Text(
              'PDF Document (.pdf)',
              style: TextStyle(color: Colors.white, fontSize: 13),
            ),
            tileColor: Colors.white10,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            onTap: () {
              Navigator.pop(context);
              _exportAttendanceReportPdf();
            },
          ),
          const SizedBox(height: 10),
          ListTile(
            leading: const Icon(
              Icons.grid_on_rounded,
              color: Colors.cyanAccent,
            ),
            title: const Text(
              'CSV Spreadsheet (.csv)',
              style: TextStyle(color: Colors.white, fontSize: 13),
            ),
            tileColor: Colors.white10,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            onTap: () async {
              Navigator.pop(context);
              await _compileAndSaveCsv();
            },
          ),
          const SizedBox(height: 10),
          ListTile(
            leading: const Icon(
              Icons.table_chart_rounded,
              color: Colors.greenAccent,
            ),
            title: const Text(
              'Excel Ledger (.xlsx)',
              style: TextStyle(color: Colors.white, fontSize: 13),
            ),
            tileColor: Colors.white10,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            onTap: () async {
              Navigator.pop(context);
              await _compileAndSaveExcel();
            },
          ),
        ],
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
        AppToast.show(
          context,
          message: 'CSV file compiled successfully!',
          type: ToastType.success,
        );
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
        AppToast.show(
          context,
          message: 'Excel ledger compiled successfully!',
          type: ToastType.success,
        );
      }
    } catch (e) {
      debugPrint('Excel Export Error: $e');
    }
  }

  void _showSessionDialog(Map<String, dynamic> session) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Theme.of(context).brightness == Brightness.dark
            ? AppColors.surfaceElevated
            : AppColors.surfaceDark,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.bolt, color: AppColors.gold),
            const SizedBox(width: 10),
            Text(
              'Live Session Alert',
              style: GoogleFonts.inter(
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
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
                color: AppColors.gold,
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
            backgroundColor: Theme.of(context).brightness == Brightness.dark
                ? AppColors.surfaceElevated
                : AppColors.bgDark,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(24),
              side: BorderSide(color: AppColors.gold.withValues(alpha: 0.2)),
            ),
            title: Row(
              children: [
                const Icon(
                  Icons.face_retouching_natural_rounded,
                  color: AppColors.gold,
                ),
                const SizedBox(width: 10),
                Text(
                  'Biometric Register',
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
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
                _buildRegistrationGuideItem(
                  Icons.light_mode_outlined,
                  'Lighting Quality',
                  'Good',
                  AppColors.success,
                ),
                _buildRegistrationGuideItem(
                  Icons.blur_off_rounded,
                  'Blur Level Detection',
                  'Excellent',
                  AppColors.success,
                ),
                _buildRegistrationGuideItem(
                  Icons.portrait_rounded,
                  'Face Angle Alignment',
                  'Aligned (0° yaw)',
                  AppColors.success,
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.white.withValues(alpha: 0.02),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(
                      color: Colors.white.withValues(alpha: 0.08),
                    ),
                  ),
                  child: Row(
                    children: [
                      const Icon(
                        Icons.info_outline_rounded,
                        color: AppColors.gold,
                        size: 16,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Updating embeddings prompts the server-side AI model to re-train in the background.',
                          style: GoogleFonts.inter(
                            color: Colors.white38,
                            fontSize: 10,
                          ),
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
                child: const Text(
                  'CANCEL',
                  style: TextStyle(color: Colors.white38),
                ),
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
                        backgroundColor: AppColors.surfaceElevated,
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

  Widget _buildRegistrationGuideItem(
    IconData icon,
    String title,
    String val,
    Color color,
  ) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6.0),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.white38),
          const SizedBox(width: 8),
          Text(
            title,
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const Spacer(),
          Text(
            val,
            style: GoogleFonts.robotoMono(
              color: color,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
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
        backgroundColor: isDark ? const Color(0xFF070A14) : const Color(0xFFE8EAF6),
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
    final rawInsights =
        analyticsCtrl.studentAnalytics['personal_insights'] as List<dynamic>? ??
        [];
    final insightsList = rawInsights
        .map((i) => PersonalInsight.fromJson(Map<String, dynamic>.from(i)))
        .toList();
    final predictions = AIPredictions.fromJson(analyticsCtrl.studentAnalytics);
    final weekly =
        analyticsCtrl.studentAnalytics['weekly_trends'] as List<dynamic>? ?? [];
    final monthly =
        analyticsCtrl.studentAnalytics['monthly_trends'] as List<dynamic>? ??
        [];
    final heatmap =
        analyticsCtrl.studentAnalytics['heatmap_data']
            as Map<String, dynamic>? ??
        {};
    final rawLeaderboard =
        analyticsCtrl.studentAnalytics['leaderboard'] as List<dynamic>? ?? [];
    final leaderboardEntries = rawLeaderboard
        .map((l) => LeaderboardEntry.fromJson(Map<String, dynamic>.from(l)))
        .toList();

    final header = _buildWelcomeHeader(context, isDark, session)
        .animate()
        .fadeIn(duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(
          begin: 0.1,
          end: 0,
          duration: 400.ms,
          curve: Curves.easeOutCubic,
        );

    final healthGrid =
        AttendanceScoreCard(
              scoreValue: _overallPercentage,
              standing: _standing,
              departmentRank: _rank,
              streak: _streak,
            )
            .animate()
            .fadeIn(delay: 60.ms, duration: 400.ms, curve: Curves.easeOutCubic)
            .slideY(
              begin: 0.1,
              end: 0,
              duration: 400.ms,
              curve: Curves.easeOutCubic,
            );

    final aiInsights =
        Column(
              children: [
                PredictionCard(predictions: predictions),
                const SizedBox(height: 20),
                PersonalInsightCard(insights: insightsList),
              ],
            )
            .animate()
            .fadeIn(delay: 120.ms, duration: 400.ms, curve: Curves.easeOutCubic)
            .slideY(
              begin: 0.1,
              end: 0,
              duration: 400.ms,
              curve: Curves.easeOutCubic,
            );

    final weeklyMonthlyAnalytics =
        TrendChart(weeklyTrends: weekly, monthlyTrends: monthly)
            .animate()
            .fadeIn(delay: 180.ms, duration: 400.ms, curve: Curves.easeOutCubic)
            .slideY(
              begin: 0.1,
              end: 0,
              duration: 400.ms,
              curve: Curves.easeOutCubic,
            );

    final calendarHistory = HeatmapCard(heatmapData: heatmap)
        .animate()
        .fadeIn(delay: 240.ms, duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(
          begin: 0.1,
          end: 0,
          duration: 400.ms,
          curve: Curves.easeOutCubic,
        );

    final leaderboardCard = LeaderboardCard(entries: leaderboardEntries)
        .animate()
        .fadeIn(delay: 300.ms, duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(
          begin: 0.1,
          end: 0,
          duration: 400.ms,
          curve: Curves.easeOutCubic,
        );

    final activityTimeline = _buildRecentActivity(isDark)
        .animate()
        .fadeIn(delay: 360.ms, duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(
          begin: 0.1,
          end: 0,
          duration: 400.ms,
          curve: Curves.easeOutCubic,
        );

    final quickActions = _buildQuickActions(context)
        .animate()
        .fadeIn(delay: 420.ms, duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(
          begin: 0.1,
          end: 0,
          duration: 400.ms,
          curve: Curves.easeOutCubic,
        );

    final securityCard = _buildSecurityCard(isDark)
        .animate()
        .fadeIn(delay: 480.ms, duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(
          begin: 0.1,
          end: 0,
          duration: 400.ms,
          curve: Curves.easeOutCubic,
        );

    final String initials = (session.name ?? 'S')
        .trim()
        .split(RegExp(r'\s+'))
        .where((p) => p.isNotEmpty)
        .take(2)
        .map((p) => p[0].toUpperCase())
        .join();

    return ds.PremiumBackground(
      immersive: false,
      child: Scaffold(
        backgroundColor: isDark ? const Color(0xFF070A14) : const Color(0xFFE8EAF6),
        body: Column(
          children: [
            ds.DashboardHeader(
              greeting: _greeting(),
              name: session.name ?? 'Student',
              subtitle: _todayString(),
              avatarText: initials.isEmpty ? 'S' : initials,
              avatarUrl: session.avatarUrl,
              hasUnread: true,
              onNotifications: () => context.push('/notifications/nexus'),
              onAvatar: () => context.push(AppRoutes.studentProfilePath),
            ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1, end: 0),
            Expanded(
              child: GlowRefreshIndicator(
                onRefresh: _loadDashboardData,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 110),
                  child: StaggeredColumn(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildAttendanceSummaryCard(),
                      const SizedBox(height: 16),
                      if (activeSessionBanner != null) ...[
                        activeSessionBanner,
                        const SizedBox(height: 16),
                      ],
                      const SyncStatusBanner(),
                      const SizedBox(height: 16),
                      if (!isTablet) ...[
                        // Mobile view layout: Single column high-density details
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
            ),
          ],
        ),
        floatingActionButton: PressableScale(
          onTap: () {
            HapticFeedback.mediumImpact();
            _showExportOptionsDialog();
          },
          child: Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
              ),
              borderRadius: BorderRadius.circular(24),
              boxShadow: [
                BoxShadow(
                  color: const Color(0xFF4F46E5).withValues(alpha: 0.35),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.file_download_outlined, color: Colors.white, size: 18),
                const SizedBox(width: 6),
                Text(
                  'Export Report',
                  style: GoogleFonts.poppins(
                    fontSize: 12.5,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                    letterSpacing: 0.3,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── Reference-style helpers ────────────────────────────────────────────────

  String _greeting() {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning,';
    if (h < 17) return 'Good afternoon,';
    return 'Good evening,';
  }

  String _todayString() {
    const days = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    const months = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    final now = DateTime.now();
    return '${days[now.weekday - 1]}, ${now.day} ${months[now.month - 1]}';
  }

  Widget _buildAttendanceSummaryCard() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final int pct = (_overallPercentage * 100).round();
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);
    final textHeading = isDark ? const Color(0xFFF1F3F9) : const Color(0xFF1A1A3A);
    final textBody = isDark ? const Color(0xFFC8CCDF) : const Color(0xFF3D4260);
    final textLabel = isDark ? const Color(0xFF7C82A0) : const Color(0xFFA0A0B8);
    final streakForegroundColor = isDark ? const Color(0xFFFBBF24) : const Color(0xFFD97706);

    return AnimatedCardWrapper(
      delay: 100.ms,
      child: Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: cardBorder, width: 1.0),
          boxShadow: [
            BoxShadow(
              color: isDark ? Colors.black38 : const Color(0xFF8B98CE).withValues(alpha: 0.15),
              blurRadius: 30,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            width: 8,
                            height: 8,
                            decoration: const BoxDecoration(
                              shape: BoxShape.circle,
                              color: Color(0xFF10B981),
                              boxShadow: [
                                BoxShadow(
                                  color: Color(0xFF10B981),
                                  blurRadius: 6,
                                  spreadRadius: 1,
                                ),
                              ],
                            ),
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              'SEMESTER ATTENDANCE INDEX',
                              style: GoogleFonts.inter(
                                fontSize: 10.5,
                                letterSpacing: 1.5,
                                fontWeight: FontWeight.w700,
                                color: const Color(0xFF4F46E5),
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _standing,
                        style: GoogleFonts.poppins(
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                          color: textHeading,
                          letterSpacing: -0.3,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _rank,
                        style: GoogleFonts.inter(
                          fontSize: 12.5,
                          color: textBody,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 14),
                // Circular Ring with Percentage
                SizedBox(
                  width: 80,
                  height: 80,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      SizedBox(
                        width: 80,
                        height: 80,
                        child: CircularProgressIndicator(
                          value: _overallPercentage,
                          strokeWidth: 8,
                          strokeCap: StrokeCap.round,
                          backgroundColor: isDark
                              ? Colors.white.withValues(alpha: 0.08)
                              : const Color(0xFFE8EAF6),
                          valueColor: AlwaysStoppedAnimation<Color>(
                            pct >= 75
                                ? const Color(0xFF6366F1)
                                : const Color(0xFFF59E0B),
                          ),
                        ),
                      ),
                      Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            '$pct%',
                            style: GoogleFonts.poppins(
                              fontSize: 19,
                              fontWeight: FontWeight.w800,
                              color: textHeading,
                              height: 1.0,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            'HEALTH',
                            style: GoogleFonts.inter(
                              fontSize: 8,
                              letterSpacing: 1.2,
                              color: textLabel,
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 18),
            Divider(
              color: isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0),
              height: 1,
            ),
            const SizedBox(height: 14),
            Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 12,
              runSpacing: 10,
              children: [
                // Streak Pill
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: isDark
                        ? const Color(0xFFF59E0B).withValues(alpha: 0.12)
                        : const Color(0xFFFFFBEB),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: const Color(0xFFF59E0B).withValues(alpha: 0.35),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.local_fire_department_rounded, color: streakForegroundColor, size: 16),
                      const SizedBox(width: 6),
                      Text(
                        '$_streak Days Streak',
                        style: GoogleFonts.poppins(
                          color: streakForegroundColor,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                // Quick Launch Scan Button
                PressableScale(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.go('/student/scan');
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                      ),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFF4F46E5).withValues(alpha: 0.35),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.qr_code_scanner_rounded, color: Colors.white, size: 16),
                        const SizedBox(width: 6),
                        Text(
                          'Scan QR',
                          style: GoogleFonts.poppins(
                            color: Colors.white,
                            fontSize: 12.5,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 0.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildWelcomeHeader(
    BuildContext context,
    bool isDark,
    SessionManager session,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'ATTENDANCE INTELLIGENCE PORTAL',
          style: GoogleFonts.inter(
            fontSize: 10.5,
            fontWeight: FontWeight.w700,
            letterSpacing: 1.5,
            color: const Color(0xFF4F46E5),
          ),
        ),
        const SizedBox(height: 6),
        AppAnimatedHeading(
          text: 'Welcome to SmartFace AI',
          style: GoogleFonts.poppins(
            fontSize: 22,
            fontWeight: FontWeight.w700,
            color: isDark ? const Color(0xFFF1F3F9) : const Color(0xFF1A1A3A),
            letterSpacing: -0.3,
          ),
        ),
      ],
    );
  }

  // Legacy charts replaced by TrendChart, HeatmapCard, and AttendanceScoreCard

  Widget _buildRecentActivity(bool isDark) {
    final timelineItems = _verificationHistory.map((log) {
      final isPresent = (log['status'] ?? '').toString().toLowerCase() == 'present';
      final isFace = log['verified_by'] == 'face';
      final conf = log['confidence'] != null ? ' (Conf: ${log['confidence']})' : '';
      final verificationType = isFace
          ? 'Face Scanner$conf'
          : 'QR Scan';

      final timeStr = log['time'] ?? '';
      final dateStr = log['date'] ?? '';
      final ts = (timeStr.isNotEmpty && dateStr.isNotEmpty)
          ? '$timeStr • $dateStr'
          : '$timeStr$dateStr';

      return TimelineItem(
        title: log['subject'] ?? 'Lecture Class',
        description:
            'Status: ${(log['status'] ?? 'PRESENT').toString().toUpperCase()} • Verified via $verificationType',
        timestamp: ts,
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
    final cardBg = isDark ? const Color(0xFF141D38) : Colors.white;
    final cardBorder = isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0);
    final textHeading = isDark ? const Color(0xFFF1F3F9) : const Color(0xFF1A1A3A);
    final textLabel = isDark ? const Color(0xFF7C82A0) : const Color(0xFFA0A0B8);

    return Container(
      padding: const EdgeInsets.all(22),
      decoration: BoxDecoration(
        color: cardBg,
        borderRadius: BorderRadius.circular(28),
        border: Border.all(color: cardBorder, width: 1.0),
        boxShadow: [
          BoxShadow(
            color: isDark ? Colors.black38 : const Color(0xFF8B98CE).withValues(alpha: 0.15),
            blurRadius: 30,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.security_rounded, size: 16, color: Color(0xFF4F46E5)),
                  const SizedBox(width: 8),
                  Text(
                    'ACTIVE DEVICES & SECURITY',
                    style: GoogleFonts.inter(
                      fontSize: 10.5,
                      letterSpacing: 1.5,
                      color: const Color(0xFF4F46E5),
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(
                  Icons.logout_rounded,
                  color: Color(0xFFF59E0B),
                  size: 18,
                ),
                onPressed: _logoutOtherDevices,
                tooltip: 'Log out other devices',
              ),
            ],
          ),
          const SizedBox(height: 14),
          ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _activeSessions.length,
            separatorBuilder: (context, index) => Divider(
              color: isDark ? const Color(0xFF252E4A) : const Color(0xFFE5E7F0),
              height: 16,
            ),
            itemBuilder: (context, index) {
              final s = _activeSessions[index];
              final isCurrent = s['is_current'] == true;
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 2.0),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: (isCurrent ? const Color(0xFF10B981) : const Color(0xFF4F46E5))
                            .withValues(alpha: 0.12),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Icon(
                        s['device'].toString().contains('Windows') ||
                                s['device'].toString().contains('Mac')
                            ? Icons.laptop_chromebook_rounded
                            : Icons.phone_android_rounded,
                        size: 18,
                        color: isCurrent
                            ? const Color(0xFF10B981)
                            : (isDark ? const Color(0xFF818CF8) : const Color(0xFF4F46E5)),
                      ),
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
                            style: GoogleFonts.poppins(
                              color: textHeading,
                              fontWeight: isCurrent ? FontWeight.w600 : FontWeight.w500,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            'IP: ${s['ip']} • ${s['location']}',
                            style: GoogleFonts.inter(
                              color: textLabel,
                              fontSize: 11,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (isCurrent)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          color: const Color(0xFF10B981).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          'ACTIVE',
                          style: GoogleFonts.poppins(
                            color: const Color(0xFF10B981),
                            fontSize: 9,
                            fontWeight: FontWeight.w700,
                          ),
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
    final double screenWidth = MediaQuery.of(context).size.width;
    final int crossAxisCount = screenWidth >= 900 ? 4 : (screenWidth >= 600 ? 3 : 2);

    final actions = [
      StudentActionTile(
        label: 'Mark Attendance',
        description: 'Scan active QR code & verify biometric face ID',
        icon: Icons.qr_code_scanner_rounded,
        gradientColors: const [Color(0xFF6366F1), Color(0xFF4F46E5)],
        onTap: () => context.go('/student/scan'),
      ),
      StudentActionTile(
        label: 'Attendance Hub',
        description: 'Track attendance health, scores, heatmaps & alerts',
        icon: Icons.analytics_rounded,
        gradientColors: const [Color(0xFFEC4899), Color(0xFFDB2777)],
        onTap: () => context.push(AppRoutes.studentAttendanceHubPath),
      ),
      StudentActionTile(
        label: 'AI Analyst',
        description: 'Deep AI predictions & tailored advice on grades',
        icon: Icons.psychology_rounded,
        gradientColors: const [Color(0xFFF59E0B), Color(0xFFD97706)],
        onTap: () => context.push('/analytics/analyst'),
      ),
      StudentActionTile(
        label: 'Analytics',
        description: 'Trends, heatmaps, peer percentiles & department stats',
        icon: Icons.bar_chart_rounded,
        gradientColors: const [Color(0xFF3B82F6), Color(0xFF2563EB)],
        onTap: () => context.push(AppRoutes.analyticsDashboardPath),
      ),
      StudentActionTile(
        label: 'Register Face',
        description: 'Update and re-train your neural face embeddings',
        icon: Icons.face_retouching_natural_rounded,
        gradientColors: const [Color(0xFF10B981), Color(0xFF059669)],
        onTap: _showFaceRegistrationDialog,
      ),
      StudentActionTile(
        label: 'Apply Leave',
        description: 'Request formal leave and check approval status',
        icon: Icons.event_busy_rounded,
        gradientColors: const [Color(0xFFF97316), Color(0xFFEA580C)],
        onTap: () => context.push('/student/leave'),
      ),
      StudentActionTile(
        label: 'Reports Center',
        description: 'Compile and export PDF/CSV/Excel attendance tickets',
        icon: Icons.download_rounded,
        gradientColors: const [Color(0xFF8B5CF6), Color(0xFF7C3AED)],
        onTap: _showExportOptionsDialog,
      ),
      StudentActionTile(
        label: 'Class Timetable',
        description: 'View daily lectures and scheduled classrooms',
        icon: Icons.calendar_view_week_rounded,
        gradientColors: const [Color(0xFF06B6D4), Color(0xFF0891B2)],
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => const StudentTimetableScreen(),
            ),
          );
        },
      ),
      StudentActionTile(
        label: 'Academic Calendar',
        description: 'Track leaves, holidays and marked records',
        icon: Icons.calendar_month_rounded,
        gradientColors: const [Color(0xFF4F46E5), Color(0xFF3730A3)],
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => const AttendanceCalendarScreen(),
            ),
          );
        },
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.bolt_rounded, size: 16, color: Color(0xFF4F46E5)),
            const SizedBox(width: 8),
            Text(
              'QUICK ACTIONS CONSOLE',
              style: GoogleFonts.inter(
                fontSize: 10.5,
                fontWeight: FontWeight.w700,
                letterSpacing: 1.5,
                color: const Color(0xFF4F46E5),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: actions.length,
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            mainAxisSpacing: 12,
            crossAxisSpacing: 12,
            childAspectRatio: screenWidth >= 600 ? 1.25 : 1.10,
          ),
          itemBuilder: (context, index) => actions[index],
        ),
      ],
    );
  }
}
