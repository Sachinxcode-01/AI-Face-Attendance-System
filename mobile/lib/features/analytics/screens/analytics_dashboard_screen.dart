/*
|--------------------------------------------------------------------------
| File: analytics_dashboard_screen.dart
|--------------------------------------------------------------------------
| Project: SmartFace AI v1.1
|
| Purpose:
| Advanced Analytics Dashboard with real-time charts:
|  - Attendance Trend Line Chart (6-month monthly rates)
|  - Department Comparison Bar Chart
|  - Subject-wise Bar Chart
|  - Risk Students List (below 75% threshold)
|  - Check-in Heatmap Grid (last 30 days)
|
| Access: Admin & Teacher only (enforced server-side; UI shows alert for students)
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';

import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';

// ─── Model Types ────────────────────────────────────────────────────────────

class _TrendPoint {
  final String month;
  final double rate;
  const _TrendPoint(this.month, this.rate);
}

class _DeptBar {
  final String department;
  final double rate;
  const _DeptBar(this.department, this.rate);
}

class _SubjectBar {
  final String subject;
  final double rate;
  const _SubjectBar(this.subject, this.rate);
}

class _RiskStudent {
  final String email;
  final String name;
  final String department;
  final double rate;
  const _RiskStudent(this.email, this.name, this.department, this.rate);
}

class _HeatDay {
  final String date;
  final int count;
  const _HeatDay(this.date, this.count);
}

// ─── Screen ──────────────────────────────────────────────────────────────────

class AnalyticsDashboardScreen extends StatefulWidget {
  const AnalyticsDashboardScreen({super.key});

  @override
  State<AnalyticsDashboardScreen> createState() =>
      _AnalyticsDashboardScreenState();
}

class _AnalyticsDashboardScreenState extends State<AnalyticsDashboardScreen>
    with SingleTickerProviderStateMixin {
  // ── State ──────────────────────────────────────────────────────────────────
  bool _loading = true;
  String? _error;

  List<_TrendPoint> _trends = [];
  List<_DeptBar> _depts = [];
  List<_SubjectBar> _subjects = [];
  List<_RiskStudent> _risk = [];
  List<_HeatDay> _heatmap = [];
  int _touchedIdx = -1;

  late final TabController _tabs;

  static const List<String> _tabLabels = [
    'Trends',
    'Departments',
    'Subjects',
    'Risk',
    'Heatmap',
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: _tabLabels.length, vsync: this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadAll());
  }

  @override
  void dispose() {
    _tabs.dispose();
    super.dispose();
  }

  // ── Data Fetching ──────────────────────────────────────────────────────────
  Future<void> _loadAll() async {
    if (!mounted) return;
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final session = context.read<SessionManager>();
      final token = session.token ?? '';

      final results = await Future.wait([
        ApiService.getAnalyticsTrends(token),
        ApiService.getDepartmentComparison(token),
        ApiService.getSubjectWise(token),
        ApiService.getRiskStudents(token),
        ApiService.getHeatmap(token),
      ]);

      // ── Trends ─────────────────────────────────────────────────────────────
      final rawTrends = (results[0]['trends'] as List?)?.cast<Map>() ?? [];
      _trends = rawTrends.map((t) {
        final label = (t['month'] as String? ?? '');
        final rate = (t['rate'] as num?)?.toDouble() ?? 0.0;
        return _TrendPoint(
          label.length >= 7 ? label.substring(5) : label,
          rate,
        );
      }).toList();

      // ── Departments ────────────────────────────────────────────────────────
      final rawDepts = (results[1]['departments'] as List?)?.cast<Map>() ?? [];
      _depts = rawDepts
          .map(
            (d) => _DeptBar(
              d['department'] as String? ?? 'N/A',
              (d['averageRate'] as num?)?.toDouble() ?? 0.0,
            ),
          )
          .toList();

      // ── Subjects ───────────────────────────────────────────────────────────
      final rawSubjects = (results[2]['subjects'] as List?)?.cast<Map>() ?? [];
      _subjects = rawSubjects
          .map(
            (s) => _SubjectBar(
              s['subject'] as String? ?? 'N/A',
              (s['averageRate'] as num?)?.toDouble() ?? 0.0,
            ),
          )
          .toList();

      // ── Risk Students ─────────────────────────────────────────────────────
      final rawRisk = (results[3]['riskStudents'] as List?)?.cast<Map>() ?? [];
      _risk = rawRisk
          .map(
            (r) => _RiskStudent(
              r['email'] as String? ?? '',
              r['name'] as String? ?? 'Unknown',
              r['department'] as String? ?? 'N/A',
              (r['attendanceRate'] as num?)?.toDouble() ?? 0.0,
            ),
          )
          .toList();

      // ── Heatmap ────────────────────────────────────────────────────────────
      final rawHeat = (results[4]['heatmap'] as List?)?.cast<Map>() ?? [];
      _heatmap = rawHeat
          .map(
            (h) => _HeatDay(
              h['date'] as String? ?? '',
              (h['count'] as num?)?.toInt() ?? 0,
            ),
          )
          .toList();
    } catch (e) {
      _error = 'Failed to load analytics data. Please try again.';
      debugPrint('[AnalyticsDashboard] load error: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  // ── Build ──────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    return AuroraBackground(
      baseColor: AppColors.bgDeep,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          backgroundColor: Colors.transparent,
          elevation: 0,
          leading: const BackButton(color: Colors.white70),
          title: Row(
            children: [
              const CircleAvatar(
                backgroundColor: AppColors.gold,
                child: Icon(Icons.analytics_rounded, color: Colors.black),
              ),
              const SizedBox(width: 14),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Advanced Analytics',
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Text(
                    'Live Insights Engine',
                    style: TextStyle(fontSize: 10, color: Colors.amberAccent),
                  ),
                ],
              ),
            ],
          ),
          bottom: TabBar(
            controller: _tabs,
            isScrollable: true,
            indicatorColor: AppColors.gold,
            labelColor: AppColors.gold,
            unselectedLabelColor: Colors.white38,
            labelStyle: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
            tabAlignment: TabAlignment.start,
            tabs: _tabLabels.map((l) => Tab(text: l)).toList(),
          ),
        ),
        body: _loading
            ? _buildSkeleton()
            : _error != null
            ? _buildError()
            : TabBarView(
                controller: _tabs,
                children: [
                  _buildTrendsTab(),
                  _buildDepartmentsTab(),
                  _buildSubjectsTab(),
                  _buildRiskTab(),
                  _buildHeatmapTab(),
                ],
              ),
      ),
    );
  }

  // ── Loading / Error ────────────────────────────────────────────────────────
  Widget _buildSkeleton() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const CircularProgressIndicator(color: AppColors.gold),
          const SizedBox(height: 20),
          Text(
            'Crunching the numbers…',
            style: GoogleFonts.inter(color: Colors.white54, fontSize: 13),
          ),
        ],
      ),
    ).animate().fadeIn();
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: Colors.redAccent, size: 48),
          const SizedBox(height: 16),
          Text(
            _error!,
            style: GoogleFonts.inter(color: Colors.white70, fontSize: 13),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton.icon(
            onPressed: _loadAll,
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.gold,
              foregroundColor: Colors.black,
            ),
          ),
        ],
      ),
    );
  }

  // ── Tab: Trends ────────────────────────────────────────────────────────────
  Widget _buildTrendsTab() {
    if (_trends.isEmpty) return _buildEmpty('No trend data available yet.');

    final spots = _trends.asMap().entries.map((e) {
      return FlSpot(e.key.toDouble(), e.value.rate * 100);
    }).toList();

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader('Monthly Attendance Rate', Icons.show_chart),
          const SizedBox(height: 4),
          Text(
            'Last 6 months · Institution-wide',
            style: GoogleFonts.inter(color: Colors.white38, fontSize: 11),
          ),
          const SizedBox(height: 20),
          _glassCard(
            child: SizedBox(
              height: 220,
              child: LineChart(
                LineChartData(
                  minY: 0,
                  maxY: 100,
                  gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    getDrawingHorizontalLine: (_) =>
                        const FlLine(color: Colors.white10, strokeWidth: 1),
                  ),
                  borderData: FlBorderData(show: false),
                  titlesData: FlTitlesData(
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 36,
                        getTitlesWidget: (v, _) => Text(
                          '${v.toInt()}%',
                          style: GoogleFonts.inter(
                            color: Colors.white38,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        interval: 1,
                        getTitlesWidget: (v, _) {
                          final idx = v.toInt();
                          if (idx < 0 || idx >= _trends.length) {
                            return const SizedBox();
                          }
                          return Padding(
                            padding: const EdgeInsets.only(top: 6),
                            child: Text(
                              _trends[idx].month,
                              style: GoogleFonts.inter(
                                color: Colors.white38,
                                fontSize: 10,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                  ),
                  lineBarsData: [
                    LineChartBarData(
                      spots: spots,
                      isCurved: true,
                      color: AppColors.gold,
                      barWidth: 2.5,
                      belowBarData: BarAreaData(
                        show: true,
                        color: AppColors.gold.withValues(alpha: 0.15),
                      ),
                      dotData: FlDotData(
                        show: true,
                        getDotPainter: (spot, xPct, barData, index) =>
                            FlDotCirclePainter(
                              radius: 4,
                              color: AppColors.gold,
                              strokeColor: Colors.black,
                              strokeWidth: 1.5,
                            ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),
          // Legend row
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(width: 14, height: 3, color: AppColors.gold),
              const SizedBox(width: 6),
              Text(
                'Attendance Rate (%)',
                style: GoogleFonts.inter(color: Colors.white54, fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms);
  }

  // ── Tab: Departments ───────────────────────────────────────────────────────
  Widget _buildDepartmentsTab() {
    if (_depts.isEmpty) return _buildEmpty('No department data available yet.');

    final maxY =
        (_depts.map((d) => d.rate).reduce((a, b) => a > b ? a : b) * 100 + 10)
            .clamp(10.0, 110.0);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader('Department Comparison', Icons.bar_chart),
          const SizedBox(height: 4),
          Text(
            'Average attendance rate by department',
            style: GoogleFonts.inter(color: Colors.white38, fontSize: 11),
          ),
          const SizedBox(height: 20),
          _glassCard(
            child: SizedBox(
              height: 260,
              child: BarChart(
                BarChartData(
                  maxY: maxY,
                  barTouchData: BarTouchData(
                    touchCallback: (_, response) {
                      setState(() {
                        _touchedIdx =
                            response?.spot?.touchedBarGroupIndex ?? -1;
                      });
                    },
                    touchTooltipData: BarTouchTooltipData(
                      getTooltipItem: (group, groupIndex, rod, rodIndex) {
                        final d = _depts[group.x.toInt()];
                        return BarTooltipItem(
                          '${d.department}\n${(d.rate * 100).toStringAsFixed(1)}%',
                          GoogleFonts.inter(
                            color: Colors.black,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        );
                      },
                    ),
                  ),
                  titlesData: FlTitlesData(
                    leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        reservedSize: 36,
                        getTitlesWidget: (v, _) => Text(
                          '${v.toInt()}%',
                          style: GoogleFonts.inter(
                            color: Colors.white38,
                            fontSize: 10,
                          ),
                        ),
                      ),
                    ),
                    bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                        showTitles: true,
                        getTitlesWidget: (v, _) {
                          final idx = v.toInt();
                          if (idx < 0 || idx >= _depts.length) {
                            return const SizedBox();
                          }
                          final parts = _depts[idx].department.split(' ');
                          // Abbreviate long dept names
                          final label = parts.length > 1
                              ? parts.map((p) => p[0]).join('')
                              : (_depts[idx].department.length > 5
                                    ? _depts[idx].department.substring(0, 5)
                                    : _depts[idx].department);
                          return Padding(
                            padding: const EdgeInsets.only(top: 6),
                            child: Text(
                              label,
                              style: GoogleFonts.inter(
                                color: Colors.white54,
                                fontSize: 10,
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                    topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false),
                    ),
                  ),
                  borderData: FlBorderData(show: false),
                  gridData: FlGridData(
                    drawVerticalLine: false,
                    getDrawingHorizontalLine: (_) =>
                        const FlLine(color: Colors.white10, strokeWidth: 1),
                  ),
                  barGroups: _depts.asMap().entries.map((e) {
                    final touched = e.key == _touchedIdx;
                    return BarChartGroupData(
                      x: e.key,
                      barRods: [
                        BarChartRodData(
                          toY: e.value.rate * 100,
                          width: 18,
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(6),
                          ),
                          color: touched ? AppColors.gold : _deptColor(e.key),
                          backDrawRodData: BackgroundBarChartRodData(
                            show: true,
                            toY: maxY,
                            color: Colors.white.withValues(alpha: 0.04),
                          ),
                        ),
                      ],
                    );
                  }).toList(),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          // Legend chips
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _depts.asMap().entries.map((e) {
              return Chip(
                avatar: CircleAvatar(
                  backgroundColor: _deptColor(e.key),
                  radius: 6,
                ),
                label: Text(
                  '${e.value.department} — ${(e.value.rate * 100).toStringAsFixed(1)}%',
                  style: GoogleFonts.inter(color: Colors.white70, fontSize: 11),
                ),
                backgroundColor: Colors.white.withValues(alpha: 0.05),
                padding: EdgeInsets.zero,
              );
            }).toList(),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms);
  }

  Color _deptColor(int idx) {
    const palette = [
      Color(0xFFFFCC00),
      Color(0xFF4FC3F7),
      Color(0xFF81C784),
      Color(0xFFFF8A65),
      Color(0xFFBA68C8),
      Color(0xFF4DD0E1),
    ];
    return palette[idx % palette.length];
  }

  // ── Tab: Subjects ──────────────────────────────────────────────────────────
  Widget _buildSubjectsTab() {
    if (_subjects.isEmpty) return _buildEmpty('No subject data available yet.');

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader('Subject-wise Attendance', Icons.book_rounded),
          const SizedBox(height: 4),
          Text(
            'Average attendance by subject',
            style: GoogleFonts.inter(color: Colors.white38, fontSize: 11),
          ),
          const SizedBox(height: 16),
          ..._subjects.map((s) => _subjectRow(s)),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms);
  }

  Widget _subjectRow(_SubjectBar s) {
    final pct = s.rate * 100;
    final good = pct >= 75;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: _glassCard(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    s.subject,
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Text(
                  '${pct.toStringAsFixed(1)}%',
                  style: GoogleFonts.inter(
                    color: good ? Colors.greenAccent : Colors.redAccent,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: s.rate.clamp(0.0, 1.0),
                minHeight: 6,
                backgroundColor: Colors.white12,
                valueColor: AlwaysStoppedAnimation<Color>(
                  good ? Colors.greenAccent : Colors.redAccent,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Tab: Risk Students ─────────────────────────────────────────────────────
  Widget _buildRiskTab() {
    if (_risk.isEmpty) {
      return _buildEmpty(
        '🎉 No at-risk students!\nAll students are above the 75% threshold.',
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _sectionHeader('At-Risk Students', Icons.warning_amber_rounded),
              const SizedBox(height: 4),
              Text(
                '${_risk.length} students below 75% attendance',
                style: GoogleFonts.inter(
                  color: Colors.redAccent.shade100,
                  fontSize: 11,
                ),
              ),
            ],
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: _risk.length,
            itemBuilder: (ctx, i) {
              final s = _risk[i];
              final pct = (s.rate * 100).toStringAsFixed(1);
              return _glassCard(
                margin: const EdgeInsets.only(bottom: 10),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: Colors.redAccent.withValues(alpha: 0.15),
                    child: Text(
                      s.name.isNotEmpty ? s.name[0].toUpperCase() : '?',
                      style: GoogleFonts.inter(
                        color: Colors.redAccent,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  title: Text(
                    s.name,
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  subtitle: Text(
                    '${s.email}  ·  ${s.department}',
                    style: GoogleFonts.inter(
                      color: Colors.white38,
                      fontSize: 11,
                    ),
                  ),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 10,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.redAccent.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: Colors.redAccent.withValues(alpha: 0.4),
                      ),
                    ),
                    child: Text(
                      '$pct%',
                      style: GoogleFonts.inter(
                        color: Colors.redAccent,
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
              ).animate().fadeIn(delay: Duration(milliseconds: i * 60));
            },
          ),
        ),
      ],
    );
  }

  // ── Tab: Heatmap ───────────────────────────────────────────────────────────
  Widget _buildHeatmapTab() {
    if (_heatmap.isEmpty) {
      return _buildEmpty('No check-in data for the last 30 days.');
    }

    // Build a map from date → count for quick lookup
    final dateMap = {for (final h in _heatmap) h.date: h.count};
    final maxCount = _heatmap
        .map((h) => h.count)
        .reduce((a, b) => a > b ? a : b);

    // Generate all 30 days
    final now = DateTime.now().toUtc();
    final days = List.generate(30, (i) {
      final d = now.subtract(Duration(days: 29 - i));
      return DateTime.utc(d.year, d.month, d.day);
    });

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionHeader('Check-in Heatmap', Icons.calendar_month_rounded),
          const SizedBox(height: 4),
          Text(
            'Daily present count — last 30 days',
            style: GoogleFonts.inter(color: Colors.white38, fontSize: 11),
          ),
          const SizedBox(height: 20),
          _glassCard(
            child: Wrap(
              spacing: 6,
              runSpacing: 6,
              children: days.map((day) {
                final key =
                    '${day.year}-${day.month.toString().padLeft(2, '0')}-${day.day.toString().padLeft(2, '0')}';
                final count = dateMap[key] ?? 0;
                final alpha = maxCount == 0 ? 0.0 : count / maxCount;
                return Tooltip(
                  message: '$key\n$count present',
                  child: Container(
                    width: 28,
                    height: 28,
                    decoration: BoxDecoration(
                      color: count == 0
                          ? Colors.white.withValues(alpha: 0.05)
                          : AppColors.gold.withValues(alpha: 0.2 + 0.8 * alpha),
                      borderRadius: BorderRadius.circular(5),
                    ),
                    child: Center(
                      child: Text(
                        '${day.day}',
                        style: GoogleFonts.inter(
                          color: count == 0 ? Colors.white24 : Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 16),
          // Legend
          Row(
            children: [
              Container(
                width: 100,
                height: 10,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      AppColors.gold.withValues(alpha: 0.2),
                      AppColors.gold,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(4),
                ),
              ),
              const SizedBox(width: 10),
              Text(
                'Low → High attendance',
                style: GoogleFonts.inter(color: Colors.white38, fontSize: 11),
              ),
            ],
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms);
  }

  // ── Shared Helpers ─────────────────────────────────────────────────────────
  Widget _sectionHeader(String label, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: AppColors.gold, size: 18),
        const SizedBox(width: 8),
        Text(
          label,
          style: GoogleFonts.inter(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _glassCard({
    required Widget child,
    EdgeInsetsGeometry? margin,
    EdgeInsetsGeometry? padding,
  }) {
    return Container(
      margin: margin,
      padding: padding ?? const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.white.withValues(alpha: 0.08)),
      ),
      child: child,
    );
  }

  Widget _buildEmpty(String message) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(40),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.bar_chart_outlined,
              size: 56,
              color: Colors.white.withValues(alpha: 0.15),
            ),
            const SizedBox(height: 20),
            Text(
              message,
              textAlign: TextAlign.center,
              style: GoogleFonts.inter(
                color: Colors.white38,
                fontSize: 13,
                height: 1.6,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
