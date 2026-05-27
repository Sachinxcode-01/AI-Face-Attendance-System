import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../../core/session_manager.dart';
import '../../services/api_service.dart';

class TeacherStatsScreen extends StatefulWidget {
  const TeacherStatsScreen({super.key});

  @override
  State<TeacherStatsScreen> createState() => _TeacherStatsScreenState();
}

class _TeacherStatsScreenState extends State<TeacherStatsScreen> {
  bool _isLoading = true;
  int _touchedPieIndex = -1;

  // Chart data
  final List<double> _weeklyData = [88, 91, 78, 95, 82, 89, 93];
  final List<String> _weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  final List<Map<String, dynamic>> _classDistribution = [
    {'name': 'B.Tech CS', 'value': 38, 'color': const Color(0xFF00C6FF)},
    {'name': 'B.Tech IT', 'value': 28, 'color': const Color(0xFF7B2FF7)},
    {'name': 'BCA', 'value': 20, 'color': const Color(0xFFFFD700)},
    {'name': 'MCA', 'value': 14, 'color': const Color(0xFF00FF88)},
  ];

  final List<Map<String, dynamic>> _lowAttendance = [
    {'name': 'Arjun Sharma', 'id': 'CS21001', 'percent': 58, 'subject': 'Neural Networks'},
    {'name': 'Priya Patel', 'id': 'IT21045', 'percent': 62, 'subject': 'DBMS'},
    {'name': 'Rohan Mehta', 'id': 'BCA22008', 'percent': 64, 'subject': 'Web Dev'},
    {'name': 'Sneha Verma', 'id': 'MCA21032', 'percent': 67, 'subject': 'Cloud Computing'},
    {'name': 'Karan Singh', 'id': 'CS22019', 'percent': 69, 'subject': 'ML Fundamentals'},
  ];

