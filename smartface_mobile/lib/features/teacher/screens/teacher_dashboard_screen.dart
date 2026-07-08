/*
|--------------------------------------------------------------------------
| File: teacher_dashboard_screen.dart
|--------------------------------------------------------------------------
| Project: SmartFace AI
|
| Purpose:
| Premium Faculty Dashboard. Displays teacher-specific stats, today's
| classes (from API), quick-action tiles, and recent activity.
|
| Security:
| - Calls only teacher-scoped APIs (not admin endpoints)
| - Reads token from SessionManager
| - Intruder Center removed (admin-only route)
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/app/router/route_names.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/core/services/notification_service.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';
import 'package:smartface_attendance/shared/widgets/glow_refresh_indicator.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/shared/widgets/dashboard_widgets.dart';
import 'package:smartface_attendance/shared/widgets/auth_blob_background.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

// ─────────────────────────────────────────────────────────────────────────────
// Greeting helper
// ─────────────────────────────────────────────────────────────────────────────
String _greeting() {
  final hour = DateTime.now().hour;
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// ─────────────────────────────────────────────────────────────────────────────
// Widget
// ─────────────────────────────────────────────────────────────────────────────
class TeacherDashboard extends StatefulWidget {
  const TeacherDashboard({super.key});

  @override
  State<TeacherDashboard> createState() => _TeacherDashboardState();
}

class _TeacherDashboardState extends State<TeacherDashboard>
    with TickerProviderStateMixin {
  final NotificationService _notificationService = sl<NotificationService>();
  StreamSubscription? _notifSubscription;
  Timer? _refreshTimer;
  late final AnimationController _pulsingController;

  bool _isLoading = true;
  String? _error;

  // Teacher-scoped stats populated from getTeacherAnalytics + getPendingLeaves
  Map<String, dynamic> _analytics = {};
  List<dynamic> _todayClasses = [];
  int _pendingLeaves = 0;
  int _activeSessions = 0;

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  @override
  void initState() {
    super.initState();
    _pulsingController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        final session = context.read<SessionManager>();
        _notificationService.connect(token: session.token);
        _notifSubscription = _notificationService.stream.listen((data) {
          if (data['type'] == 'attendance_update') _loadData(silent: true);
        });
        _loadData();
      }
    });

    // Refresh every 30 s (lighter than 5 s — reduces server load)
    _refreshTimer = Timer.periodic(const Duration(seconds: 30), (_) {
      if (mounted) _loadData(silent: true);
    });
  }

  @override
  void dispose() {
    _pulsingController.dispose();
    _notifSubscription?.cancel();
    _refreshTimer?.cancel();
    super.dispose();
  }

  // ── Data loading (teacher-only endpoints) ─────────────────────────────────
  Future<void> _loadData({bool silent = false}) async {
    if (!mounted) return;
    if (!silent) setState(() { _isLoading = true; _error = null; });

    try {
      final session = context.read<SessionManager>();
      final token = session.token;
      final email = session.email;
      if (token == null || email == null) return;

      // Parallel teacher-scoped calls — no admin endpoint touched
      final results = await Future.wait([
        ApiService.getTeacherAnalytics(email, token),   // /attendance/teacher/analytics/:email
        ApiService.getPendingLeaves(),                   // /leave/admin/pending (returns count visible to teacher)
        ApiService.getTimetable(token),                  // /academic/timetable
      ]);

      final analytics = results[0] as Map<String, dynamic>;
      final pending   = results[1] as List<dynamic>;
      final timetable = results[2] as List<dynamic>;

      // Filter timetable to today's classes only
      final today = _weekdayLabel(DateTime.now().weekday);
      final todayClasses = timetable
          .where((c) =>
              (c['day'] as String? ?? '').toLowerCase() == today.toLowerCase())
          .toList();

      if (mounted) {
        setState(() {
          _analytics = analytics;
          _pendingLeaves = pending.length;
          _todayClasses = todayClasses;
          _activeSessions = (analytics['total_sessions'] as int? ?? 0) > 0 ? 1 : 0;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('TeacherDashboard load error: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _error = 'Unable to refresh data. Pull down to try again.';
        });
      }
    }
  }

  String _weekdayLabel(int weekday) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    return days[weekday - 1];
  }

  // ─────────────────────────────────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final themeCtrl = context.watch<ThemeController>();
    final isDark = themeCtrl.isDark;
    final session = context.read<SessionManager>();
    final double screenWidth = MediaQuery.of(context).size.width;
    final bool isTablet = screenWidth >= 600;

    if (_isLoading) {
      return Scaffold(
        backgroundColor: isDark ? AppColors.bgDark : AppColors.bgLight,
        body: const DashboardShimmer(),
      );
    }

    return AuthBlobBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: _buildAppBar(session, isDark),
        body: GlowRefreshIndicator(
          onRefresh: () => _loadData(),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: EdgeInsets.symmetric(
              horizontal: screenWidth * 0.05,
              vertical: 12,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Error banner
                if (_error != null) _buildErrorBanner(_error!),

                // ── Greeting ──────────────────────────────────────────────
                _buildGreetingHeader(session)
                    .animate()
                    .fadeIn(duration: 400.ms)
                    .slideY(begin: -0.1),

                const SizedBox(height: 20),

                // ── Active session hero card ──────────────────────────────
                _buildSessionHeroCard(context)
                    .animate()
                    .fadeIn(delay: 100.ms, duration: 400.ms)
                    .slideY(begin: 0.08),

                const SizedBox(height: 20),

                // ── Stats grid ────────────────────────────────────────────
                if (!isTablet)
                  _buildStatsGrid()
                      .animate()
                      .fadeIn(delay: 180.ms, duration: 400.ms)
                else
                  Row(
                    children: [
                      Expanded(flex: 6, child: _buildStatsGrid()),
                      const SizedBox(width: 20),
                      Expanded(flex: 4, child: _buildQuickActions(context)),
                    ],
                  ),

                const SizedBox(height: 20),

                // ── Today's classes ───────────────────────────────────────
                _buildTodayClasses()
                    .animate()
                    .fadeIn(delay: 250.ms, duration: 400.ms),

                const SizedBox(height: 20),

                // ── Quick actions (mobile only) ───────────────────────────
                if (!isTablet)
                  _buildQuickActions(context)
                      .animate()
                      .fadeIn(delay: 300.ms, duration: 400.ms),

                const SizedBox(height: 20),

                // ── Recent activity ───────────────────────────────────────
                _buildRecentActivity()
                    .animate()
                    .fadeIn(delay: 360.ms, duration: 400.ms),

                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // ── AppBar ─────────────────────────────────────────────────────────────────
  PreferredSizeWidget _buildAppBar(SessionManager session, bool isDark) {
    return PremiumAppBar(
      leadingWidth: 0,
      leading: const SizedBox.shrink(),
      title: 'Faculty Portal',
      titleWidget: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: const LinearGradient(
                colors: [Color(0xFF3559E0), Color(0xFF1B2C56)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              border: Border.all(
                color: const Color(0xFF3559E0).withValues(alpha: 0.4),
                width: 1.5,
              ),
              boxShadow: AppShadows.glow(
                const Color(0xFF3559E0),
                intensity: 0.15,
              ),
            ),
            child: Center(
              child: Text(
                (session.name ?? 'T').substring(0, 1).toUpperCase(),
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
            ),
          ),
          const SizedBox(width: 10),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                session.name ?? 'Instructor',
                style: GoogleFonts.outfit(
                  fontWeight: FontWeight.w800,
                  fontSize: 15,
                  color: const Color(0xFF1B2C56),
                ),
              ),
              Text(
                'Faculty Portal',
                style: GoogleFonts.inter(
                  fontSize: 10,
                  color: const Color(0xFF7F8CA4),
                ),
              ),
            ],
          ),
        ],
      ),
      actions: [
        IconButton(
          onPressed: () => context.push(AppRoutes.alertsNexusPath),
          icon: const Icon(
            Icons.notifications_none_rounded,
            color: Color(0xFF1B2C56),
          ),
          tooltip: 'Notifications',
        ),
        IconButton(
          onPressed: () => context.push(AppRoutes.settingsPath),
          icon: const Icon(
            Icons.settings_outlined,
            color: Color(0xFF1B2C56),
          ),
          tooltip: 'Settings',
        ),
      ],
    );
  }

  // ── Greeting header ────────────────────────────────────────────────────────
  Widget _buildGreetingHeader(SessionManager session) {
    final firstName = (session.name ?? 'Instructor').split(' ').first;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '${_greeting()}, $firstName 👋',
          style: GoogleFonts.outfit(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1B2C56),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          _todayClasses.isEmpty
              ? 'No classes scheduled today.'
              : 'You have ${_todayClasses.length} class${_todayClasses.length > 1 ? 'es' : ''} today.',
          style: GoogleFonts.inter(
            fontSize: 12,
            color: const Color(0xFF7F8CA4),
          ),
        ),
      ],
    );
  }

  // ── Error banner ───────────────────────────────────────────────────────────
  Widget _buildErrorBanner(String msg) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: AppColors.error.withValues(alpha: 0.08),
          borderRadius: BorderRadius.circular(AppRadius.md),
          border: Border.all(color: AppColors.error.withValues(alpha: 0.25)),
        ),
        child: Row(
          children: [
            const Icon(Icons.wifi_off_rounded, color: AppColors.error, size: 18),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                msg,
                style: GoogleFonts.inter(fontSize: 12, color: AppColors.error),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── Session hero card ──────────────────────────────────────────────────────
  Widget _buildSessionHeroCard(BuildContext context) {
    final isActive = _activeSessions > 0;
    final rate = (_analytics['class_attendance_rate'] as num?)?.toDouble() ?? 0.0;

    return AnimatedBuilder(
      animation: _pulsingController,
      builder: (context, _) {
        return GlassContainer(
          padding: const EdgeInsets.all(AppSpacing.lg),
          borderColor: isActive
              ? AppColors.gold.withValues(
                  alpha: 0.3 + 0.4 * _pulsingController.value,
                )
              : AppColors.gold.withValues(alpha: 0.25),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: AppColors.gold.withValues(
                      alpha: 0.12 * _pulsingController.value,
                    ),
                    blurRadius: 16 + 16 * _pulsingController.value,
                    spreadRadius: 1,
                  ),
                ]
              : null,
          gradient: const LinearGradient(
            colors: [Color(0xFF1D2671), Color(0xFF3559E0)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Status badge
              Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: isActive ? Colors.greenAccent : Colors.redAccent,
                      shape: BoxShape.circle,
                    ),
                  )
                      .animate(onPlay: (c) => c.repeat(reverse: true))
                      .scale(end: const Offset(1.5, 1.5), duration: 900.ms)
                      .boxShadow(
                        end: BoxShadow(
                          color: isActive ? Colors.greenAccent : Colors.redAccent,
                          blurRadius: 6,
                        ),
                      ),
                  const SizedBox(width: 8),
                  Text(
                    isActive ? 'LIVE SESSION ACTIVE' : 'NO ACTIVE SESSION',
                    style: GoogleFonts.inter(
                      color: Colors.white70,
                      fontWeight: FontWeight.bold,
                      fontSize: 10,
                      letterSpacing: 1.5,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 10),
              Text(
                'Attendance & QR Control',
                style: GoogleFonts.outfit(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Class avg: ${rate.toStringAsFixed(1)}% attendance',
                style: GoogleFonts.inter(
                  color: Colors.white60,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 20),

              // Action buttons — GoRouter only, no Navigator.pushNamed
              Wrap(
                spacing: 12,
                runSpacing: 10,
                children: [
                  PremiumButton(
                    onPressed: () => context.push(AppRoutes.teacherQrPath),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.qr_code_rounded, size: 16, color: Colors.black),
                        const SizedBox(width: 6),
                        Text(
                          'GENERATE QR',
                          style: GoogleFonts.inter(
                            color: Colors.black,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  PremiumButton(
                    onPressed: () => context.push(AppRoutes.teacherFeedPath),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.videocam_outlined, size: 16, color: Colors.white),
                        const SizedBox(width: 6),
                        Text(
                          'LIVE MONITOR',
                          style: GoogleFonts.inter(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                          ),
                        ),
                      ],
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

  // ── Stats grid ─────────────────────────────────────────────────────────────
  Widget _buildStatsGrid() {
    final classRate = (_analytics['class_attendance_rate'] as num?)?.toDouble() ?? 0.0;
    final totalSessions = _analytics['total_sessions']?.toString() ?? '0';
    final lowCount = (_analytics['low_attendance_students'] as List?)?.length ?? 0;

    return DashboardGrid(
      crossAxisCount: 2,
      spacing: 14,
      runSpacing: 14,
      children: [
        StatCard(
          label: 'Class Attendance',
          value: '${classRate.toStringAsFixed(1)}%',
          icon: Icons.check_circle_outline_rounded,
          accentColor: AppColors.success,
          trend: classRate >= 75 ? 'ON TRACK' : 'NEEDS ATTENTION',
          isTrendPositive: classRate >= 75,
        ),
        StatCard(
          label: 'Sessions Held',
          value: totalSessions,
          icon: Icons.bolt_rounded,
          accentColor: AppColors.gold,
          trend: 'THIS SEMESTER',
          isTrendPositive: true,
        ),
        StatCard(
          label: 'Pending Leaves',
          value: _pendingLeaves.toString(),
          icon: Icons.event_busy_rounded,
          accentColor: _pendingLeaves > 0 ? Colors.orangeAccent : AppColors.success,
          trend: _pendingLeaves > 0 ? 'REQUIRES ACTION' : 'ALL CLEAR',
          isTrendPositive: _pendingLeaves == 0,
        ),
        StatCard(
          label: 'At-Risk Students',
          value: lowCount.toString(),
          icon: Icons.warning_amber_rounded,
          accentColor: lowCount > 0 ? AppColors.error : AppColors.cyan,
          trend: lowCount > 0 ? 'BELOW 75%' : 'NONE',
          isTrendPositive: lowCount == 0,
        ),
      ],
    );
  }

  // ── Today's classes ────────────────────────────────────────────────────────
  Widget _buildTodayClasses() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          "TODAY'S SCHEDULE",
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: const Color(0xFF3559E0),
          ),
        ),
        const SizedBox(height: 12),
        if (_todayClasses.isEmpty)
          GlassContainer(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Row(
              children: [
                const Icon(Icons.event_available_rounded,
                    color: AppColors.success, size: 22),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'No classes scheduled for today. Enjoy your break!',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      color: const Color(0xFF7F8CA4),
                    ),
                  ),
                ),
              ],
            ),
          )
        else
          ...List.generate(_todayClasses.length, (i) {
            final cls = _todayClasses[i] as Map<String, dynamic>;
            return Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: _buildClassCard(cls),
            );
          }),
      ],
    );
  }

  Widget _buildClassCard(Map<String, dynamic> cls) {
    final name = cls['subject'] as String? ?? cls['name'] as String? ?? 'Class';
    final time = cls['time'] as String? ?? '';
    final room = cls['room'] as String? ?? '';
    final enrolled = cls['enrolled_count'] as int? ?? cls['students'] as int? ?? 0;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return ModernDashboardCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: const Color(0xFF3559E0).withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: const Icon(
              Icons.class_outlined,
              color: Color(0xFF3559E0),
              size: 22,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  name,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.bold,
                    fontSize: 13,
                    color: isDark ? Colors.white : const Color(0xFF1B2C56),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  [if (time.isNotEmpty) time, if (room.isNotEmpty) room]
                      .join(' · '),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    color: isDark ? Colors.white60 : const Color(0xFF7F8CA4),
                  ),
                ),
              ],
            ),
          ),
          if (enrolled > 0)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF3559E0).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppRadius.sm),
                border: Border.all(
                  color: const Color(0xFF3559E0).withValues(alpha: 0.3),
                ),
              ),
              child: Text(
                '$enrolled Students',
                style: GoogleFonts.inter(
                  color: const Color(0xFF3559E0),
                  fontWeight: FontWeight.bold,
                  fontSize: 10,
                ),
              ),
            ),
        ],
      ),
    );
  }

  // ── Quick actions ──────────────────────────────────────────────────────────
  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'QUICK ACTIONS',
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: const Color(0xFF3559E0),
          ),
        ),
        const SizedBox(height: 12),
        DashboardGrid(
          crossAxisCount: 2,
          spacing: 14,
          runSpacing: 14,
          children: [
            QuickActionCard(
              label: 'Live Monitor',
              description: 'Real-time face scan feed',
              icon: Icons.videocam_outlined,
              color: AppColors.accent,
              onTap: () => context.push(AppRoutes.teacherFeedPath),
            ),
            QuickActionCard(
              label: 'Leave Requests',
              description: 'Approve / reject leave',
              icon: Icons.approval_rounded,
              color: Colors.orangeAccent,
              onTap: () => context.push(AppRoutes.teacherLeaveDashboardPath),
            ),
            QuickActionCard(
              label: 'Command Center',
              description: 'Attendance & risk analysis',
              icon: Icons.dashboard_customize_outlined,
              color: AppColors.success,
              onTap: () => context.push(AppRoutes.teacherAttendanceCommandPath),
            ),
            QuickActionCard(
              label: 'My Stats',
              description: 'Analytics & reports',
              icon: Icons.analytics_outlined,
              color: AppColors.gold,
              onTap: () => context.push(AppRoutes.teacherStatsPath),
            ),
            QuickActionCard(
              label: 'Train AI',
              description: 'Retrain face embeddings',
              icon: Icons.face_retouching_natural_outlined,
              color: AppColors.cyan,
              onTap: () => context.push(AppRoutes.teacherTrainFacesPath),
            ),
            QuickActionCard(
              label: 'System Health',
              description: 'Server & AI diagnostics',
              icon: Icons.health_and_safety_outlined,
              color: Colors.tealAccent,
              onTap: () => context.push(AppRoutes.teacherSystemHealthPath),
            ),
          ],
        ),
      ],
    );
  }

  // ── Recent activity ────────────────────────────────────────────────────────
  Widget _buildRecentActivity() {
    final lowRisk = (_analytics['low_attendance_students'] as List?) ?? [];
    final topStudents = (_analytics['active_students'] as List?) ?? [];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'ALERTS & ACTIVITY',
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: const Color(0xFF3559E0),
          ),
        ),
        const SizedBox(height: 12),

        // At-risk student alerts
        if (lowRisk.isNotEmpty) ...[
          GlassContainer(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.warning_rounded,
                        color: Colors.orangeAccent, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'Students Below 75% Attendance',
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: const Color(0xFF1B2C56),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ...lowRisk.take(3).map((s) {
                  final m = s as Map<String, dynamic>;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Container(
                          width: 34,
                          height: 34,
                          decoration: BoxDecoration(
                            color: AppColors.error.withValues(alpha: 0.1),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              ((m['name'] as String? ?? 'S')
                                      .substring(0, 1)
                                      .toUpperCase()),
                              style: GoogleFonts.outfit(
                                fontWeight: FontWeight.bold,
                                color: AppColors.error,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                m['name'] as String? ?? 'Student',
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: const Color(0xFF1B2C56),
                                ),
                              ),
                              Text(
                                m['subject'] as String? ?? m['id'] as String? ?? '',
                                style: GoogleFonts.inter(
                                  fontSize: 10,
                                  color: const Color(0xFF7F8CA4),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.error.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${(m['score'] as num?)?.toStringAsFixed(0) ?? '-'}%',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: AppColors.error,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
          const SizedBox(height: 14),
        ],

        // Top performers
        if (topStudents.isNotEmpty)
          GlassContainer(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.emoji_events_rounded,
                        color: AppColors.gold, size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'Top Performers',
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        color: const Color(0xFF1B2C56),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ...topStudents.take(3).map((s) {
                  final m = s as Map<String, dynamic>;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Container(
                          width: 28,
                          height: 28,
                          decoration: BoxDecoration(
                            color: AppColors.gold.withValues(alpha: 0.15),
                            shape: BoxShape.circle,
                          ),
                          child: Center(
                            child: Text(
                              '#${m['rank'] ?? '?'}',
                              style: GoogleFonts.outfit(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: AppColors.gold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            m['name'] as String? ?? 'Student',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: const Color(0xFF1B2C56),
                            ),
                          ),
                        ),
                        Text(
                          '${(m['score'] as num?)?.toStringAsFixed(1) ?? '-'}%',
                          style: GoogleFonts.inter(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: AppColors.success,
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
      ],
    );
  }
}
