/*
|--------------------------------------------------------------------------
| File: teacher_dashboard_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Renders the premium Faculty Portal dashboard for teachers and instructors.
| Handles responsive layout structures for handheld mobile vs tablet screens.
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';

// ======================================================
// Core State & Constants
// ======================================================
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';
import 'package:smartface_attendance/app/router/route_names.dart';

// ======================================================
// Services & Custom Widgets
// ======================================================
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/core/services/notification_service.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';
import 'package:smartface_attendance/shared/widgets/glow_refresh_indicator.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/shared/widgets/auth_blob_background.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

/// Central hub screen for faculty members to access attendance, live CCTV monitoring, system health, and student stats.
class TeacherDashboard extends StatefulWidget {
  const TeacherDashboard({super.key});

  @override
  State<TeacherDashboard> createState() => _TeacherDashboardState();
}

class _TeacherDashboardState extends State<TeacherDashboard>
    with TickerProviderStateMixin {
  final NotificationService _notificationService = sl<NotificationService>();
  StreamSubscription? _notifSubscription;
  Timer? _telemetryTimer;
  late final AnimationController _pulsingSessionController;

  bool _isLoading = true;
  Map<String, dynamic> _stats = {
    'total_students': '1247',
    'total_teachers': '86',
    'active_sessions': '0',
    'attendance_today': '89%',
    'intruder_alerts': '0',
    'pending_leaves': '0',
    'present_count': '0',
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
    'intruder_count': 0,
  };

  @override
  void initState() {
    super.initState();
    _pulsingSessionController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    final session = Provider.of<SessionManager>(context, listen: false);

    // Listen for live database changes via Websockets
    _notificationService.connect(token: session.token);
    _notifSubscription = _notificationService.stream.listen((data) {
      if (data['type'] == 'attendance_update' ||
          data['type'] == 'intruder_alert') {
        _loadData(silent: true);
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        _loadData();
      }
    });

    // Periodic telemetry queries
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
        ApiService.getSystemTelemetry(session.token!),
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
    _pulsingSessionController.dispose();
    _notifSubscription?.cancel();
    _telemetryTimer?.cancel();
    super.dispose();
  }

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

    final hasIntruderAlert =
        int.parse(_stats['intruder_alerts'] ?? '0') > 0 ||
        (_telemetry['intruder_count'] as int? ?? 0) > 0;

    final header = _buildWelcomeHeader(isDark, session);
    final sessionCard = _buildSessionCard(context, isDark);
    final statsGrid = _buildStatsGrid(isDark, hasIntruderAlert);
    final classSchedulingList = _buildClassSchedulingSection(isDark);
    final commandActionsGrid = _buildQuickActions(context);
    final telemetryInfo = _buildTelemetryDiagnostics(isDark);

    return AuthBlobBackground(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: PremiumAppBar(
          title: 'Faculty Dashboard',
          leadingWidth: 0,
          leading: const SizedBox.shrink(),
          titleWidget: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: const Color(0xFF3559E0), width: 1.5),
                  boxShadow: AppShadows.glow(const Color(0xFF3559E0), intensity: 0.1),
                ),
                child: CircleAvatar(
                  backgroundColor: const Color(0xFFE5ECFC),
                  child: Text(
                    (session.name ?? 'F').substring(0, 1).toUpperCase(),
                    style: GoogleFonts.outfit(
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF3559E0),
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
                      fontSize: 16,
                      color: const Color(0xFF1B2C56),
                    ),
                  ),
                  Text(
                    'Faculty Access Portal',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: const Color(0xFF7F8CA4),
                    ),
                  ),
                ],
              ),
            ],
          ),
          actions: [
            IconButton(
              onPressed: () => context.push('/notifications/nexus'),
              icon: const Icon(
                Icons.notifications_none_rounded,
                color: Color(0xFF1B2C56),
              ),
            ),
            IconButton(
              onPressed: () => context.push(AppRoutes.teacherProfilePath),
              icon: const Icon(
                Icons.account_circle_outlined,
                color: Color(0xFF1B2C56),
              ),
            ),
          ],
        ),
        body: GlowRefreshIndicator(
          onRefresh: () => _loadData(silent: false),
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (!isTablet) ...[
                  // Mobile view
                  header,
                  const SizedBox(height: 20),
                  sessionCard,
                  const SizedBox(height: 20),
                  statsGrid,
                  const SizedBox(height: 20),
                  classSchedulingList,
                  const SizedBox(height: 20),
                  telemetryInfo,
                  const SizedBox(height: 20),
                  commandActionsGrid,
                ] else ...[
                  // Tablet view responsive layout
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        flex: 6,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            header,
                            const SizedBox(height: 20),
                            sessionCard,
                            const SizedBox(height: 20),
                            statsGrid,
                            const SizedBox(height: 20),
                            classSchedulingList,
                          ],
                        ),
                      ),
                      const SizedBox(width: 20),
                      Expanded(
                        flex: 4,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            commandActionsGrid,
                            const SizedBox(height: 20),
                            telemetryInfo,
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
                const SizedBox(height: 40),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildWelcomeHeader(bool isDark, SessionManager session) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'FACULTY SYSTEM HUB',
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: const Color(0xFF3559E0),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Biometric Command Center',
          style: GoogleFonts.outfit(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF1B2C56),
          ),
        ),
      ],
    );
  }

  Widget _buildSessionCard(BuildContext context, bool isDark) {
    final isActive = int.parse(_stats['active_sessions'] ?? '0') > 0;

    return AnimatedBuilder(
      animation: _pulsingSessionController,
      builder: (context, child) {
        return GlassContainer(
          padding: const EdgeInsets.all(AppSpacing.lg),
          borderColor: isActive
              ? AppColors.gold.withValues(
                  alpha: 0.3 + 0.4 * _pulsingSessionController.value,
                )
              : AppColors.gold.withValues(alpha: 0.25),
          boxShadow: isActive
              ? [
                  BoxShadow(
                    color: AppColors.gold.withValues(
                      alpha: 0.15 * _pulsingSessionController.value,
                    ),
                    blurRadius: 12 + 16 * _pulsingSessionController.value,
                    spreadRadius: 1 + 2 * _pulsingSessionController.value,
                  ),
                ]
              : null,
          gradient: const LinearGradient(
            colors: [Color(0xFF1D2671), Color(0xFFC33764)],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                        width: 8,
                        height: 8,
                        decoration: const BoxDecoration(
                          color: Colors.redAccent,
                          shape: BoxShape.circle,
                        ),
                      )
                      .animate(onPlay: (c) => c.repeat(reverse: true))
                      .scale(end: const Offset(1.5, 1.5), duration: 800.ms)
                      .boxShadow(
                        end: const BoxShadow(
                          color: Colors.redAccent,
                          blurRadius: 6,
                        ),
                      ),
                  const SizedBox(width: 8),
                  Text(
                    'ACTIVE CLASSROOM SYSTEM',
                    style: GoogleFonts.inter(
                      color: Colors.white70,
                      fontWeight: FontWeight.bold,
                      fontSize: 10,
                      letterSpacing: 1.5,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                'Attendance & QR Control',
                style: GoogleFonts.outfit(
                  color: Colors.white,
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              Row(
                children: [
                  PremiumButton(
                    onPressed: () {
                      final args =
                          ModalRoute.of(context)?.settings.arguments as Map?;
                      Navigator.pushNamed(
                        context,
                        '/attendance/qr-generator',
                        arguments: args,
                      );
                    },
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.qr_code_rounded,
                          size: 18,
                          color: Colors.black,
                        ),
                        const SizedBox(width: 8),
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
                  const SizedBox(width: 12),
                  PremiumButton(
                    onPressed: () => context.go('/teacher/feed'),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(
                          Icons.videocam_outlined,
                          size: 18,
                          color: Colors.white,
                        ),
                        const SizedBox(width: 8),
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

  Widget _buildStatsGrid(bool isDark, bool hasIntruderAlert) {
    return LayoutBuilder(
      builder: (context, constraints) {
        return GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 14,
          mainAxisSpacing: 14,
          childAspectRatio: 1.4,
          children: [
            MetricCard(
              label: 'Today presents count',
              value: _stats['present_count']?.toString() ?? '42',
              icon: Icons.check_circle_outline_rounded,
              accentColor: AppColors.success,
              trend: 'VERIFIED',
              isTrendPositive: true,
            ),
            MetricCard(
              label: 'Live Sessions Count',
              value: _stats['active_sessions']?.toString() ?? '0',
              icon: Icons.bolt_rounded,
              accentColor: AppColors.gold,
              trend: 'SYSTEM LIVE',
              isTrendPositive: true,
            ),
            MetricCard(
              label: 'Pending Leaves',
              value: _stats['pending_leaves']?.toString() ?? '0',
              icon: Icons.event_busy_rounded,
              accentColor: Colors.orangeAccent,
              trend: 'REQUIRES ACTION',
              isTrendPositive: false,
            ),
            MetricCard(
              label: 'Security Threats',
              value: _stats['intruder_alerts']?.toString() ?? '0',
              icon: Icons.security_rounded,
              accentColor: hasIntruderAlert ? AppColors.error : AppColors.cyan,
              trend: hasIntruderAlert ? 'ALERT DETECTED' : 'SECURED',
              isTrendPositive: !hasIntruderAlert,
            ),
          ],
        );
      },
    );
  }

  Widget _buildClassSchedulingSection(bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'CURRENT CLASSES & SCHEDULE',
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: const Color(0xFF3559E0),
          ),
        ),
        const SizedBox(height: 12),
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
      ],
    );
  }

  Widget _buildClassItem(String name, String time, String room, int students) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10.0),
      child: GlassContainer(
        padding: const EdgeInsets.all(AppSpacing.md),
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
                      fontSize: 14,
                      color: const Color(0xFF1B2C56),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '$time • $room',
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      color: const Color(0xFF7F8CA4),
                    ),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFF3559E0).withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(AppRadius.sm),
                border: Border.all(
                  color: const Color(0xFF3559E0).withValues(alpha: 0.3),
                ),
              ),
              child: Text(
                '$students Enrolled',
                style: GoogleFonts.inter(
                  color: const Color(0xFF3559E0),
                  fontWeight: FontWeight.bold,
                  fontSize: 10,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTelemetryDiagnostics(bool isDark) {
    final cpuUsage = _telemetry['cpu_usage'] ?? 0;
    final gpuUsage = _telemetry['gpu_usage'] ?? 0;
    final engineStatus = _telemetry['ai_engine_status'] ?? 'Healthy';

    return GlassContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'SYSTEM DIAGNOSTICS & TELEMETRY',
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.5,
              color: const Color(0xFF3559E0),
            ),
          ),
          const SizedBox(height: 16),
          StatusCard(
            title: 'AI Inference Engine',
            status: engineStatus,
            subtitle: 'Model: ResNet-101 • Engine: CUDA',
            statusColor: engineStatus == 'Healthy'
                ? AppColors.success
                : AppColors.error,
            icon: Icons.biotech_outlined,
          ),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _buildProgressMetric(
                'CPU Load',
                cpuUsage / 100.0,
                '$cpuUsage%',
                Colors.cyan,
              ),
              _buildProgressMetric(
                'GPU Load',
                gpuUsage / 100.0,
                '$gpuUsage%',
                const Color(0xFF3559E0),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildProgressMetric(
    String label,
    double val,
    String text,
    Color color,
  ) {
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 6),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  label,
                  style: GoogleFonts.inter(
                    color: const Color(0xFF7F8CA4),
                    fontSize: 11,
                  ),
                ),
                Text(
                  text,
                  style: GoogleFonts.robotoMono(
                    color: color,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 6),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: val,
                color: color,
                backgroundColor: const Color(0xFFF1F5FD),
                minHeight: 4,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'FACULTY CONTROL PANELS',
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: const Color(0xFF3559E0),
          ),
        ),
        const SizedBox(height: 12),
        GridView.count(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisCount: 2,
          crossAxisSpacing: 14,
          mainAxisSpacing: 14,
          childAspectRatio: 1.3,
          children: [
            ActionTile(
              label: 'Live Monitor',
              description: 'Access real-time biometrics stream feed',
              icon: Icons.videocam_outlined,
              color: AppColors.accent,
              onTap: () => context.push('/attendance/live-monitor'),
            ),
            ActionTile(
              label: 'Leave Requests',
              description: 'Approve or deny student leave requests',
              icon: Icons.approval_rounded,
              color: Colors.orangeAccent,
              onTap: () => context.push(AppRoutes.teacherLeaveDashboardPath),
            ),
            ActionTile(
              label: 'Command Center',
              description:
                  'Centralized attendance, risk alerts, live monitor, and audits',
              icon: Icons.admin_panel_settings_outlined,
              color: AppColors.success,
              onTap: () => context.push(AppRoutes.teacherAttendanceCommandPath),
            ),
            ActionTile(
              label: 'Intruder Center',
              description: 'Review security camera warning logs',
              icon: Icons.security_outlined,
              color: AppColors.errorLight,
              onTap: () => context.go('/admin/security-logs'),
            ),
            ActionTile(
              label: 'Telemetry Monitor',
              description: 'Verify server node cpu & ram diagnostics',
              icon: Icons.health_and_safety_outlined,
              color: Colors.tealAccent,
              onTap: () => context.push('/teacher/system-health'),
            ),
            ActionTile(
              label: 'Train AI Models',
              description: 'Trigger full facial embedding retraining',
              icon: Icons.face_retouching_natural_outlined,
              color: AppColors.gold,
              onTap: () => context.push('/teacher/train-faces'),
            ),
          ],
        ),
      ],
    );
  }
}
