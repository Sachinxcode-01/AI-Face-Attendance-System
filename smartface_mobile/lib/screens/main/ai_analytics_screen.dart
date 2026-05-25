import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/constants.dart';

class AIAnalyticsScreen extends StatelessWidget {
  const AIAnalyticsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [AppColors.bgDeep, AppColors.bgDark],
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
            'Neural Analytics',
            style: GoogleFonts.inter(fontWeight: FontWeight.bold),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildPredictiveCard(),
              const SizedBox(height: 30),
              Text(
                'INSTITUTIONAL PERFORMANCE',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  letterSpacing: 2,
                  color: AppColors.gold,
                ),
              ),
              const SizedBox(height: 20),
              _buildChartPlaceholder('Attendance Trends (Weekly)'),
              const SizedBox(height: 20),
              _buildInsightCard(
                'High Dropout Risk',
                '3 students have attendance below 60% this month.',
                Icons.warning_amber_rounded,
                Colors.redAccent,
              ).animate().fadeIn(delay: 400.ms).slideX(begin: 0.05),
              _buildInsightCard(
                'Peak Attendance Time',
                'Mondays at 10:00 AM show 98% engagement.',
                Icons.trending_up_rounded,
                Colors.greenAccent,
              ).animate().fadeIn(delay: 500.ms).slideX(begin: 0.05),
              const SizedBox(height: 30),
              _buildRoleBreakdown()
                  .animate()
                  .fadeIn(delay: 600.ms)
                  .slideY(begin: 0.1),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPredictiveCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: AppColors.gold.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.psychology_outlined, color: AppColors.gold),
              const SizedBox(width: 10),
              Text(
                'AI PREDICTION',
                style: GoogleFonts.inter(
                  color: AppColors.gold,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
          const SizedBox(height: 15),
          const Text(
            'Expected attendance for next week: 92%',
            style: TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 5),
          const Text(
            'Based on historical semester patterns and holiday schedules.',
            style: TextStyle(color: Colors.white54, fontSize: 12),
          ),
        ],
      ),
    ).animate().fadeIn().slideY(begin: 0.2);
  }

  Widget _buildChartPlaceholder(String title) {
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    final heights = [60.0, 100.0, 80.0, 140.0, 120.0, 70.0, 110.0];
    return Container(
      height: 240,
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 5),
          const Text(
            'Weekly attendance performance index',
            style: TextStyle(color: Colors.white38, fontSize: 10),
          ),
          const Spacer(),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: List.generate(7, (index) {
              return Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Container(
                        width: 14,
                        height: heights[index],
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [AppColors.gold, Color(0xFFFFA500)],
                          ),
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(6),
                            topRight: Radius.circular(6),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(
                                0xFFFFD700,
                              ).withValues(alpha: 0.2),
                              blurRadius: 8,
                              offset: const Offset(0, -2),
                            ),
                          ],
                        ),
                      )
                      .animate()
                      .fadeIn(delay: (index * 80).ms)
                      .scaleY(
                        begin: 0,
                        alignment: Alignment.bottomCenter,
                        duration: 800.ms,
                      ),
                  const SizedBox(height: 8),
                  Text(
                    days[index],
                    style: GoogleFonts.inter(
                      color: Colors.white54,
                      fontSize: 10,
                    ),
                  ),
                ],
              );
            }),
          ),
        ],
      ),
    );
  }

  Widget _buildInsightCard(
    String title,
    String desc,
    IconData icon,
    Color color,
  ) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Icon(icon, color: color),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  desc,
                  style: const TextStyle(color: Colors.white38, fontSize: 12),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRoleBreakdown() {
    return Column(
      children: [
        _buildProgressRow('Students', 0.85, '1,240 Total'),
        _buildProgressRow('Teachers', 0.95, '85 Total'),
      ],
    );
  }

  Widget _buildProgressRow(String label, double value, String sub) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 15),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: const TextStyle(color: Colors.white70)),
              Text(
                sub,
                style: const TextStyle(color: Colors.white38, fontSize: 10),
              ),
            ],
          ),
          const SizedBox(height: 8),
          LinearProgressIndicator(
            value: value,
            backgroundColor: Colors.white10,
            valueColor: const AlwaysStoppedAnimation<Color>(AppColors.gold),
          ),
        ],
      ),
    );
  }
}
