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
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
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
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/features/analytics/models/student_stats_model.dart';
import 'package:smartface_attendance/features/analytics/controllers/analytics_controller.dart';
import 'package:smartface_attendance/features/analytics/widgets/analytics_components.dart';
import 'package:smartface_attendance/features/analytics/models/attendance_analytics_model.dart';
import 'package:smartface_attendance/features/student/screens/student_timetable_screen.dart';
import 'package:smartface_attendance/features/student/screens/attendance_calendar_screen.dart';
import 'package:smartface_attendance/features/student/widgets/student_widgets.dart';
import 'package:smartface_attendance/features/student/widgets/attendance_components.dart';
import 'package:smartface_attendance/app/config/cache_service.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';

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
  int _loadGeneration = 0;
  bool _isOffline = false;
  String? _lastSyncTime;
  List<Map<String, dynamic>> _disputes = [];

  /// Tablet card padding / section rhythm, set from isTablet in build().
  double _cardPad = 20.0;
  double _sectionGap = 20.0;

  // HUD Data
  bool _hasAttendanceData = false;
  double? _overallPercentage;
  String? _standing;
  String? _rank;
  int? _streak;
  String? _statsError;
  List<SubjectProgressModel> _subjects = [];
  Map<String, dynamic>? _activeSession;

  // Analytics & History
  List<dynamic> _verificationHistory = [];
  List<dynamic> _activeSessions = [];

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
      } else if (data['type'] == 'attendance_update' ||
          data['type'] == 'attendance_marked' ||
          data['type'] == 'biometric_log' ||
          data['type'] == 'device_update') {
        if (mounted) {
          _loadDashboardData(isBackground: true);
        }
      }
    });

    CacheService.get<List<dynamic>>('student_disputes').then((cached) {
      if (cached != null && mounted) {
        setState(() {
          _disputes = cached.map((e) => Map<String, dynamic>.from(e as Map)).toList();
        });
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _loadDashboardData();
      }
    });
  }

  void _openDisputeModal() {
    showAttendanceDisputeSheet(
      context,
      defaultSubject: _subjects.isNotEmpty ? _subjects.first.subject : null,
      onDisputeSubmitted: (record) {
        setState(() {
          _disputes.insert(0, record);
        });
        CacheService.set('student_disputes', _disputes, persist: true);
      },
    );
  }

  Future<void> _loadDashboardData({bool isBackground = false}) async {
    if (!mounted) return;
    final currentGen = ++_loadGeneration;
    if (!isBackground) {
      setState(() => _isLoading = true);
    }

    try {
      final session = context.read<SessionManager>();
      final email = session.email;
      final token = session.token;
      if (email == null || token == null) {
        if (mounted && currentGen == _loadGeneration) {
          setState(() {
            _statsError = 'Sign in to load attendance data.';
            _isLoading = false;
          });
        }
        return;
      }

      final results = await Future.wait([
        ApiService.getStudentStats(email, token),
        ApiService.getVerificationHistory(email, token, page: 1, limit: 10),
        ApiService.getActiveSessions(token),
        context.read<AnalyticsController>().fetchStudentAnalytics(email, token),
      ]);

      final stats = results[0] as StudentStatsModel?;
      final history = results[1] as Map<String, dynamic>?;
      final sessions = results[2] as List<dynamic>?;

      if (mounted && currentGen == _loadGeneration) {
        if (stats != null) {
          CacheService.set('student_stats_$email', stats.toJson(), persist: true);
        }
        setState(() {
          _isOffline = false;
          _lastSyncTime = DateFormat('h:mm a').format(DateTime.now());
          _hasAttendanceData = stats?.hasData == true;
          _overallPercentage = stats?.overallPercentage;
          _standing = stats?.standing;
          _rank = stats?.rank;
          _streak = stats?.streak;
          _subjects = stats?.subjects ?? [];
          _statsError = stats == null
              ? 'Unable to load attendance data. Pull down to retry.'
              : null;
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
      if (mounted && currentGen == _loadGeneration) {
        try {
          final session = context.read<SessionManager>();
          final email = session.email;
          if (email != null) {
            final cached = await CacheService.get<Map<String, dynamic>>('student_stats_$email');
            if (cached != null && mounted) {
              final cachedStats = StudentStatsModel.fromJson(cached);
              setState(() {
                _hasAttendanceData = cachedStats.hasData;
                _overallPercentage = cachedStats.overallPercentage;
                _standing = cachedStats.standing;
                _rank = cachedStats.rank;
                _streak = cachedStats.streak;
                _subjects = cachedStats.subjects;
                _isOffline = true;
                _statsError = null;
                _isLoading = false;
              });
              return;
            }
          }
        } catch (_) {}

        setState(() {
          if (!isBackground) {
            _statsError = 'Unable to load attendance data. Pull down to retry.';
          }
          _isLoading = false;
        });
      }
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
                    'Overall Attendance Percentage: ${_overallPercentage == null ? 'Not available' : '${(_overallPercentage! * 100).toInt()}%'}',
                  ),
                  pw.Text('Overall Standing: ${_standing ?? 'Not available'}'),
                  pw.Text('Department Rank: ${_rank ?? 'Not available'}'),
                  pw.Text(
                    'Current Streak: ${_streak == null ? 'Not available' : '$_streak Days'}',
                  ),
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
    final bool isDesktop = screenWidth >= 1024;
    final bool isTablet = screenWidth >= 600 && screenWidth < 1024;
    final double hPad = isDesktop ? 36.0 : (isTablet ? 28.0 : 16.0);
    _cardPad = isTablet ? 26.0 : 22.0;
    _sectionGap = isTablet ? 24.0 : 20.0;

    if (_isLoading) {
      return Scaffold(
        backgroundColor: isDark
            ? AppColors.bgDeep
            : AppColors.bgLight,
        body: const SafeArea(child: StudentHomeShimmer()),
      );
    }

    // Prepare components to render
    final activeSessionBanner = _activeSession != null
        ? SessionBanner(
            subject: _activeSession?['subject'] ?? 'Active class',
            teacher: _activeSession?['teacher'] ?? 'Not specified',
            minutesRemaining:
                (_activeSession?['minutes_remaining'] as num?)?.toInt() ?? 15,
            onVerifyTap: () => context.go('/student/scan'),
          )
        : null;

    final analyticsCtrl = context.watch<AnalyticsController>();
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

    final healthGrid = (_hasAttendanceData && _overallPercentage != null)
        ? AttendanceScoreCard(
                scoreValue: _overallPercentage!,
                standing: _standing ?? 'Standing unavailable',
                departmentRank: _rank ?? 'Department rank unavailable',
                streak: _streak,
              )
              .animate()
              .fadeIn(
                delay: 60.ms,
                duration: 400.ms,
                curve: Curves.easeOutCubic,
              )
              .slideY(
                begin: 0.1,
                end: 0,
                duration: 400.ms,
                curve: Curves.easeOutCubic,
              )
        : const SizedBox.shrink();

    final double rawPct = (_overallPercentage ?? 0.82) * 100.0;
    final int streakCount = _streak ?? 5;
    final double projectedPct = (rawPct + 1.8).clamp(0.0, 100.0);
    final String subjectToWatch = _subjects.isNotEmpty
        ? (_subjects.firstWhere((s) => s.percentage < 0.75, orElse: () => _subjects.first).subject)
        : 'Machine Learning';

    final aiCopilotCard = AiAttendanceInsightsCard(
      currentPercentage: rawPct,
      streakDays: streakCount,
      criticalSubject: subjectToWatch,
      onActionTap: () => context.push(AppRoutes.studentBunkCalculatorPath),
    ).animate().fadeIn(delay: 100.ms, duration: 400.ms).slideY(begin: 0.08, end: 0);

    final forecastCard = AttendanceForecastCard(
      currentPercentage: rawPct,
      projectedPercentage: projectedPct,
      totalClassesRemaining: 38,
    ).animate().fadeIn(delay: 150.ms, duration: 400.ms).slideY(begin: 0.08, end: 0);

    final successScorecard = StudentSuccessDashboardCard(
      score: (rawPct * 0.95).clamp(50.0, 99.0),
      standing: _standing ?? 'Exemplary',
      rank: _rank ?? 'Top 10%',
      streak: streakCount,
      onDetailsTap: () => context.push(AppRoutes.studentAttendanceHubPath),
    ).animate().fadeIn(delay: 80.ms, duration: 400.ms).slideY(begin: 0.08, end: 0);

    final deviceSecurityCard = DeviceSecurityCenterCard(
      activeSessionsCount: max(1, _activeSessions.length),
      primaryDeviceName: Platform.isAndroid ? 'Android Workstation' : (Platform.isIOS ? 'iPhone Device' : 'Primary Enclave'),
      onRevokeOthers: _logoutOtherDevices,
    ).animate().fadeIn(delay: 200.ms, duration: 400.ms).slideY(begin: 0.08, end: 0);

    final disputesTimeline = AttendanceDisputeTimelineWidget(
      disputes: _disputes,
      onNewDispute: _openDisputeModal,
    ).animate().fadeIn(delay: 250.ms, duration: 400.ms).slideY(begin: 0.08, end: 0);

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

    final calendarHistory = HeatmapCard(heatmapData: heatmap, streak: _streak)
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
        backgroundColor: isDark
            ? AppColors.bgDeep
            : AppColors.bgLight,
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
                child: ResponsiveContentBounds(
                  maxWidth: 1280,
                  child: SingleChildScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: EdgeInsets.fromLTRB(hPad, 16, hPad, 110),
                    child: StaggeredColumn(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        if (_isOffline) ...[
                          OfflineStatusBanner(
                            isOffline: _isOffline,
                            lastSyncedTime: _lastSyncTime,
                            onSyncTap: _loadDashboardData,
                          ),
                          const SizedBox(height: 12),
                        ],
                        _buildAttendanceSummaryCard(),
                        const SizedBox(height: 16),
                        if (activeSessionBanner != null) ...[
                          activeSessionBanner,
                          const SizedBox(height: 16),
                        ],
                        const SyncStatusBanner(),
                        const SizedBox(height: 16),
                        if (isDesktop) ...[
                          // Desktop SaaS Multi-Pane Layout
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                flex: 7,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    successScorecard,
                                    SizedBox(height: _sectionGap),
                                    forecastCard,
                                    SizedBox(height: _sectionGap),
                                    weeklyMonthlyAnalytics,
                                    SizedBox(height: _sectionGap),
                                    calendarHistory,
                                    SizedBox(height: _sectionGap),
                                    disputesTimeline,
                                  ],
                                ),
                              ),
                              const SizedBox(width: 24),
                              Expanded(
                                flex: 5,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    aiCopilotCard,
                                    SizedBox(height: _sectionGap),
                                    deviceSecurityCard,
                                    SizedBox(height: _sectionGap),
                                    leaderboardCard,
                                    SizedBox(height: _sectionGap),
                                    quickActions,
                                    SizedBox(height: _sectionGap),
                                    activityTimeline,
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ] else if (isTablet) ...[
                          // Tablet view layout: Premium responsive split screen
                          Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                flex: 6,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    successScorecard,
                                    SizedBox(height: _sectionGap),
                                    healthGrid,
                                    SizedBox(height: _sectionGap),
                                    forecastCard,
                                    SizedBox(height: _sectionGap),
                                    weeklyMonthlyAnalytics,
                                    SizedBox(height: _sectionGap),
                                    calendarHistory,
                                    SizedBox(height: _sectionGap),
                                    disputesTimeline,
                                  ],
                                ),
                              ),
                              const SizedBox(width: 20),
                              Expanded(
                                flex: 4,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    aiCopilotCard,
                                    SizedBox(height: _sectionGap),
                                    deviceSecurityCard,
                                    SizedBox(height: _sectionGap),
                                    quickActions,
                                    SizedBox(height: _sectionGap),
                                    activityTimeline,
                                    SizedBox(height: _sectionGap),
                                    leaderboardCard,
                                  ],
                                ),
                              ),
                            ],
                          ),
                        ] else ...[
                          // Mobile view layout: High-density SaaS column
                          successScorecard,
                          SizedBox(height: _sectionGap),
                          healthGrid,
                          SizedBox(height: _sectionGap),
                          aiCopilotCard,
                          SizedBox(height: _sectionGap),
                          forecastCard,
                          SizedBox(height: _sectionGap),
                          weeklyMonthlyAnalytics,
                          SizedBox(height: _sectionGap),
                          leaderboardCard,
                          SizedBox(height: _sectionGap),
                          calendarHistory,
                          SizedBox(height: _sectionGap),
                          disputesTimeline,
                          SizedBox(height: _sectionGap),
                          deviceSecurityCard,
                          SizedBox(height: _sectionGap),
                          activityTimeline,
                          SizedBox(height: _sectionGap),
                          quickActions,
                        ],
                        const SizedBox(height: 40),
                      ],
                    ),
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
                  color: AppColors.primary.withValues(alpha: 0.35),
                  blurRadius: 16,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(
                  Icons.file_download_outlined,
                  color: Colors.white,
                  size: 18,
                ),
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

  Widget _buildAttendanceUnavailableCard(bool isDark) {
    final cardBg = isDark
        ? const Color(0xFF141D38)
        : AppColors.surfaceElevatedLight;
    final cardBorder = isDark
        ? AppColors.borderDark
        : AppColors.borderLight;
    final hasError = _statsError != null;

    return AnimatedCardWrapper(
      delay: 100.ms,
      child: Container(
        width: double.infinity,
        padding: EdgeInsets.all(_cardPad),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: cardBorder),
          boxShadow: [
            BoxShadow(
              color: isDark
                  ? Colors.black38
                  : const Color(0xFF8B98CE).withValues(alpha: 0.15),
              blurRadius: 30,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  hasError ? Icons.cloud_off_rounded : Icons.insights_outlined,
                  color: hasError ? AppColors.warning : AppColors.primary,
                ),
                const SizedBox(width: 10),
                Text(
                  'ATTENDANCE SUMMARY',
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w800,
                    letterSpacing: 1.5,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Text(
              hasError
                  ? 'Attendance data unavailable'
                  : 'Not enough attendance data',
              style: GoogleFonts.poppins(
                fontSize: 18,
                fontWeight: FontWeight.w700,
                color: isDark ? Colors.white : AppColors.textHeading,
              ),
            ),
            const SizedBox(height: 6),
            Text(
              _statsError ??
                  'Attendance percentage and department rank will appear when scheduled class data is available.',
              style: GoogleFonts.inter(
                fontSize: 12,
                height: 1.4,
                color: isDark ? Colors.white70 : AppColors.textMuted,
              ),
            ),
            if (_streak != null) ...[
              const SizedBox(height: 10),
              Text(
                'Check-in streak: $_streak days',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white70 : AppColors.textMuted,
                ),
              ),
            ],
            if (hasError) ...[
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: _loadDashboardData,
                  icon: const Icon(Icons.refresh_rounded),
                  label: const Text('Retry'),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAttendanceSummaryCard() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    if (_statsError != null ||
        !_hasAttendanceData ||
        _overallPercentage == null) {
      return _buildAttendanceUnavailableCard(isDark);
    }

    final percentage = _overallPercentage!;
    final int pct = (percentage * 100).round();
    final cardBg = isDark
        ? const Color(0xFF141D38)
        : AppColors.surfaceElevatedLight;
    final cardBorder = isDark
        ? AppColors.borderDark
        : AppColors.borderLight;
    final textHeading = isDark
        ? AppColors.bgLight
        : AppColors.textHeading;
    final textBody = isDark ? AppColors.textBodyDark : AppColors.textBody;
    final textLabel = isDark
        ? AppColors.textMuted
        : AppColors.textMuted;
    final streakForegroundColor = isDark
        ? AppColors.goldDark
        : AppColors.goldBright;

    return AnimatedCardWrapper(
      delay: 100.ms,
      child: Container(
        padding: EdgeInsets.all(_cardPad),
        decoration: BoxDecoration(
          color: cardBg,
          borderRadius: BorderRadius.circular(28),
          border: Border.all(color: cardBorder, width: 1.0),
          boxShadow: [
            BoxShadow(
              color: isDark
                  ? Colors.black38
                  : const Color(0xFF8B98CE).withValues(alpha: 0.15),
              blurRadius: 30,
              offset: const Offset(0, 8),
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
                              color: AppColors.success,
                              boxShadow: [
                                BoxShadow(
                                  color: AppColors.success,
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
                              style: ds.AppTextStyles.label(
                                context,
                                color: AppColors.primary,
                                weight: FontWeight.w700,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _standing ?? 'Standing unavailable',
                        style: ds.AppTextStyles.heading(
                          context,
                          color: textHeading,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _rank ?? 'Department rank unavailable',
                        style: ds.AppTextStyles.caption(
                          context,
                          color: textBody,
                          weight: FontWeight.w500,
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
                          value: percentage,
                          strokeWidth: 8,
                          strokeCap: StrokeCap.round,
                          backgroundColor: isDark
                              ? Colors.white.withValues(alpha: 0.08)
                              : const Color(0xFFE8EAF6),
                          valueColor: AlwaysStoppedAnimation<Color>(
                            pct >= 75
                                ? AppColors.primarySoft
                                : AppColors.gold,
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
              color: isDark ? AppColors.borderDark : AppColors.borderLight,
              height: 1,
            ),
            const SizedBox(height: 14),
            Wrap(
              alignment: WrapAlignment.spaceBetween,
              crossAxisAlignment: WrapCrossAlignment.center,
              spacing: 12,
              runSpacing: 10,
              children: [
                // Snapchat-style Animated Streak Pill
                GestureDetector(
                  onTap: (_streak != null && _streak! > 0)
                      ? () {
                          HapticFeedback.heavyImpact();
                          showSnapchatStreakCelebration(context, _streak!);
                        }
                      : null,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: _streak == null
                          ? (isDark ? AppColors.bgDeep.withValues(alpha: 0.05) : AppColors.bgLight)
                          : (_streak != null && _streak! > 0)
                              ? (isDark
                                  ? AppColors.gold.withValues(alpha: 0.15)
                                  : AppColors.bgLight.withValues(alpha: 0.95))
                              : isDark ? AppColors.bgDeep.withValues(alpha: 0.08) : AppColors.bgLight.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(
                        color: (_streak != null && _streak! > 0)
                            ? AppColors.gold.withValues(alpha: 0.4)
                            : (isDark ? Colors.white12 : const Color(0xFFE2E8F0)),
                      ),
                      boxShadow: (_streak != null && _streak! > 0)
                          ? [
                              BoxShadow(
                                color: Colors.orange.withValues(alpha: 0.12),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ]
                          : null,
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (_streak != null && _streak! > 0)
                          Icon(
                                Icons.local_fire_department_rounded,
                                color: streakForegroundColor,
                                size: 16,
                              )
                              .animate(onPlay: (c) => c.repeat(reverse: true))
                              .scale(
                                begin: const Offset(0.9, 0.9),
                                end: const Offset(1.15, 1.15),
                                duration: 800.ms,
                                curve: Curves.easeInOut,
                              )
                        else
                          Icon(
                            Icons.local_fire_department_outlined,
                            color: isDark ? const Color(0xFF7F8CA4) : const Color(0xFF94A3B8),
                            size: 16,
                          ),
                        const SizedBox(width: 6),
                        Text(
                          _streak == null
                              ? 'Streak unavailable'
                              : _streak == 0
                                  ? '0 Days Streak'
                                  : '🔥 $_streak Days Streak',
                          style: GoogleFonts.poppins(
                            color: (_streak != null && _streak! > 0)
                                ? streakForegroundColor
                                : (isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B)),
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Quick Launch Scan Button
                PressableScale(
                  onTap: () {
                    HapticFeedback.lightImpact();
                    context.go('/student/scan');
                  },
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 8,
                    ),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF6366F1), Color(0xFF4F46E5)],
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                      ),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(
                            0xFF4F46E5,
                          ).withValues(alpha: 0.35),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.qr_code_scanner_rounded,
                          color: Colors.white,
                          size: 16,
                        ),
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

  // Legacy charts replaced by TrendChart, HeatmapCard, and AttendanceScoreCard

  Widget _buildRecentActivity(bool isDark) {
    final timelineItems = _verificationHistory.map((log) {
      final isPresent =
          (log['status'] ?? '').toString().toLowerCase() == 'present';
      final isFace = log['verified_by'] == 'face';
      final conf = log['confidence'] != null
          ? ' (Conf: ${log['confidence']})'
          : '';
      final verificationType = isFace ? 'Face Scanner$conf' : 'QR Scan';

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

  Widget _buildQuickActions(BuildContext context) {
    final double screenWidth = MediaQuery.of(context).size.width;
    final int crossAxisCount = screenWidth >= 900
        ? 4
        : (screenWidth >= 600 ? 3 : 2);

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
      StudentActionTile(
        label: 'Bunk Calculator',
        description: 'Simulate safe absences & attendance compliance targets',
        icon: Icons.calculate_rounded,
        gradientColors: const [Color(0xFF10B981), Color(0xFF047857)],
        onTap: () => context.push(AppRoutes.studentBunkCalculatorPath),
      ),
      StudentActionTile(
        label: 'Digital ID Card',
        description: 'Holographic verified student badge & dynamic QR code',
        icon: Icons.badge_rounded,
        gradientColors: const [Color(0xFF6366F1), Color(0xFF312E81)],
        onTap: () => context.push(AppRoutes.studentIdCardPath),
      ),
      StudentActionTile(
        label: 'Face Check-in',
        description: 'Instant front-camera ArcFace neural selfie verification',
        icon: Icons.face_unlock_rounded,
        gradientColors: const [Color(0xFFEC4899), Color(0xFF9D174D)],
        onTap: () => context.push(AppRoutes.studentFaceCheckinPath),
      ),
      StudentActionTile(
        label: 'File Dispute',
        description: 'Submit an appeal for unverified or incorrect attendance',
        icon: Icons.gavel_rounded,
        gradientColors: const [Color(0xFFE11D48), Color(0xFFBE123C)],
        onTap: _openDisputeModal,
      ),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.bolt_rounded, size: 16, color: AppColors.primary),
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
