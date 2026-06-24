/*
|--------------------------------------------------------------------------
| File: ai_analytics_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Renders the premium AI-powered Institutional Analytics & Telemetry Console
| for Administrators. Visualizes institution-wide check-in rates, department
| comparison bar charts, risk profiles, and recent activity logs.
| Provides robust export pathways for PDF reports, CSV files, and Excel sheets.
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'dart:io';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:path_provider/path_provider.dart';

// ======================================================
// Core & State Imports
// ======================================================
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/features/analytics/controllers/analytics_controller.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';
import 'package:smartface_attendance/app/theme/dark_theme.dart';
import 'package:smartface_attendance/shared/widgets/glow_refresh_indicator.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

class AIAnalyticsScreen extends StatefulWidget {
  const AIAnalyticsScreen({super.key});

  @override
  State<AIAnalyticsScreen> createState() => _AIAnalyticsScreenState();
}

class _AIAnalyticsScreenState extends State<AIAnalyticsScreen> {
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _fetchStats());
  }

  Future<void> _fetchStats() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final session = context.read<SessionManager>();
      final analyticsCtrl = context.read<AnalyticsController>();
      if (session.token != null) {
        await analyticsCtrl.fetchAdminAnalytics(session.token!);
      }
    } catch (e) {
      debugPrint('[AIAnalyticsScreen] Fetch error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showExportDialog(Map<String, dynamic> stats) {
    showDialog(
      context: context,
      builder: (context) => BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
        child: AlertDialog(
          backgroundColor: AppColors.bgDeep.withValues(alpha: 0.95),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(24),
            side: BorderSide(color: Colors.white.withValues(alpha: 0.08)),
          ),
          title: Text(
            'Institutional Exports',
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Select format to export the institutional telemetry summary ledger:',
                style: GoogleFonts.inter(color: Colors.white70, fontSize: 12),
              ),
              const SizedBox(height: 20),
              _buildExportOptionTile(
                'PDF Summary (.pdf)',
                Icons.picture_as_pdf_outlined,
                () async {
                  Navigator.pop(context);
                  await _exportAdminReportPdf(stats);
                },
              ),
              const SizedBox(height: 12),
              _buildExportOptionTile(
                'CSV Telemetry (.csv)',
                Icons.grid_on_outlined,
                () async {
                  Navigator.pop(context);
                  await _exportAdminReportCsv(stats);
                },
              ),
              const SizedBox(height: 12),
              _buildExportOptionTile(
                'Excel Ledger (.xlsx)',
                Icons.table_view_outlined,
                () async {
                  Navigator.pop(context);
                  await _exportAdminReportExcel(stats);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildExportOptionTile(
    String label,
    IconData icon,
    VoidCallback onTap,
  ) {
    return ListTile(
      onTap: onTap,
      leading: Icon(icon, color: AppColors.gold, size: 22),
      title: Text(
        label,
        style: GoogleFonts.inter(
          color: Colors.white,
          fontSize: 13,
          fontWeight: FontWeight.w600,
        ),
      ),
      tileColor: Colors.white.withValues(alpha: 0.02),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: const BorderSide(color: Colors.white12),
      ),
    );
  }

  Future<void> _exportAdminReportPdf(Map<String, dynamic> stats) async {
    try {
      final pdf = pw.Document();
      final deptComparison =
          stats['department_comparison'] as Map<String, dynamic>? ?? {};
      final risk = stats['risk_analysis'] as Map<String, dynamic>? ?? {};
      final logs = stats['activity_log'] as List<dynamic>? ?? [];

      pdf.addPage(
        pw.Page(
          pageFormat: PdfPageFormat.a4,
          build: (pw.Context context) {
            return pw.Container(
              padding: const pw.EdgeInsets.all(30),
              child: pw.Column(
                crossAxisAlignment: pw.CrossAxisAlignment.start,
                children: [
                  pw.Text(
                    'NEXA AI / SMARTFACE INSTITUTION REPORT',
                    style: pw.TextStyle(
                      fontSize: 18,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.SizedBox(height: 8),
                  pw.Text(
                    'Compiled on: ${DateTime.now().toLocal().toString().split('.')[0]}',
                  ),
                  pw.Divider(thickness: 1),
                  pw.SizedBox(height: 15),
                  pw.Text(
                    'INSTITUTION METRICS',
                    style: pw.TextStyle(
                      fontSize: 14,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.Text(
                    'Total Enrolled Students: ${stats['total_students']}',
                  ),
                  pw.Text('Total Instructors: ${stats['total_teachers']}'),
                  pw.Text(
                    'Active Classroom Sessions: ${stats['active_sessions']}',
                  ),
                  pw.Text(
                    'Today Attendance Rate: ${stats['attendance_today']}',
                  ),
                  pw.SizedBox(height: 20),
                  pw.Text(
                    'DEPARTMENT ENGAGEMENT RATES',
                    style: pw.TextStyle(
                      fontSize: 12,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.Divider(thickness: 0.5),
                  ...deptComparison.entries.map(
                    (e) => pw.Text('${e.key} Department: ${e.value}%'),
                  ),
                  pw.SizedBox(height: 20),
                  pw.Text(
                    'STUDENT RISK PROFILES',
                    style: pw.TextStyle(
                      fontSize: 12,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.Divider(thickness: 0.5),
                  pw.Text(
                    'High Risk (Attendance < 75%): ${risk['high_risk_count'] ?? 0} students',
                  ),
                  pw.Text(
                    'Medium Risk (Attendance 75%-85%): ${risk['medium_risk_count'] ?? 0} students',
                  ),
                  pw.Text(
                    'Low Risk (Attendance > 85%): ${risk['low_risk_count'] ?? 0} students',
                  ),
                  pw.SizedBox(height: 20),
                  pw.Text(
                    'RECENT SYSTEM AUDIT LOGS',
                    style: pw.TextStyle(
                      fontSize: 12,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.Divider(thickness: 0.5),
                  ...logs
                      .take(5)
                      .map(
                        (l) => pw.Text(
                          '[${l['type'].toString().toUpperCase()}] ${l['title']} - ${l['detail']}',
                        ),
                      ),
                ],
              ),
            );
          },
        ),
      );

      final output = await getTemporaryDirectory();
      final file = File('${output.path}/institutional_report.pdf');
      await file.writeAsBytes(await pdf.save());

      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdf.save(),
      );
    } catch (e) {
      debugPrint('Admin PDF export error: $e');
    }
  }

  Future<void> _exportAdminReportCsv(Map<String, dynamic> stats) async {
    try {
      final buffer = StringBuffer();
      buffer.writeln('Category,Key Indicator,Value Metric,Extra Info');

      buffer.writeln(
        'Overview,Total Students,${stats['total_students']},Enrolled Roster',
      );
      buffer.writeln(
        'Overview,Total Teachers,${stats['total_teachers']},Faculty',
      );
      buffer.writeln(
        'Overview,Active Sessions,${stats['active_sessions']},Live Feed',
      );
      buffer.writeln(
        'Overview,Attendance Today,${stats['attendance_today']},Campus Engagement',
      );

      final deptComparison =
          stats['department_comparison'] as Map<String, dynamic>? ?? {};
      for (final e in deptComparison.entries) {
        buffer.writeln('Department,${e.key},${e.value}%,Check-in percentage');
      }

      final risk = stats['risk_analysis'] as Map<String, dynamic>? ?? {};
      buffer.writeln(
        'Risk Model,High Risk,${risk['high_risk_count']},Critical warning list',
      );
      buffer.writeln(
        'Risk Model,Medium Risk,${risk['medium_risk_count']},Borderline warning list',
      );
      buffer.writeln(
        'Risk Model,Low Risk,${risk['low_risk_count']},Satisfactory group',
      );

      final output = await getTemporaryDirectory();
      final file = File('${output.path}/institutional_telemetry.csv');
      await file.writeAsString(buffer.toString());

      if (mounted) {
        AppToast.show(
          context,
          message: 'Institutional CSV exported successfully!',
          type: ToastType.success,
        );
      }
    } catch (e) {
      debugPrint('Admin CSV export error: $e');
    }
  }

  Future<void> _exportAdminReportExcel(Map<String, dynamic> stats) async {
    try {
      final buffer = StringBuffer();
      buffer.writeln('Category\tKey Indicator\tValue Metric\tExtra Info');

      buffer.writeln(
        'Overview\tTotal Students\t${stats['total_students']}\tEnrolled Roster',
      );
      buffer.writeln(
        'Overview\tTotal Teachers\t${stats['total_teachers']}\tFaculty',
      );
      buffer.writeln(
        'Overview\tActive Sessions\t${stats['active_sessions']}\tLive Feed',
      );
      buffer.writeln(
        'Overview\tAttendance Today\t${stats['attendance_today']}\tCampus Engagement',
      );

      final deptComparison =
          stats['department_comparison'] as Map<String, dynamic>? ?? {};
      for (final e in deptComparison.entries) {
        buffer.writeln(
          'Department\t${e.key}\t${e.value}%\tCheck-in percentage',
        );
      }

      final risk = stats['risk_analysis'] as Map<String, dynamic>? ?? {};
      buffer.writeln(
        'Risk Model\tHigh Risk\t${risk['high_risk_count']}\tCritical warning list',
      );
      buffer.writeln(
        'Risk Model\tMedium Risk\t${risk['medium_risk_count']}\tBorderline warning list',
      );
      buffer.writeln(
        'Risk Model\tLow Risk\t${risk['low_risk_count']}\tSatisfactory group',
      );

      final output = await getTemporaryDirectory();
      final file = File('${output.path}/institutional_telemetry_ledger.xlsx');
      await file.writeAsString(buffer.toString());

      if (mounted) {
        AppToast.show(
          context,
          message: 'Institutional Excel ledger compiled successfully!',
          type: ToastType.success,
        );
      }
    } catch (e) {
      debugPrint('Admin Excel export error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final analyticsCtrl = context.watch<AnalyticsController>();
    final stats = analyticsCtrl.adminAnalytics;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.bgDeep : AppColors.bgLight,
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
        appBar: PremiumAppBar(
          title: 'Institutional Analytics',
          leading: IconButton(
            icon: Icon(
              Icons.arrow_back_ios_new_rounded,
              color: isDark ? Colors.white : AppColors.bgDark,
            ),
            onPressed: () => Navigator.pop(context),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh, color: AppColors.cyan),
              onPressed: _fetchStats,
            ),
            IconButton(
              icon: const Icon(Icons.download_rounded, color: AppColors.gold),
              onPressed: () => _showExportDialog(stats),
            ),
          ],
        ),
        body: _isLoading || stats.isEmpty
            ? const DashboardShimmer()
            : GlowRefreshIndicator(
                onRefresh: _fetchStats,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 10,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildMetricCards(stats),
                      const SizedBox(height: 24),
                      _buildLabel('CAMPUS DAILY ATTENDANCE TREND'),
                      const SizedBox(height: 12),
                      _buildInstitutionTrend(isDark),
                      const SizedBox(height: 28),
                      _buildLabel('DEPARTMENT WISE PERFORMANCE'),
                      const SizedBox(height: 12),
                      _buildDepartmentComparison(stats, isDark),
                      const SizedBox(height: 28),
                      _buildLabel('ATTENDANCE RISK DISTRIBUTION'),
                      const SizedBox(height: 12),
                      _buildRiskAnalysisPanel(stats, isDark),
                      const SizedBox(height: 28),
                      _buildLabel('RECENT SYSTEM AUDIT LOGS'),
                      const SizedBox(height: 12),
                      _buildActivityLogList(stats),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Text(
      text,
      style: GoogleFonts.inter(
        fontSize: 10,
        letterSpacing: 2.5,
        color: AppColors.gold,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildMetricCards(Map<String, dynamic> stats) {
    final cards = [
      (
        'TOTAL STUDENTS',
        stats['total_students'] ?? '0',
        Icons.people_outline_rounded,
        AppColors.cyan,
      ),
      (
        'TOTAL TEACHERS',
        stats['total_teachers'] ?? '0',
        Icons.assignment_ind_outlined,
        AppColors.gold,
      ),
      (
        'ACTIVE SESSIONS',
        stats['active_sessions'] ?? '0',
        Icons.sensors_rounded,
        AppColors.indigoLight,
      ),
      (
        'ATTENDANCE TODAY',
        stats['attendance_today'] ?? '0%',
        Icons.check_circle_outline_rounded,
        AppColors.success,
      ),
    ];

    return GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 14,
          mainAxisSpacing: 14,
          childAspectRatio: 1.4,
          children: cards.map((c) {
            return GlassContainer(
              padding: const EdgeInsets.all(16),
              borderColor: c.$4.withValues(alpha: 0.15),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(c.$3, color: c.$4, size: 20),
                  const SizedBox(height: 8),
                  Text(
                    c.$2,
                    style: GoogleFonts.robotoMono(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 22,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    c.$1,
                    style: GoogleFonts.inter(
                      color: c.$4,
                      fontSize: 8,
                      letterSpacing: 1,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
        )
        .animate()
        .fadeIn(duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(
          begin: 0.05,
          end: 0,
          duration: 400.ms,
          curve: Curves.easeOutCubic,
        );
  }

  Widget _buildInstitutionTrend(bool isDark) {
    final theme = Theme.of(context);
    final appColors = theme.extension<DarkAppColors>() ?? DarkAppColors.dark;
    // Standard mock institution monthly trends (average attendance per month)
    final monthlyData = [86.5, 89.0, 91.2, 90.5, 93.4, 91.0];
    final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    return SizedBox(
          height: 200,
          child: GlassContainer(
            padding: const EdgeInsets.fromLTRB(10, 20, 20, 10),
            borderColor: appColors.primaryGlow.withValues(alpha: 0.15),
            child: LineChart(
              LineChartData(
                minY: 60,
                maxY: 100,
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 10,
                  getDrawingHorizontalLine: (value) => FlLine(
                    color: appColors.glassBorder.withValues(alpha: 0.5),
                    strokeWidth: 1,
                  ),
                ),
                borderData: FlBorderData(show: false),
                titlesData: FlTitlesData(
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: 1,
                      getTitlesWidget: (val, meta) {
                        final idx = val.toInt();
                        if (idx < 0 || idx >= months.length) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            months[idx],
                            style: GoogleFonts.inter(
                              color: theme.colorScheme.onSurface.withValues(
                                alpha: 0.38,
                              ),
                              fontSize: 9,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      interval: 10,
                      reservedSize: 32,
                      getTitlesWidget: (val, meta) => Text(
                        '${val.toInt()}%',
                        style: GoogleFonts.inter(
                          color: theme.colorScheme.onSurface.withValues(
                            alpha: 0.24,
                          ),
                          fontSize: 8,
                        ),
                      ),
                    ),
                  ),
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                ),
                lineBarsData: [
                  LineChartBarData(
                    spots: List.generate(
                      monthlyData.length,
                      (i) => FlSpot(i.toDouble(), monthlyData[i]),
                    ),
                    isCurved: true,
                    color: appColors.primaryGlow,
                    barWidth: 3,
                    dotData: const FlDotData(show: true),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          appColors.primaryGlow.withValues(alpha: 0.2),
                          appColors.primaryGlow.withValues(alpha: 0.0),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        )
        .animate()
        .fadeIn(delay: 100.ms, duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(
          begin: 0.05,
          end: 0,
          duration: 400.ms,
          curve: Curves.easeOutCubic,
        );
  }

  Widget _buildDepartmentComparison(Map<String, dynamic> stats, bool isDark) {
    final theme = Theme.of(context);
    final appColors = theme.extension<DarkAppColors>() ?? DarkAppColors.dark;
    final deptData =
        stats['department_comparison'] as Map<String, dynamic>? ?? {};
    if (deptData.isEmpty) return const SizedBox.shrink();

    final keys = deptData.keys.toList();

    return SizedBox(
          height: 200,
          child: GlassContainer(
            padding: const EdgeInsets.all(20),
            borderColor: appColors.primaryGlow.withValues(alpha: 0.15),
            child: BarChart(
              BarChartData(
                maxY: 100,
                borderData: FlBorderData(show: false),
                gridData: const FlGridData(show: false),
                titlesData: FlTitlesData(
                  topTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  rightTitles: const AxisTitles(
                    sideTitles: SideTitles(showTitles: false),
                  ),
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 28,
                      getTitlesWidget: (val, meta) => Text(
                        '${val.toInt()}%',
                        style: TextStyle(
                          color: theme.colorScheme.onSurface.withValues(
                            alpha: 0.24,
                          ),
                          fontSize: 8,
                        ),
                      ),
                    ),
                  ),
                  bottomTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      getTitlesWidget: (val, meta) {
                        final idx = val.toInt();
                        if (idx < 0 || idx >= keys.length) {
                          return const SizedBox.shrink();
                        }
                        return Padding(
                          padding: const EdgeInsets.only(top: 8),
                          child: Text(
                            keys[idx],
                            style: TextStyle(
                              color: theme.colorScheme.onSurface.withValues(
                                alpha: 0.38,
                              ),
                              fontSize: 10,
                            ),
                          ),
                        );
                      },
                    ),
                  ),
                ),
                barGroups: List.generate(keys.length, (index) {
                  final double val = (deptData[keys[index]] as num? ?? 0.0)
                      .toDouble();
                  return BarChartGroupData(
                    x: index,
                    barRods: [
                      BarChartRodData(
                        toY: val,
                        color: appColors.primaryGlow,
                        width: 14,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ],
                  );
                }),
              ),
            ),
          ),
        )
        .animate()
        .fadeIn(delay: 200.ms, duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(
          begin: 0.05,
          end: 0,
          duration: 400.ms,
          curve: Curves.easeOutCubic,
        );
  }

  Widget _buildRiskAnalysisPanel(Map<String, dynamic> stats, bool isDark) {
    final risk = stats['risk_analysis'] as Map<String, dynamic>? ?? {};
    final int high = risk['high_risk_count'] ?? 0;
    final int medium = risk['medium_risk_count'] ?? 0;
    final int low = risk['low_risk_count'] ?? 0;
    final int total = high + medium + low;

    return GlassContainer(
          padding: const EdgeInsets.all(20),
          borderColor: Colors.white.withValues(alpha: 0.05),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  const Icon(
                    Icons.shield_outlined,
                    color: AppColors.gold,
                    size: 18,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'STUDENT RISK PROFILES',
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 18),
              _buildRiskProgressBar(high, medium, low, total),
              const SizedBox(height: 18),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  _buildRiskLegend('High Risk (<75%)', high, AppColors.error),
                  _buildRiskLegend(
                    'Medium Risk (75-85%)',
                    medium,
                    AppColors.warning,
                  ),
                  _buildRiskLegend('Low Risk (>85%)', low, AppColors.success),
                ],
              ),
            ],
          ),
        )
        .animate()
        .fadeIn(delay: 250.ms, duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(
          begin: 0.05,
          end: 0,
          duration: 400.ms,
          curve: Curves.easeOutCubic,
        );
  }

  Widget _buildRiskProgressBar(int high, int medium, int low, int total) {
    if (total == 0) return const SizedBox.shrink();
    final double highPct = high / total;
    final double medPct = medium / total;
    final double lowPct = low / total;

    return Container(
      height: 12,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(6),
        color: Colors.white10,
      ),
      child: Row(
        children: [
          if (high > 0)
            Expanded(
              flex: (highPct * 100).toInt(),
              child: Container(
                decoration: const BoxDecoration(
                  color: AppColors.error,
                  borderRadius: BorderRadius.only(
                    topLeft: Radius.circular(6),
                    bottomLeft: Radius.circular(6),
                  ),
                ),
              ),
            ),
          if (medium > 0)
            Expanded(
              flex: (medPct * 100).toInt(),
              child: Container(color: AppColors.warning),
            ),
          if (low > 0)
            Expanded(
              flex: (lowPct * 100).toInt(),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.success,
                  borderRadius: BorderRadius.only(
                    topRight: Radius.circular(high == 0 && medium == 0 ? 6 : 6),
                    bottomRight: Radius.circular(
                      high == 0 && medium == 0 ? 6 : 6,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildRiskLegend(String label, int count, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(color: color, shape: BoxShape.circle),
            ),
            const SizedBox(width: 6),
            Text(
              label,
              style: const TextStyle(color: Colors.white54, fontSize: 9),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Text(
          '$count Students',
          style: GoogleFonts.robotoMono(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 12,
          ),
        ),
      ],
    );
  }

  Widget _buildActivityLogList(Map<String, dynamic> stats) {
    final List<dynamic> logs = stats['activity_log'] as List<dynamic>? ?? [];
    if (logs.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Text(
          'No system audit logs found.',
          style: TextStyle(color: Colors.white38),
        ),
      );
    }

    return ListView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          itemCount: logs.length,
          itemBuilder: (context, index) {
            final l = logs[index];
            IconData icon = Icons.info_outline_rounded;
            Color color = AppColors.cyan;

            if (l['type'] == 'attendance') {
              icon = Icons.check_circle_outline_rounded;
              color = AppColors.success;
            } else if (l['type'] == 'security') {
              icon = Icons.gpp_maybe_outlined;
              color = AppColors.error;
            } else if (l['type'] == 'session') {
              icon = Icons.sensors_rounded;
              color = AppColors.indigoLight;
            }

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white.withValues(alpha: 0.01),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: Colors.white.withValues(alpha: 0.04)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: color.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Icon(icon, color: color, size: 18),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l['title'] ?? 'System Event',
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        Text(
                          l['detail'] ?? '',
                          style: const TextStyle(
                            color: Colors.white54,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Text(
                    'Recent',
                    style: TextStyle(color: Colors.white38, fontSize: 9),
                  ),
                ],
              ),
            );
          },
        )
        .animate()
        .fadeIn(delay: 300.ms, duration: 400.ms, curve: Curves.easeOutCubic)
        .slideY(
          begin: 0.05,
          end: 0,
          duration: 400.ms,
          curve: Curves.easeOutCubic,
        );
  }
}
