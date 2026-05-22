import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

class TeacherDashboard extends StatelessWidget {
  const TeacherDashboard({super.key});

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
            'Faculty Portal',
            style: GoogleFonts.outfit(fontWeight: FontWeight.bold),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
          actions: [
            IconButton(
              onPressed: () => Navigator.pushNamed(context, '/notifications'),
              icon: const Icon(Icons.notifications_none_rounded),
            ),
            IconButton(
              onPressed: () => Navigator.pushNamed(
                context,
                '/profile',
                arguments: ModalRoute.of(context)?.settings.arguments,
              ),
              icon: const Icon(Icons.account_circle_outlined),
            ),
          ],
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSessionCard(context),
              const SizedBox(height: 30),
              Text(
                'CURRENT CLASSES',
                style: GoogleFonts.outfit(
                  fontSize: 12,
                  letterSpacing: 2,
                  color: const Color(0xFFFFD700),
                ),
              ),
              const SizedBox(height: 15),
              _buildClassItem(
                'CS-402: Neural Networks',
                '10:00 AM - 11:30 AM',
                'Room 402',
                45,
              ),
              _buildClassItem(
                'CS-301: Data Structures',
                '02:00 PM - 03:30 PM',
                'Room 101',
                12,
              ),
              const SizedBox(height: 30),
              _buildActionGrid(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSessionCard(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFFFFD700), Color(0xFFFFA500)],
        ),
        borderRadius: BorderRadius.circular(30),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'READY TO START?',
            style: TextStyle(
              color: Colors.black54,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 5),
          const Text(
            'Session Control',
            style: TextStyle(
              color: Colors.black,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              ElevatedButton.icon(
                onPressed: () {
                  final args =
                      ModalRoute.of(context)?.settings.arguments as Map?;
                  Navigator.pushNamed(
                    context,
                    '/qr-generator',
                    arguments: args,
                  );
                },
                icon: const Icon(Icons.qr_code_rounded),
                label: const Text('GENERATE QR'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                ),
              ),
              const SizedBox(width: 10),
              OutlinedButton.icon(
                onPressed: () {},
                icon: const Icon(Icons.camera_alt_outlined),
                label: const Text('FACE SCAN'),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.black87,
                  side: const BorderSide(color: Colors.black26),
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().scale(delay: 200.ms);
  }

  Widget _buildClassItem(String name, String time, String room, int students) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.05)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  '$time • $room',
                  style: const TextStyle(color: Colors.white38, fontSize: 12),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFFFD700).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(
              '$students Reg.',
              style: const TextStyle(
                color: Color(0xFFFFD700),
                fontWeight: FontWeight.bold,
                fontSize: 12,
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms).slideY(begin: 0.1);
  }

  Widget _buildActionGrid(BuildContext context) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 2,
      crossAxisSpacing: 15,
      mainAxisSpacing: 15,
      childAspectRatio: 1.3,
      children: [
        _buildGridAction(
          context,
          Icons.videocam_outlined,
          'Live Monitor',
          'Real-time AI',
          '/live-monitor',
        ),
        _buildGridAction(
          context,
          Icons.approval_rounded,
          'Leave Requests',
          'Pending actions',
          '/leave-review',
        ),
        _buildGridAction(
          context,
          Icons.analytics_outlined,
          'Analytics',
          'Session reports',
          '/teacher-stats',
        ),
        _buildGridAction(
          context,
          Icons.security_outlined,
          'Intruder Alerts',
          'Threat detection',
          '/security-logs',
        ),
        _buildGridAction(
          context,
          Icons.history,
          'History',
          'Past sessions',
          '/analytics',
        ),
        _buildGridAction(
          context,
          Icons.file_download_outlined,
          'Export',
          'PDF/Excel',
          null,
        ),
      ],
    );
  }

  Widget _buildGridAction(
    BuildContext context,
    IconData icon,
    String title,
    String sub,
    String? route,
  ) {
    return InkWell(
      onTap: route != null ? () => Navigator.pushNamed(context, route) : null,
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.all(15),
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.03),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: Colors.white10),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: const Color(0xFFFFD700)),
            const Spacer(),
            Text(
              title,
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.white,
                fontSize: 13,
              ),
            ),
            Text(
              sub,
              style: const TextStyle(color: Colors.white38, fontSize: 10),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 400.ms).scale();
  }
}