  // ignore: prefer_final_fields  — intentionally mutable; updated via setState
  Map<String, String> _overviewStats = {
    'avg_attendance': '88%',
    'total_sessions': '124',
    'avg_confidence': '94.2%',
    'on_time_rate': '91%',
  };

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadStats());
  }

  Future<void> _loadStats() async {
    if (!mounted) return;
    setState(() => _isLoading = true);
    try {
      final session = context.read<SessionManager>();
      if (session.token != null) {
        final data = await ApiService.getAdminStats(session.token!);
        if (mounted && data.isNotEmpty) {
          setState(() {
            if (data['attendance_today'] != null) {
              _overviewStats['avg_attendance'] = data['attendance_today'].toString();
            }
          });
        }
      }
    } catch (e) {
      debugPrint('[TeacherStats] load error: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF050915), Color(0xFF0A1628), Color(0xFF070B1A)],
        ),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: Text(
            'Analytics & Insights',
            style: GoogleFonts.inter(
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
          iconTheme: const IconThemeData(color: Colors.white),
          actions: [
            IconButton(
              onPressed: _loadStats,
              icon: const Icon(Icons.refresh_rounded, color: Color(0xFFFFD700)),
            ),
          ],
        ),
        body: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: Color(0xFFFFD700)),
              )
            : RefreshIndicator(
                onRefresh: _loadStats,
                color: const Color(0xFFFFD700),
                backgroundColor: const Color(0xFF070B1A),
                child: SingleChildScrollView(
                  physics: const AlwaysScrollableScrollPhysics(),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildOverviewRow()
                          .animate()
                          .fadeIn()
                          .slideY(begin: 0.08),
                      const SizedBox(height: 28),
                      _buildLabel('7-DAY ATTENDANCE TREND'),
                      const SizedBox(height: 16),
                      _buildLineChart()
                          .animate()
                          .fadeIn(delay: 100.ms)
                          .slideY(begin: 0.05),
                      const SizedBox(height: 28),
                      _buildLabel('CLASS DISTRIBUTION'),
                      const SizedBox(height: 16),
                      _buildPieChartRow()
                          .animate()
                          .fadeIn(delay: 200.ms),
                      const SizedBox(height: 28),
                      _buildLabel('SUBJECT ATTENDANCE BARS'),
                      const SizedBox(height: 16),
                      _buildSubjectBars()
                          .animate()
                          .fadeIn(delay: 300.ms),
                      const SizedBox(height: 28),
                      _buildLabel('⚠️  LOW ATTENDANCE RISK'),
                      const SizedBox(height: 16),
                      _buildLowAttendanceList(),
                      const SizedBox(height: 30),
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
        color: const Color(0xFFFFD700),
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildOverviewRow() {
    final cards = [
      ('AVG ATTENDANCE', _overviewStats['avg_attendance']!, Icons.bar_chart_rounded, const Color(0xFF00C6FF)),
      ('SESSIONS', _overviewStats['total_sessions']!, Icons.calendar_today_rounded, const Color(0xFFFFD700)),
      ('AI CONFIDENCE', _overviewStats['avg_confidence']!, Icons.auto_awesome_rounded, const Color(0xFF7B2FF7)),
      ('ON TIME RATE', _overviewStats['on_time_rate']!, Icons.timer_rounded, const Color(0xFF00FF88)),
    ];

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: cards
          .map(
            (c) => Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0A0F2A).withValues(alpha: 0.8),
                borderRadius: BorderRadius.circular(22),
                border: Border.all(color: c.$4.withValues(alpha: 0.15)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(c.$3, color: c.$4, size: 18),
                  const SizedBox(height: 8),
                  Text(
                    c.$2,
                    style: GoogleFonts.robotoMono(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                    ),
                  ),
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
            ),
          )
          .toList(),
    );
  }

  Widget _buildLineChart() {
    return Container(
      height: 220,
      padding: const EdgeInsets.fromLTRB(8, 20, 20, 8),
      decoration: BoxDecoration(
        color: const Color(0xFF0A0F2A).withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF00C6FF).withValues(alpha: 0.12)),
      ),
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
                  if (idx < 0 || idx >= _weekDays.length) {
                    return const SizedBox.shrink();
                  }
                  return Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      _weekDays[idx],
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
            topTitles:
                const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles:
                const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          ),
          lineBarsData: [
            LineChartBarData(
              spots: List.generate(
                _weeklyData.length,
                (i) => FlSpot(i.toDouble(), _weeklyData[i]),
              ),
              isCurved: true,
              curveSmoothness: 0.4,
              color: const Color(0xFF00C6FF),
              barWidth: 2.5,
              dotData: FlDotData(
                show: true,
                getDotPainter: (spot, pct, bar, idx) =>
                    FlDotCirclePainter(
                  radius: 3.5,
                  color: const Color(0xFF00C6FF),
                  strokeColor: Colors.white,
                  strokeWidth: 1.5,
                ),
              ),
              belowBarData: BarAreaData(
                show: true,
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    const Color(0xFF00C6FF).withValues(alpha: 0.25),
                    const Color(0xFF00C6FF).withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
          ],
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              getTooltipColor: (_) => const Color(0xFF070B1A),
              getTooltipItems: (spots) => spots
                  .map(
                    (s) => LineTooltipItem(
                      '${s.y.toStringAsFixed(0)}%\n${_weekDays[s.x.toInt()]}',
                      GoogleFonts.robotoMono(
                        color: const Color(0xFF00C6FF),
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
    );
  }

  Widget _buildPieChartRow() {
    return Row(
      children: [
        SizedBox(
          width: 160,
          height: 160,
          child: PieChart(
            PieChartData(
              pieTouchData: PieTouchData(
                touchCallback: (event, pieTouchResponse) {
                  setState(() {
                    if (!event.isInterestedForInteractions ||
                        pieTouchResponse == null ||
                        pieTouchResponse.touchedSection == null) {
                      _touchedPieIndex = -1;
                      return;
                    }
                    _touchedPieIndex =
                        pieTouchResponse.touchedSection!.touchedSectionIndex;
                  });
                },
              ),
              sectionsSpace: 3,
              centerSpaceRadius: 40,
              sections: List.generate(_classDistribution.length, (i) {
                final item = _classDistribution[i];
                final isTouched = i == _touchedPieIndex;
                return PieChartSectionData(
                  color: item['color'] as Color,
                  value: (item['value'] as int).toDouble(),
                  title: '${item['value']}%',
                  radius: isTouched ? 55 : 45,
                  titleStyle: GoogleFonts.robotoMono(
                    fontSize: isTouched ? 11 : 9,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                );
              }),
            ),
          ),
        ),
        const SizedBox(width: 20),
        Expanded(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: _classDistribution
                .map(
                  (item) => Padding(
                    padding: const EdgeInsets.symmetric(vertical: 6),
                    child: Row(
                      children: [
                        Container(
                          width: 10,
                          height: 10,
                          decoration: BoxDecoration(
                            color: item['color'] as Color,
                            borderRadius: BorderRadius.circular(3),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            item['name'] as String,
                            style: GoogleFonts.inter(
                              color: Colors.white70,
                              fontSize: 11,
                            ),
                          ),
                        ),
                        Text(
                          '${item['value']}%',
                          style: GoogleFonts.robotoMono(
                            color: item['color'] as Color,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                  ),
                )
                .toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildSubjectBars() {
    final subjects = [
      ('Neural Networks', 0.95, const Color(0xFF00C6FF)),
      ('Data Structures', 0.88, const Color(0xFFFFD700)),
      ('DBMS', 0.82, const Color(0xFF7B2FF7)),
      ('Web Development', 0.77, const Color(0xFF00FF88)),
      ('Cloud Computing', 0.91, const Color(0xFFFF6B35)),
    ];

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF0A0F2A).withValues(alpha: 0.8),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(
            color: const Color(0xFFFFD700).withValues(alpha: 0.08)),
      ),
      child: Column(
        children: subjects
            .asMap()
            .entries
            .map(
              (e) => Padding(
                padding: const EdgeInsets.only(bottom: 14),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          e.value.$1,
                          style: GoogleFonts.inter(
                            color: Colors.white70,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '${(e.value.$2 * 100).toInt()}%',
                          style: GoogleFonts.robotoMono(
                            color: e.value.$3,
                            fontWeight: FontWeight.bold,
                            fontSize: 11,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(6),
                      child: LinearProgressIndicator(
                        value: e.value.$2,
                        minHeight: 7,
                        backgroundColor: Colors.white10,
                        valueColor:
                            AlwaysStoppedAnimation<Color>(e.value.$3),
                      ),
                    ),
                  ],
                ).animate().fadeIn(delay: (e.key * 80).ms).slideX(begin: 0.04),
              ),
            )
            .toList(),
      ),
    );
  }

  Widget _buildLowAttendanceList() {
    return Column(
      children: _lowAttendance
          .asMap()
          .entries
          .map(
            (e) => Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF1A0A0A).withValues(alpha: 0.8),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(
                  color: const Color(0xFFFF5555).withValues(alpha: 0.2),
                ),
              ),
              child: Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: const Color(0xFFFF5555).withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: const Color(0xFFFF5555).withValues(alpha: 0.3),
                      ),
                    ),
                    child: Center(
                      child: Text(
                        e.value['name'].toString().substring(0, 2).toUpperCase(),
                        style: GoogleFonts.inter(
                          color: const Color(0xFFFF5555),
                          fontWeight: FontWeight.bold,
                          fontSize: 13,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          e.value['name'] as String,
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${e.value['id']} • ${e.value['subject']}',
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
                        '${e.value['percent']}%',
                        style: GoogleFonts.robotoMono(
                          color: const Color(0xFFFF5555),
                          fontWeight: FontWeight.bold,
                          fontSize: 18,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color:
                              const Color(0xFFFF5555).withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                              color: const Color(0xFFFF5555)
                                  .withValues(alpha: 0.3)),
                        ),
                        child: Text(
                          'AT RISK',
                          style: GoogleFonts.inter(
                            color: const Color(0xFFFF5555),
                            fontSize: 7,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1,
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ).animate().fadeIn(delay: (e.key * 60).ms).slideX(begin: 0.03),
          )
          .toList(),
    );
  }
}
