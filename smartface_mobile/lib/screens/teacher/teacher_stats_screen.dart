import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

class TeacherStatsScreen extends StatelessWidget {
  const TeacherStatsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0A0E21), Color(0xFF1D2671)],
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
            'Session Analytics',
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
              _buildOverviewCards().animate().fadeIn().slideY(begin: 0.1),
              const SizedBox(height: 30),
              Text(
                'ATTENDANCE TRENDS',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  letterSpacing: 2,
                  color: const Color(0xFFFFD700),
                ),
              ),
              const SizedBox(height: 20),
              _buildSessionChart(),
              const SizedBox(height: 30),
              Text(
                'TOP ENGAGEMENT CLASSES',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  letterSpacing: 2,
                  color: const Color(0xFFFFD700),
                ),
              ),
              const SizedBox(height: 20),
              _buildEngagementItem(
                'B.Tech CS - Sem 4',
                0.95,
              ).animate().fadeIn(delay: 500.ms).slideX(begin: 0.05),
              _buildEngagementItem(
                'B.Tech IT - Sem 6',
                0.88,
              ).animate().fadeIn(delay: 600.ms).slideX(begin: 0.05),
              _buildEngagementItem(
                'BCA - Sem 2',
                0.82,
              ).animate().fadeIn(delay: 700.ms).slideX(begin: 0.05),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOverviewCards() {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            'Avg. Attendance',
            '88%',
            '+5% vs last week',
            Icons.bar_chart_rounded,
            const Color(0xFFFFD700),
          ),
        ),
        const SizedBox(width: 15),
        Expanded(
          child: _buildStatCard(
            'Engagement',
            '4.8/5',
            'Top 10% Faculty',
            Icons.auto_awesome,
            Colors.blueAccent,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(
    String label,
    String value,
    String sub,
    IconData icon,
    Color color,
  ) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 15),
          Text(
            value,
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
          ),
          Text(
            label,
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(height: 5),
          Text(
            sub,
            style: TextStyle(
              color: color.withValues(alpha: 0.7),
              fontSize: 10,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSessionChart() {
    final sessions = ['S1', 'S2', 'S3', 'S4', 'S5'];
    final heights = [120.0, 150.0, 100.0, 160.0, 140.0];
    final percentages = [90, 95, 80, 98, 92];
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Attendance Rates',
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const Icon(
                Icons.insights_rounded,
                color: Color(0xFFFFD700),
                size: 18,
              ),
            ],
          ),
          const SizedBox(height: 5),
          const Text(
            'Percentage of present students per session',
            style: TextStyle(color: Colors.white38, fontSize: 10),
          ),
          const Spacer(),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: List.generate(5, (index) {
              return Column(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  Text(
                    '${percentages[index]}%',
                    style: GoogleFonts.inter(
                      color: Colors.white70,
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Container(
                        width: 24,
                        height: heights[index],
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [Color(0xFFFFD700), Color(0xFFFFA500)],
                          ),
                          borderRadius: const BorderRadius.only(
                            topLeft: Radius.circular(8),
                            topRight: Radius.circular(8),
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
                      .fadeIn(delay: (index * 100).ms)
                      .scaleY(
                        begin: 0,
                        alignment: Alignment.bottomCenter,
                        duration: 800.ms,
                      ),
                  const SizedBox(height: 8),
                  Text(
                    sessions[index],
                    style: GoogleFonts.inter(
                      color: Colors.white38,
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

  Widget _buildEngagementItem(String title, double progress) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
              Text(
                '${(progress * 100).toInt()}%',
                style: const TextStyle(
                  color: Color(0xFFFFD700),
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          LinearProgressIndicator(
            value: progress,
            backgroundColor: Colors.white10,
            valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFFFFD700)),
            minHeight: 6,
            borderRadius: BorderRadius.circular(3),
          ),
        ],
      ),
    );
  }
}
