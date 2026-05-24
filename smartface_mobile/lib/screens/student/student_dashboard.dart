import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/app_state.dart';
import '../../core/constants.dart';
import '../../core/session_manager.dart';
import '../../core/theme_controller.dart';
import '../../services/notification_service.dart';
import '../../services/api_service.dart';
import '../../widgets/shimmer_loader.dart';
import 'dart:async';

class StudentDashboard extends StatefulWidget {
  const StudentDashboard({super.key});

  @override
  State<StudentDashboard> createState() => _StudentDashboardState();
}

class _StudentDashboardState extends State<StudentDashboard> {
  final NotificationService _notificationService = NotificationService();
  Map<String, dynamic>? _activeSession;
  bool _isLoading = true;
  double _overallPercentage = 0.82;
  String _standing = 'Elite Performer';
  String _rank = 'Ranked #4 in Department';
  int _streak = 12;
  List<dynamic> _subjects = [];
  StreamSubscription? _notifSubscription;

  @override
  void initState() {
    super.initState();
    final session = Provider.of<SessionManager>(context, listen: false);
    final appState = Provider.of<AppState>(context, listen: false);

    _notificationService.connect(token: session.token);
    _notifSubscription = _notificationService.stream.listen((data) {
      if (data['type'] == 'session_alert') {
        if (mounted) {
          setState(() {
            _activeSession = data;
          });
          _showSessionDialog(data);
        }
      }
      
      // Update unread count and add to AppState if matching role
      final targetUser = data['user_id'];
      final targetRole = data['role'];
      
      bool isMatch = targetUser == session.email || 
                    (targetRole == 'student' && session.isStudent);
      
      if (isMatch) {
        final newNotif = {
          'id': data['id'] ?? DateTime.now().millisecondsSinceEpoch.toString(),
          'title': data['title'] ?? 'New Alert',
          'message': data['message'] ?? 'Notification received',
          'type': data['type'] ?? 'info',
          'time': 'Just now',
          'priority': data['priority'] ?? 'Info',
          'is_read': false,
        };
        appState.addNotification(newNotif);
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _loadInitialNotifications();
        _loadStudentStats();
      }
    });
  }

  Future<void> _loadInitialNotifications() async {
    try {
      final session = context.read<SessionManager>();
      final appState = context.read<AppState>();
      final email = session.email;
      final token = session.token;
      if (email == null || token == null) return;

      final count = await ApiService.getUnreadCount(email, token);
      appState.setUnreadCount(count);
    } catch (e) {
      debugPrint('Error loading initial notifications count: $e');
    }
  }

