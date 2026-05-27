import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/constants.dart';
import '../../core/session_manager.dart';
import '../../core/theme_controller.dart';
import '../../services/api_service.dart';
import '../../services/notification_service.dart';
import '../../widgets/shimmer_loader.dart';

class TeacherDashboard extends StatefulWidget {
  const TeacherDashboard({super.key});

  @override
  State<TeacherDashboard> createState() => _TeacherDashboardState();
}

class _TeacherDashboardState extends State<TeacherDashboard> {
  final NotificationService _notificationService = NotificationService();
  StreamSubscription? _notifSubscription;
  Timer? _telemetryTimer;

  bool _isLoading = true;
  Map<String, dynamic> _stats = {
    'total_students': '1247',
    'total_teachers': '86',
    'active_sessions': '0',
    'attendance_today': '89%',
    'intruder_alerts': '0',
    'pending_leaves': '0',
    'present_count': '0'
  };

  Map<String, dynamic> _telemetry = {
    'cpu_usage': 30,
    'gpu_usage': 45,
    'memory_usage': 52,
    'scan_fps': 15.0,
    'api_response_time': 50,
    'ai_engine_status': 'Healthy',
    'hardware_acceleration': 'CUDA',
    'mongodb_connection': 'Connected',
    'intruder_count': 0
  };

  @override
  void initState() {
    super.initState();
    final session = Provider.of<SessionManager>(context, listen: false);
    
    // Listen for live database changes via Websockets
    _notificationService.connect(token: session.token);
    _notifSubscription = _notificationService.stream.listen((data) {
      if (data['type'] == 'attendance_update' || data['type'] == 'intruder_alert') {
        _loadData(silent: true);
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _loadData();
      }
    });

    // Fluctuating hardware telemetry queries
    _telemetryTimer = Timer.periodic(const Duration(seconds: 5), (timer) {
      if (mounted) {
        _loadData(silent: true);
      }
    });
  }

