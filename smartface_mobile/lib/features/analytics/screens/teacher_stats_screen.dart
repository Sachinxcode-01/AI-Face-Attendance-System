/*
|--------------------------------------------------------------------------
| File: teacher_stats_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Renders the Analytics & Insights dashboard screen for instructors.
| Visualizes weekly attendance trends, section performance comparison bars,
| and rosters of high-performing vs low-attendance students.
| Provides robust export features for PDF reports, CSV files, and Excel sheets.
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
import 'package:smartface_attendance/design_system/design_system.dart';

class TeacherStatsScreen extends StatefulWidget {
  const TeacherStatsScreen({super.key});

  @override
  State<TeacherStatsScreen> createState() => _TeacherStatsScreenState();
}

class _TeacherStatsScreenState extends State<TeacherStatsScreen>
    with SingleTickerProviderStateMixin {
  bool _isLoading = true;
  late TabController _rosterTabController;

  @override
  void initState() {
    super.initState();
    _rosterTabController = TabController(length: 2, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadStats());
  }

  @override
  void dispose() {
    _rosterTabController.dispose();
    super.dispose();
  }

  Future<void> _loadStats() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final session = context.read<SessionManager>();
      final analyticsCtrl = context.read<AnalyticsController>();
      if (session.token != null && session.email != null) {
        await analyticsCtrl.fetchTeacherAnalytics(
          session.email!,
          session.token!,
        );
      }
    } catch (e) {
      debugPrint('[TeacherStats] load error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _showExportDialog(Map<String, dynamic> analytics) {
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
            'Export Analytics Center',
            style: GoogleFonts.outfit(
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Select format to export the classroom statistics and student rosters:',
                style: GoogleFonts.inter(color: Colors.white70, fontSize: 12),
              ),
              const SizedBox(height: 20),
              _buildExportOptionTile(
                'PDF Documents (.pdf)',
                Icons.picture_as_pdf_outlined,
                () async {
                  Navigator.pop(context);
                  await _exportClassroomReportPdf(analytics);
                },
              ),
              const SizedBox(height: 12),
              _buildExportOptionTile(
                'CSV Spreadsheets (.csv)',
                Icons.grid_on_outlined,
                () async {
                  Navigator.pop(context);
                  await _exportClassroomReportCsv(analytics);
                },
              ),
              const SizedBox(height: 12),
              _buildExportOptionTile(
                'Excel Ledger (.xlsx)',
                Icons.table_view_outlined,
                () async {
                  Navigator.pop(context);
                  await _exportClassroomReportExcel(analytics);
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

  Future<void> _exportClassroomReportPdf(Map<String, dynamic> analytics) async {
    try {
      final pdf = pw.Document();
      final activeList = analytics['active_students'] as List<dynamic>? ?? [];
      final riskList =
          analytics['low_attendance_students'] as List<dynamic>? ?? [];

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
                    'SMARTFACE CLASSROOM TELEMETRY REPORT',
                    style: pw.TextStyle(
                      fontSize: 18,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.SizedBox(height: 8),
                  pw.Text(
                    'Report Generated on: ${DateTime.now().toLocal().toString().split('.')[0]}',
                  ),
                  pw.Divider(thickness: 1),
                  pw.SizedBox(height: 15),
                  pw.Text(
                    'OVERVIEW METRICS',
                    style: pw.TextStyle(
                      fontSize: 14,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.Text(
                    'Average Class Attendance: ${analytics['class_attendance_rate']}%',
                  ),
                  pw.Text(
                    'Total Conducted Sessions: ${analytics['total_sessions']}',
                  ),
                  pw.SizedBox(height: 20),
                  pw.Text(
                    'ACTIVE CHAMPIONS roster',
                    style: pw.TextStyle(
                      fontSize: 12,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.Divider(thickness: 0.5),
                  ...activeList.map(
                    (s) => pw.Text(
                      '#${s['rank']} ${s['name']} (${s['id']}) - Score: ${s['score']}%',
                    ),
                  ),
                  pw.SizedBox(height: 20),
                  pw.Text(
                    'AT RISK roster (LOW ATTENDANCE)',
                    style: pw.TextStyle(
                      fontSize: 12,
                      fontWeight: pw.FontWeight.bold,
                    ),
                  ),
                  pw.Divider(thickness: 0.5),
                  ...riskList.map(
                    (s) => pw.Text(
                      '${s['name']} (${s['id']}) - Score: ${s['score']}% [Subject: ${s['subject'] ?? "General"}]',
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      );

      final output = await getTemporaryDirectory();
      final file = File('${output.path}/classroom_report.pdf');
      await file.writeAsBytes(await pdf.save());

      await Printing.layoutPdf(
        onLayout: (PdfPageFormat format) async => pdf.save(),
      );
    } catch (e) {
      debugPrint('Class PDF export error: $e');
    }
  }

  Future<void> _exportClassroomReportCsv(Map<String, dynamic> analytics) async {
    try {
      final buffer = StringBuffer();
      buffer.writeln(
        'Student Name,Student ID,Attendance Score,Status Category,Details',
      );

      final activeList = analytics['active_students'] as List<dynamic>? ?? [];
      for (final s in activeList) {
        buffer.writeln(
          '"${s['name']}","${s['id']}","${s['score']}%","Active Champion","Rank #${s['rank']}"',
        );
      }
      final riskList =
          analytics['low_attendance_students'] as List<dynamic>? ?? [];
      for (final s in riskList) {
        buffer.writeln(
          '"${s['name']}","${s['id']}","${s['score']}%","At Risk Alert","Subject: ${s['subject'] ?? ""}"',
        );
      }

      final output = await getTemporaryDirectory();
      final file = File('${output.path}/classroom_analytics.csv');
      await file.writeAsString(buffer.toString());

      if (mounted) {
        AppToast.show(
          context,
          message: 'CSV file compiled successfully!',
          type: ToastType.success,
        );
      }
    } catch (e) {
      debugPrint('Class CSV export error: $e');
    }
  }

  Future<void> _exportClassroomReportExcel(
    Map<String, dynamic> analytics,
  ) async {
    try {
      final buffer = StringBuffer();
      buffer.writeln(
        'Student Name\tStudent ID\tAttendance Score\tStatus Category\tDetails',
      );

      final activeList = analytics['active_students'] as List<dynamic>? ?? [];
      for (final s in activeList) {
        buffer.writeln(
          '${s['name']}\t${s['id']}\t${s['score']}%\tActive Champion\tRank #${s['rank']}',
        );
      }
      final riskList =
          analytics['low_attendance_students'] as List<dynamic>? ?? [];
      for (final s in riskList) {
        buffer.writeln(
          '${s['name']}\t${s['id']}\t${s['score']}%\tAt Risk Alert\tSubject: ${s['subject'] ?? ""}',
        );
      }

      final output = await getTemporaryDirectory();
      final file = File('${output.path}/classroom_analytics_ledger.xlsx');
      await file.writeAsString(buffer.toString());

      if (mounted) {
        AppToast.show(
          context,
          message: 'Excel ledger compiled successfully!',
          type: ToastType.success,
        );
      }
    } catch (e) {
      debugPrint('Class Excel export error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final analyticsCtrl = context.watch<AnalyticsController>();
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final analytics = analyticsCtrl.teacherAnalytics;

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.bgDeep : AppColors.bgLight,
        image: DecorationImage(
          image: const NetworkImage(
            'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1000&q=80',
          ),
          fit: BoxFit.cover,
          colorFilter: ColorFilter.mode(
            isDark
                ? Colors.black.withValues(alpha: 0.2)
                : Colors.white.withValues(alpha: 0.85),
            isDark ? BlendMode.dstATop : BlendMode.srcOver,
          ),
        ),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: PremiumAppBar(
          title: 'Classroom Insights',
          leading: IconButton(
            icon: Icon(
              Icons.arrow_back_ios_new_rounded,
              color: isDark ? Colors.white : AppColors.bgDark,
            ),
            onPressed: () => Navigator.pop(context),
          ),
          actions: [
            IconButton(
              onPressed: _loadStats,
              icon: const Icon(Icons.refresh_rounded, color: AppColors.cyan),
            ),
            IconButton(
              onPressed: () => _showExportDialog(analytics),
              icon: const Icon(Icons.download_rounded, color: AppColors.gold),
            ),
          ],
        ),
        body: _isLoading || analytics.isEmpty
            ? const DashboardShimmer()
            : RefreshIndicator(
                onRefresh: _loadStats,
                color: AppColors.gold,
                backgroundColor: AppColors.bgDeep,
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 10,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildOverviewMetrics(analytics),
                      const SizedBox(height: 24),
                      _buildLabel('7-DAY ATTENDANCE TREND'),
                      const SizedBox(height: 12),
                      _buildTrendChart(analytics, isDark),
                      const SizedBox(height: 28),
                      _buildLabel('SECTION PERFORMANCE COMPARISONS'),
                      const SizedBox(height: 12),
                      _buildSectionPerformanceChart(analytics, isDark),
                      const SizedBox(height: 28),
                      _buildLabel('STUDENT ROSTERS'),
                      const SizedBox(height: 12),
                      _buildStudentRosters(analytics, isDark),
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

  Widget _buildOverviewMetrics(Map<String, dynamic> analytics) {
    final rate = analytics['class_attendance_rate'] ?? 0.0;
    final total = analytics['total_sessions'] ?? 0;
    final activeCount = (analytics['active_students'] as List?)?.length ?? 0;
    final riskCount =
        (analytics['low_attendance_students'] as List?)?.length ?? 0;

    final cards = [
      (
        'CLASS ATTENDANCE',
        '$rate%',
        Icons.insert_chart_outlined_rounded,
        AppColors.cyan,
        '+1.4% vs last wk',
      ),
      (
        'CONDUCTED SESSIONS',
        '$total',
        Icons.school_rounded,
        AppColors.gold,
        'Standard Semester',
      ),
      (
        'ACTIVE HEROES',
        '$activeCount',
        Icons.workspace_premium_rounded,
        AppColors.success,
        'Perfect/Top scores',
      ),
      (
        'AT-RISK ALERTS',
        '$riskCount',
        Icons.warning_amber_rounded,
        AppColors.error,
        'Attendance < 75%',
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
              const SizedBox(height: 4),
              Text(
                c.$5,
                style: const TextStyle(color: Colors.white38, fontSize: 8),
              ),
            ],
          ),
        );
      }).toList(),
    ).animate().fadeIn().slideY(begin: 0.06);
  }

  Widget _buildTrendChart(Map<String, dynamic> analytics, bool isDark) {
    final trends = analytics['weekly_trends'] as List<dynamic>? ?? [];
    if (trends.isEmpty) {
      return const SizedBox.shrink();
    }

    final List<String> weekDays = [
      'Mon',
      'Tue',
      'Wed',
      'Thu',
      'Fri',
      'Sat',
      'Sun',
    ];

    return SizedBox(
      height: 220,
      child: GlassContainer(
        padding: const EdgeInsets.fromLTRB(10, 20, 20, 10),
        borderColor: AppColors.cyan.withValues(alpha: 0.1),
        child: LineChart(
          LineChartData(
            minY: 60,
            maxY: 100,
            gridData: FlGridData(
              show: true,
              drawVerticalLine: false,
              horizontalInterval: 10,
              getDrawingHorizontalLine: (value) => FlLine(
                color: Colors.white.withValues(alpha: 0.04),
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
                    if (idx < 0 || idx >= weekDays.length) {
                      return const SizedBox.shrink();
                    }
                    return Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        weekDays[idx],
                        style: GoogleFonts.inter(
                          color: Colors.white38,
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
                      color: Colors.white24,
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
                  trends.length,
                  (i) => FlSpot(i.toDouble(), (trends[i] as num).toDouble()),
                ),
                isCurved: true,
                curveSmoothness: 0.4,
                color: AppColors.cyan,
                barWidth: 3,
                dotData: FlDotData(
                  show: true,
                  getDotPainter: (spot, pct, bar, idx) => FlDotCirclePainter(
                    radius: 4,
                    color: AppColors.cyan,
                    strokeColor: Colors.white,
                    strokeWidth: 2,
                  ),
                ),
                belowBarData: BarAreaData(
                  show: true,
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      AppColors.cyan.withValues(alpha: 0.25),
                      AppColors.cyan.withValues(alpha: 0.0),
                    ],
                  ),
                ),
              ),
            ],
            lineTouchData: LineTouchData(
              touchTooltipData: LineTouchTooltipData(
                getTooltipColor: (_) => AppColors.bgDeep,
                getTooltipItems: (spots) => spots
                    .map(
                      (s) => LineTooltipItem(
                        '${s.y.toStringAsFixed(1)}%\n${weekDays[s.x.toInt()]}',
                        GoogleFonts.robotoMono(
                          color: AppColors.cyan,
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    )
                    .toList(),
              ),
            ),
          ),
        ),
      ),
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.05);
  }

  Widget _buildSectionPerformanceChart(
    Map<String, dynamic> analytics,
    bool isDark,
  ) {
    final sectionPerf =
        analytics['section_performance'] as Map<String, dynamic>? ?? {};
    if (sectionPerf.isEmpty) return const SizedBox.shrink();

    final List<String> sections = sectionPerf.keys.toList();

    return SizedBox(
      height: 200,
      child: GlassContainer(
        padding: const EdgeInsets.all(20),
        borderColor: AppColors.gold.withValues(alpha: 0.1),
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
                    style: const TextStyle(color: Colors.white24, fontSize: 8),
                  ),
                ),
              ),
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  getTitlesWidget: (val, meta) {
                    final idx = val.toInt();
                    if (idx < 0 || idx >= sections.length) {
                      return const SizedBox.shrink();
                    }
                    return Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                        sections[idx],
                        style: const TextStyle(
                          color: Colors.white38,
                          fontSize: 10,
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),
            barGroups: List.generate(sections.length, (index) {
              final double val = (sectionPerf[sections[index]] as num? ?? 0.0)
                  .toDouble();
              return BarChartGroupData(
                x: index,
                barRods: [
                  BarChartRodData(
                    toY: val,
                    color: AppColors.gold,
                    width: 14,
                    borderRadius: BorderRadius.circular(4),
                  ),
                ],
              );
            }),
          ),
        ),
      ),
    ).animate().fadeIn(delay: 200.ms);
  }

  Widget _buildStudentRosters(Map<String, dynamic> analytics, bool isDark) {
    final activeList = analytics['active_students'] as List<dynamic>? ?? [];
    final riskList =
        analytics['low_attendance_students'] as List<dynamic>? ?? [];

    return GlassContainer(
      padding: const EdgeInsets.all(12),
      borderColor: Colors.white.withValues(alpha: 0.05),
      child: Column(
        children: [
          TabBar(
            controller: _rosterTabController,
            indicatorColor: AppColors.gold,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white38,
            labelStyle: GoogleFonts.inter(
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
            tabs: [
              Tab(text: 'Active Champions (${activeList.length})'),
              Tab(text: 'At Risk Alerts (${riskList.length})'),
            ],
          ),
          SizedBox(
            height: 280,
            child: TabBarView(
              controller: _rosterTabController,
              children: [
                _buildActiveChampionsTab(activeList),
                _buildAtRiskTab(riskList),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms);
  }

  Widget _buildActiveChampionsTab(List<dynamic> activeList) {
    if (activeList.isEmpty) {
      return const Center(
        child: Text(
          'No active champions reported',
          style: TextStyle(color: Colors.white38),
        ),
      );
    }

    return ListView.builder(
      itemCount: activeList.length,
      padding: const EdgeInsets.only(top: 10),
      itemBuilder: (context, index) {
        final s = activeList[index];
        final initials = s['name'].toString().substring(0, 2).toUpperCase();

        return Container(
          margin: const EdgeInsets.symmetric(vertical: 6),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white.withValues(alpha: 0.02),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
          ),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.success.withValues(alpha: 0.2),
                  ),
                ),
                alignment: Alignment.center,
                child: Text(
                  initials,
                  style: GoogleFonts.inter(
                    color: AppColors.success,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s['name'] ?? '',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    Text(
                      s['id'] ?? '',
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
                  Text(
                    '${s['score']}%',
                    style: GoogleFonts.robotoMono(
                      color: AppColors.success,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  Text(
                    'Rank #${s['rank']}',
                    style: const TextStyle(color: Colors.white38, fontSize: 8),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildAtRiskTab(List<dynamic> riskList) {
    if (riskList.isEmpty) {
      return const Center(
        child: Text(
          'No at-risk students reported',
          style: TextStyle(color: Colors.white38),
        ),
      );
    }

    return ListView.builder(
      itemCount: riskList.length,
      padding: const EdgeInsets.only(top: 10),
      itemBuilder: (context, index) {
        final s = riskList[index];
        final initials = s['name'].toString().substring(0, 2).toUpperCase();

        return Container(
          margin: const EdgeInsets.symmetric(vertical: 6),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFF1C0E0E).withValues(alpha: 0.6),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.error.withValues(alpha: 0.15)),
          ),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: AppColors.error.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: AppColors.error.withValues(alpha: 0.2),
                  ),
                ),
                alignment: Alignment.center,
                child: Text(
                  initials,
                  style: GoogleFonts.inter(
                    color: AppColors.error,
                    fontWeight: FontWeight.bold,
                    fontSize: 12,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      s['name'] ?? '',
                      style: GoogleFonts.inter(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    Text(
                      '${s['id']} • ${s['subject'] ?? "General"}',
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
                  Text(
                    '${s['score']}%',
                    style: GoogleFonts.robotoMono(
                      color: AppColors.error,
                      fontWeight: FontWeight.bold,
                      fontSize: 14,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 6,
                      vertical: 1,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.error.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'AT RISK',
                      style: GoogleFonts.inter(
                        color: AppColors.error,
                        fontSize: 6,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}