  Future<void> _loadStudentStats() async {
    try {
      final session = context.read<SessionManager>();
      final email = session.email;
      final token = session.token;
      if (email == null || token == null) return;

      final stats = await ApiService.getStudentStats(email, token);
      if (stats.isNotEmpty) {
        if (mounted) {
          setState(() {
            _overallPercentage = stats['overall_percentage']?.toDouble() ?? 0.82;
            _standing = stats['standing'] ?? 'Elite Performer';
            _rank = stats['rank'] ?? 'Ranked #4 in Department';
            _streak = stats['streak'] ?? 12;
            _subjects = stats['subjects'] ?? [];
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error loading student stats: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _notifSubscription?.cancel();
    super.dispose();
  }

  void _showSessionDialog(Map<String, dynamic> session) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: const Color(0xFF1A1F38),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            const Icon(Icons.bolt, color: Color(0xFFFFD700)),
            const SizedBox(width: 10),
            Text(
              'Live Session Alert',
              style: GoogleFonts.inter(fontWeight: FontWeight.bold),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'A new attendance session has started for:',
              style: TextStyle(color: Colors.white70, fontSize: 12),
            ),
            const SizedBox(height: 10),
            Text(
              session['subject'] ?? 'Unknown Subject',
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFFFFD700),
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
              final args = ModalRoute.of(context)?.settings.arguments as Map?;
              Navigator.pushNamed(context, '/qr_scanner', arguments: args);
            },
            child: const Text('VERIFY NOW'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final themeCtrl = context.watch<ThemeController>();
    final appState = context.watch<AppState>();
    final isDark = themeCtrl.isDark;
    final unread = appState.unreadCount;

    if (_isLoading) {
      return Scaffold(
        backgroundColor: isDark ? AppColors.bgDark : AppColors.bgLight,
        body: const DashboardShimmer(),
      );
    }

    return Container(
      decoration: BoxDecoration(
        color: isDark ? AppColors.bgDark : AppColors.bgLight,
        image: DecorationImage(
          image: const NetworkImage(
            'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1000&q=80',
          ),
          fit: BoxFit.cover,
          colorFilter: ColorFilter.mode(
            isDark ? Colors.black.withValues(alpha: 0.15) : Colors.white.withValues(alpha: 0.85),
            isDark ? BlendMode.dstATop : BlendMode.srcOver,
          ),
        ),
      ),
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: AppBar(
          title: Text(
            'Student Nexus',
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
              onPressed: () => Navigator.pushNamed(
                context,
                '/notifications',
                arguments: ModalRoute.of(context)?.settings.arguments,
              ),
              icon: Stack(
                children: [
                  Icon(
                    Icons.notifications_none_rounded,
                    color: isDark ? Colors.white : AppColors.bgDark,
                  ),
                  if (unread > 0)
                    Positioned(
                      right: 0,
                      top: 0,
                      child: Container(
                        padding: const EdgeInsets.all(1),
                        decoration: BoxDecoration(
                          color: AppColors.errorLight,
                          borderRadius: BorderRadius.circular(6),
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 12,
                          minHeight: 12,
                        ),
                        child: Text(
                          '$unread',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 8,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
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
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_activeSession != null) ...[
                _buildActiveSessionBanner(),
                const SizedBox(height: 20),
              ],
              _buildAttendanceStatus(),
              const SizedBox(height: 20),
              _buildStreakCard(),
              const SizedBox(height: 30),
              Text(
                'MY PROGRESS',
                style: GoogleFonts.inter(
                  fontSize: 12,
                  letterSpacing: 2,
                  color: isDark ? AppColors.gold : AppColors.indigo,
                ),
              ),
              const SizedBox(height: 15),
              if (_subjects.isEmpty) ...[
                _buildSubjectProgress('Machine Learning', 0.85, '17/20 Present'),
                _buildSubjectProgress('Data Ethics', 0.92, '23/25 Present'),
                _buildSubjectProgress('Cloud Arch', 0.70, '14/20 Present'),
              ] else
                ..._subjects.map((sub) {
                  final String name = sub['subject'] ?? 'Unknown Subject';
                  final double pct = sub['percentage']?.toDouble() ?? 0.0;
                  final int present = sub['present'] ?? 0;
                  final int total = sub['total'] ?? 0;
                  final pctText = '${(pct * 100).toInt()}%';
                  return _buildSubjectProgress(name, pct, '$present/$total ($pctText)');
                }),
              const SizedBox(height: 30),
              _buildActionButtons(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildActiveSessionBanner() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [const Color(0xFF1D2671), const Color(0xFFC33764)],
        ),
        borderRadius: BorderRadius.circular(25),
        boxShadow: [
          BoxShadow(
            color: Colors.redAccent.withValues(alpha: 0.2),
            blurRadius: 15,
            spreadRadius: 2,
          ),
        ],
      ),
      child: Row(
        children: [
          const Icon(
            Icons.sensors,
            color: Colors.white,
            size: 30,
          ).animate(onPlay: (c) => c.repeat()).shimmer(duration: 2.seconds),
          const SizedBox(width: 15),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'SESSION ACTIVE',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    letterSpacing: 1,
                  ),
                ),
                Text(
                  _activeSession?['subject'] ?? 'Unknown',
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () {
              final args = ModalRoute.of(context)?.settings.arguments as Map?;
              Navigator.pushNamed(context, '/qr_scanner', arguments: args);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            child: const Text(
              'VERIFY',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
            ),
          ),
        ],
      ),
    ).animate().shake(duration: 500.ms);
  }

  Widget _buildAttendanceStatus() {
    return Container(
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(30),
        border: Border.all(
          color: AppColors.gold.withValues(alpha: 0.15),
        ),
      ),
      child: Row(
        children: [
          TweenAnimationBuilder<double>(
            tween: Tween<double>(begin: 0.0, end: _overallPercentage),
            duration: 1500.ms,
            curve: Curves.fastOutSlowIn,
            builder: (context, value, child) {
              final pctText = '${(value * 100).toInt()}%';
              return Stack(
                alignment: Alignment.center,
                children: [
                  // Outer breathing ring
                  Container(
                    width: 90,
                    height: 90,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.gold.withValues(alpha: 0.05),
                        width: 1.5,
                      ),
                    ),
                  ).animate(onPlay: (c) => c.repeat(reverse: true))
                   .scale(begin: const Offset(0.95, 0.95), end: const Offset(1.04, 1.04), duration: 2.seconds, curve: Curves.easeInOut),

                  // Circular Progress Indicator with drop shadow glow
                  Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.gold.withValues(alpha: 0.15 * value),
                          blurRadius: 14,
                          spreadRadius: 1,
                        ),
                      ],
                    ),
                    child: CircularProgressIndicator(
                      value: value,
                      backgroundColor: Colors.white.withValues(alpha: 0.06),
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.gold),
                      strokeWidth: 7,
                      strokeCap: StrokeCap.round,
                    ),
                  ),
                  Text(
                    pctText,
                    style: GoogleFonts.inter(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ],
              );
            },
          ),
          const SizedBox(width: 25),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'OVERALL STANDING',
                  style: TextStyle(
                    color: Colors.white38,
                    fontSize: 10,
                    letterSpacing: 1,
                  ),
                ),
                Text(
                  _standing,
                  style: const TextStyle(
                    color: AppColors.gold,
                    fontWeight: FontWeight.bold,
                    fontSize: 20,
                  ),
                ),
                const SizedBox(height: 5),
                Text(
                  _rank,
                  style: GoogleFonts.inter(
                    color: Colors.white54,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 100.ms).slideY(begin: 0.1);
  }

  Widget _buildStreakCard() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [
            AppColors.gold.withValues(alpha: 0.15),
            Colors.transparent,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(
          color: AppColors.gold.withValues(alpha: 0.15),
        ),
      ),
      child: Row(
        children: [
          const Icon(
                Icons.local_fire_department_rounded,
                color: Colors.orangeAccent,
                size: 40,
              )
              .animate(onPlay: (controller) => controller.repeat())
              .shimmer(duration: 2000.ms),
          const SizedBox(width: 15),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                '$_streak DAY STREAK',
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: Colors.white,
                ),
              ),
              Text(
                _streak > 0 ? 'Your consistency is legendary!' : 'Check in to start your streak!',
                style: const TextStyle(color: Colors.white54, fontSize: 12),
              ),
            ],
          ),
          const Spacer(),
          const Text('🔥', style: TextStyle(fontSize: 24)),
        ],
      ),
    ).animate().fadeIn(delay: 200.ms).slideY(begin: 0.1);
  }

  Widget _buildSubjectProgress(String subject, double value, String sub) {
    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white.withValues(alpha: 0.04)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                subject,
                style: const TextStyle(
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              Text(
                sub,
                style: const TextStyle(color: Colors.white38, fontSize: 10),
              ),
            ],
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(5),
            child: LinearProgressIndicator(
              value: value,
              backgroundColor: Colors.white10,
              valueColor: AlwaysStoppedAnimation<Color>(
                value < 0.75 ? AppColors.error : AppColors.gold,
              ),
              minHeight: 4,
            ),
          ),
        ],
      ),
    ).animate().fadeIn(delay: 300.ms).slideX(begin: 0.05);
  }

  Widget _buildActionButtons(BuildContext context) {
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                onPressed: () {
                  final args =
                      ModalRoute.of(context)?.settings.arguments as Map?;
                  Navigator.pushNamed(context, '/qr_scanner', arguments: args);
                },
                icon: const Icon(Icons.qr_code_scanner),
                label: const Text('MARK ATTENDANCE'),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 20),
                ),
              ),
            ),
            const SizedBox(width: 15),
            GestureDetector(
              onTap: () {
                final args = ModalRoute.of(context)?.settings.arguments as Map?;
                Navigator.pushNamed(context, '/analyst', arguments: args);
              },
              child: Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFD700).withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: const Color(0xFFFFD700).withValues(alpha: 0.3),
                  ),
                ),
                child: const Icon(
                  Icons.psychology_outlined,
                  color: Color(0xFFFFD700),
                  size: 30,
                ),
              ),
            ),
            const SizedBox(width: 15),
            GestureDetector(
              onTap: () {
                final args = ModalRoute.of(context)?.settings.arguments as Map?;
                Navigator.pushNamed(context, '/leave-history', arguments: args);
              },
              child: Container(
                padding: const EdgeInsets.all(15),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.05),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: Colors.white.withValues(alpha: 0.1),
                  ),
                ),
                child: const Icon(
                  Icons.calendar_month_outlined,
                  color: Colors.white70,
                  size: 30,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 15),
        const Text(
          'TAP BRAIN FOR AI ANALYST | CALENDAR FOR LEAVE',
          style: TextStyle(
            color: Colors.white24,
            fontSize: 8,
            letterSpacing: 1,
          ),
        ),
      ],
    ).animate().slideY(begin: 0.1);
  }
}