  Future<void> _loadData({bool silent = false}) async {
    if (!mounted) return;
    if (!silent) {
      setState(() => _isLoading = true);
    }

    try {
      final session = context.read<SessionManager>();
      if (session.token == null) return;

      final results = await Future.wait([
        ApiService.getAdminStats(session.token!),
        ApiService.getSystemTelemetry(session.token!)
      ]);

      if (mounted) {
        setState(() {
          _stats = results[0];
          _telemetry = results[1].isEmpty ? _telemetry : results[1];
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Teacher Dashboard data load error: $e');
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  void dispose() {
    _notifSubscription?.cancel();
    _telemetryTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final themeCtrl = context.watch<ThemeController>();
    final isDark = themeCtrl.isDark;

    if (_isLoading) {
      return Scaffold(
        backgroundColor: isDark ? AppColors.bgDark : AppColors.bgLight,
        body: const DashboardShimmer(),
      );
    }

    final hasIntruderAlert = int.parse(_stats['intruder_alerts'] ?? '0') > 0 || 
        (_telemetry['intruder_count'] as int? ?? 0) > 0;

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
          title: Text(
            'Faculty Portal',
            style: GoogleFonts.inter(
              fontWeight: FontWeight.bold,
              color: isDark ? Colors.white : AppColors.bgDark,
            ),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
          actions: [
            IconButton(
              icon: Icon(
                isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
                color: AppColors.gold,
              ),
              onPressed: () => themeCtrl.toggle(),
            ),
            IconButton(
              onPressed: () => Navigator.pushNamed(context, '/notifications'),
              icon: Icon(
                Icons.notifications_none_rounded,
                color: isDark ? Colors.white : AppColors.bgDark,
              ),
            ),
            IconButton(
              onPressed: () => Navigator.pushNamed(
                context,
                '/profile',
                arguments: ModalRoute.of(context)?.settings.arguments,
              ),
              icon: Icon(
                Icons.account_circle_outlined,
                color: isDark ? Colors.white : AppColors.bgDark,
              ),
            ),
          ],
        ),
        body: RefreshIndicator(
          onRefresh: () => _loadData(silent: false),
          color: AppColors.gold,
          backgroundColor: const Color(0xFF070B1A),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildSessionCard(context),
                const SizedBox(height: 25),
                
                // Real-time stats grid
                _buildTeacherStatsGrid(hasIntruderAlert),
                const SizedBox(height: 30),
                
                Text(
                  'CURRENT CLASSES & SCHEDULING',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    letterSpacing: 2,
                    color: const Color(0xFFFFD700),
                    fontWeight: FontWeight.bold,
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
                
                Text(
                  'FACULTY COMMAND CONTROLS',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    letterSpacing: 2,
                    color: const Color(0xFFFFD700),
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 15),
                _buildActionGrid(context),
              ],
            ),
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
          colors: [Color(0xFF1D2671), Color(0xFFC33764)],
        ),
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFFC33764).withValues(alpha: 0.15),
            blurRadius: 15,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'ACTIVE CLASSROOM SYSTEM',
            style: TextStyle(
              color: Colors.white70,
              fontWeight: FontWeight.bold,
              fontSize: 10,
              letterSpacing: 1.5,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            'Attendance Control',
            style: GoogleFonts.inter(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              ElevatedButton.icon(
                onPressed: () {
                  final args = ModalRoute.of(context)?.settings.arguments as Map?;
                  Navigator.pushNamed(
                    context,
                    '/qr-generator',
                    arguments: args,
                  );
                },
                icon: const Icon(Icons.qr_code_rounded, size: 18),
                label: const Text('GENERATE QR', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  elevation: 4,
                ),
              ),
              const SizedBox(width: 12),
              OutlinedButton.icon(
                onPressed: () => Navigator.pushNamed(context, '/live-monitor'),
                icon: const Icon(Icons.videocam_outlined, size: 18),
                label: const Text('LIVE FEED', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                style: OutlinedButton.styleFrom(
                  foregroundColor: Colors.white,
                  side: const BorderSide(color: Colors.white24, width: 1.2),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                ),
              ),
            ],
          ),
        ],
      ),
    ).animate().scale(delay: 150.ms);
  }

  Widget _buildTeacherStatsGrid(bool hasIntruderAlert) {
    final double cardWidth = (MediaQuery.of(context).size.width - 55) / 2;
    return Column(
      children: [
        Row(
          children: [
            _buildStatBox(
              'TODAY PRESENTS',
              _stats['present_count']?.toString() ?? '42',
              'Active verification logs',
              Icons.check_circle_outline_rounded,
              const Color(0xFF76E600),
              cardWidth,
            ),
            const SizedBox(width: 15),
            _buildStatBox(
              'ACTIVE SESSIONS',
              _stats['active_sessions']?.toString() ?? '0',
              'Classroom live grids',
              Icons.bolt_rounded,
              AppColors.gold,
              cardWidth,
            ),
          ],
        ),
        const SizedBox(height: 15),
        Row(
          children: [
            _buildStatBox(
              'LEAVE REQUESTS',
              _stats['pending_leaves']?.toString() ?? '0',
              'Pending leaves logs',
              Icons.event_busy_rounded,
              Colors.orangeAccent,
              cardWidth,
            ),
            const SizedBox(width: 15),
            _buildStatBox(
              'SECURITY INTRUDERS',
              _stats['intruder_alerts']?.toString() ?? '0',
              hasIntruderAlert ? 'ALERT: UNKNOWN PERSON!' : 'System is secure',
              Icons.security_rounded,
              hasIntruderAlert ? const Color(0xFFF05050) : const Color(0xFF00C6FF),
              cardWidth,
              glowColor: hasIntruderAlert ? const Color(0xFFF05050).withValues(alpha: 0.2) : null,
              pulse: hasIntruderAlert,
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatBox(
    String label,
    String val,
    String sub,
    IconData icon,
    Color color,
    double width, {
    Color? glowColor,
    bool pulse = false,
  }) {
    Widget content = Container(
      width: width,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: const Color(0xFF070B1A).withValues(alpha: 0.7),
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: color.withValues(alpha: pulse ? 0.4 : 0.1), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: glowColor ?? color.withValues(alpha: 0.04),
            blurRadius: 15,
            spreadRadius: 1,
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Icon(icon, color: color, size: 20),
              if (pulse)
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                ).animate(onPlay: (c) => c.repeat()).fadeOut(duration: 800.ms),
            ],
          ),
          const SizedBox(height: 15),
          Text(
            val,
            style: GoogleFonts.robotoMono(fontSize: 26, fontWeight: FontWeight.bold, color: Colors.white),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: GoogleFonts.inter(color: color, fontWeight: FontWeight.bold, fontSize: 9, letterSpacing: 0.5),
          ),
          const SizedBox(height: 2),
          Text(
            sub,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: const TextStyle(color: Colors.white38, fontSize: 9),
          ),
        ],
      ),
    );

    if (pulse) {
      return content.animate(onPlay: (c) => c.repeat(reverse: true)).scale(
            begin: const Offset(0.98, 0.98),
            end: const Offset(1.02, 1.02),
            duration: 1.seconds,
          );
    }
    return content;
  }

  Widget _buildClassItem(String name, String time, String room, int students) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: const Color(0xFF070B1A).withValues(alpha: 0.6),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.1)),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$time • $room',
                  style: const TextStyle(color: Colors.white38, fontSize: 11),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: AppColors.gold.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
            ),
            child: Text(
              '$students Registered',
              style: const TextStyle(
                color: AppColors.gold,
                fontWeight: FontWeight.bold,
                fontSize: 10,
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.05);
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
          'Real-time CCTV & Logs',
          '/live-monitor',
        ),
        _buildGridAction(
          context,
          Icons.approval_rounded,
          'Leave Requests',
          'Action pending leaves',
          '/leave-review',
        ),
        _buildGridAction(
          context,
          Icons.analytics_outlined,
          'Analytics & Heatmaps',
          'Attendance lines & stats',
          '/teacher-stats',
        ),
        _buildGridAction(
          context,
          Icons.security_outlined,
          'Intruder Center',
          'AI suspicious activity logs',
          '/security-logs',
        ),
        _buildGridAction(
          context,
          Icons.health_and_safety_outlined,
          'System Telemetry',
          'CPU, GPU & engine diagnostics',
          '/system-health',
        ),
        _buildGridAction(
          context,
          Icons.face_retouching_natural_outlined,
          'Train AI Faces',
          'Upload embeddings & retrain',
          '/train-faces',
        ),
      ],
    );
  }

  Widget _buildGridAction(
    BuildContext context,
    IconData icon,
    String title,
    String sub,
    String route,
  ) {
    return InkWell(
      onTap: () => Navigator.pushNamed(context, route),
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF070B1A).withValues(alpha: 0.6),
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: AppColors.gold.withValues(alpha: 0.08)),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: AppColors.gold, size: 22),
            const Spacer(),
            Text(
              title,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.inter(
                fontWeight: FontWeight.bold,
                color: Colors.white,
                fontSize: 13,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              sub,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
              style: const TextStyle(color: Colors.white38, fontSize: 9),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(delay: 250.ms).scale();
  }
}
