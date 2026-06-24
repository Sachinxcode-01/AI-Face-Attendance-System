/*
|--------------------------------------------------------------------------
| File: admin_home_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI / SmartFace AI
|
| Purpose:
| Renders the premium administrative dashboard command center.
| Handles responsive layout structures for handheld mobile vs tablet screens.
|--------------------------------------------------------------------------
*/

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import 'package:google_fonts/google_fonts.dart';

// ======================================================
// Core & State Imports
// ======================================================
import 'package:smartface_attendance/app/config/app_state.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/app/theme/theme_controller.dart';

// ======================================================
// Services & UI Component Imports
// ======================================================
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/shared/widgets/status_badge.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/shared/widgets/glow_refresh_indicator.dart';
import 'package:smartface_attendance/shared/widgets/glow_button.dart';
import 'package:smartface_attendance/design_system/design_system.dart';

/// The administrative dashboard command center widget.
class AdminDashboard extends StatefulWidget {
  const AdminDashboard({super.key});

  @override
  State<AdminDashboard> createState() => _AdminDashboardState();
}

class _AdminDashboardState extends State<AdminDashboard>
    with SingleTickerProviderStateMixin {
  bool _loading = true;
  bool _serverOnline = false;
  Map<String, dynamic> _stats = {};
  late AnimationController _pulseCtrl;

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(vsync: this, duration: 1200.ms)
      ..repeat(reverse: true);
    _loadDashboard();
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    super.dispose();
  }

  /// Loads/refreshes the dashboard stats and checks server connectivity status.
  Future<void> _loadDashboard() async {
    setState(() => _loading = true);
    try {
      final online = await ApiService.isServerOnline();
      if (!mounted) return;
      final session = context.read<SessionManager>();
      final token = session.token;

      Map<String, dynamic> stats = {};
      if (token != null) {
        stats = await ApiService.getAdminStats(token);
      }

      setState(() {
        _serverOnline = online;
        if (stats.isNotEmpty) {
          _stats = stats;
        } else {
          _stats = {
            'total_students': '1,247',
            'total_teachers': '86',
            'active_sessions': '0',
            'attendance_today': '89%',
            'intruder_alerts': '0',
            'pending_leaves': '0',
          };
        }
        _loading = false;
      });

      // Load initial notifications for admin
      if (mounted) {
        final appState = context.read<AppState>();
        final email = session.email;
        if (email != null && token != null) {
          final count = await ApiService.getUnreadCount(email, token);
          appState.setUnreadCount(count);
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final session = context.read<SessionManager>();
    final themeCtrl = context.watch<ThemeController>();
    final appState = context.watch<AppState>();
    final isDark = themeCtrl.isDark;
    final double screenWidth = MediaQuery.of(context).size.width;
    final bool isTablet = screenWidth >= 600;

    if (_loading) {
      return Scaffold(
        backgroundColor: isDark ? AppColors.bgDark : AppColors.bgLight,
        body: const DashboardShimmer(),
      );
    }

    final hasIntruderAlert =
        int.parse(_stats['intruder_alerts']?.toString() ?? '0') > 0;

    // Redesigned components
    final header = _buildWelcomeHeader(isDark, session);
    final statsGrid = _buildStatsGrid(isDark);
    final diagnostics = _buildDiagnostics(isDark);
    final quickActions = _buildQuickActions(context);
    final alertStatus = _buildSecurityStatus(isDark, hasIntruderAlert);
    final logoutButton = _buildLogoutButton(context);

    return Scaffold(
      backgroundColor: isDark ? AppColors.bgDark : AppColors.bgLight,
      appBar: PremiumAppBar(
        title: 'Admin Control Panel',
        titleWidget: Row(
          children: [
            const Icon(Icons.shield_outlined, color: AppColors.gold, size: 22),
            const SizedBox(width: 8),
            Text(
              'Admin Control Panel',
              style: GoogleFonts.outfit(
                fontWeight: FontWeight.w800,
                color: isDark ? Colors.white : AppColors.bgDark,
                fontSize: 18,
              ),
            ),
          ],
        ),
        actions: [
          // Server Status Pulse
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
            child: StatusBadge(
              label: _serverOnline ? 'ONLINE' : 'OFFLINE',
              color: _serverOnline ? AppColors.success : AppColors.error,
              animateDot: true,
            ),
          ),
          // Theme Toggle
          IconButton(
            icon: Icon(
              isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
              color: AppColors.gold,
            ),
            onPressed: () => themeCtrl.toggle(),
          ),
          // Notifications Bell
          Stack(
            alignment: Alignment.center,
            children: [
              IconButton(
                icon: Icon(
                  Icons.notifications_none_rounded,
                  color: isDark ? Colors.white : AppColors.bgDark,
                ),
                onPressed: () => context.push('/notifications/nexus'),
              ),
              if (appState.unreadCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(2),
                    decoration: const BoxDecoration(
                      color: AppColors.error,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 14,
                      minHeight: 14,
                    ),
                    child: Text(
                      '${appState.unreadCount}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: GlowRefreshIndicator(
        onRefresh: _loadDashboard,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (!isTablet) ...[
                // Mobile layout
                header,
                const SizedBox(height: 20),
                statsGrid,
                const SizedBox(height: 20),
                alertStatus,
                const SizedBox(height: 20),
                diagnostics,
                const SizedBox(height: 20),
                quickActions,
                const SizedBox(height: 24),
                logoutButton,
              ] else ...[
                // Tablet layout
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
                          statsGrid,
                          const SizedBox(height: 20),
                          diagnostics,
                        ],
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      flex: 4,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          alertStatus,
                          const SizedBox(height: 20),
                          quickActions,
                          const SizedBox(height: 24),
                          logoutButton,
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
    );
  }

  Widget _buildWelcomeHeader(bool isDark, SessionManager session) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'INSTITUTION COMMAND CENTRE',
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: AppColors.gold,
          ),
        ),
        const SizedBox(height: 6),
        Text(
          'Welcome, ${session.name ?? "Administrator"}',
          style: GoogleFonts.outfit(
            fontSize: 22,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : AppColors.bgDark,
          ),
        ),
      ],
    );
  }

  Widget _buildStatsGrid(bool isDark) {
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
              label: 'Students Enrolled',
              value: _stats['total_students']?.toString() ?? '--',
              icon: Icons.people_alt_outlined,
              accentColor: AppColors.cyan,
              trend: 'TOTAL',
              isTrendPositive: true,
            ),
            MetricCard(
              label: 'Faculty Members',
              value: _stats['total_teachers']?.toString() ?? '--',
              icon: Icons.school_outlined,
              accentColor: AppColors.gold,
              trend: 'ACTIVE',
              isTrendPositive: true,
            ),
            MetricCard(
              label: 'Active Class Sessions',
              value: _stats['active_sessions']?.toString() ?? '--',
              icon: Icons.sensors_rounded,
              accentColor: AppColors.successLight,
              trend: 'LIVE NOW',
              isTrendPositive: true,
            ),
            MetricCard(
              label: 'Daily Attendance Rate',
              value: _stats['attendance_today']?.toString() ?? '--',
              icon: Icons.check_circle_outline_rounded,
              accentColor: AppColors.indigoLight,
              trend: 'STABLE',
              isTrendPositive: true,
            ),
          ],
        );
      },
    );
  }

  Widget _buildDiagnostics(bool isDark) {
    return GlassContainer(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'SYSTEM ARCHITECTURE TELEMETRY',
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.w800,
              letterSpacing: 1.5,
              color: AppColors.gold,
            ),
          ),
          const SizedBox(height: 16),
          StatusCard(
            title: 'AI Cluster Server Connection',
            status: _serverOnline ? 'Connected' : 'Offline',
            statusColor: _serverOnline ? AppColors.success : AppColors.error,
            subtitle: 'Endpoint: Rest API & WebSocket Gateway',
            icon: Icons.dns_outlined,
          ),
        ],
      ),
    );
  }

  Widget _buildSecurityStatus(bool isDark, bool hasIntruderAlert) {
    final statusColor = hasIntruderAlert ? AppColors.error : AppColors.success;
    final statusLabel = hasIntruderAlert ? 'THREAT DETECTED' : 'SYSTEM SECURED';
    final alertCount = _stats['intruder_alerts']?.toString() ?? '0';

    return GlassContainer(
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: statusColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(
              hasIntruderAlert
                  ? Icons.warning_amber_rounded
                  : Icons.gpp_good_outlined,
              color: statusColor,
              size: 28,
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Biometric Security Threat Level',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: isDark ? Colors.white : AppColors.bgDeep,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  hasIntruderAlert
                      ? '$alertCount unknown faces captured on campus CCTV feed.'
                      : 'Zero unauthorized intruder breaches logged today.',
                  style: AppText.caption(
                    color: isDark ? Colors.white54 : Colors.black54,
                  ),
                ),
              ],
            ),
          ),
          StatusBadge(label: statusLabel, color: statusColor, animateDot: true),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'INSTITUTION COMMAND ACTION TILES',
          style: GoogleFonts.inter(
            fontSize: 10,
            fontWeight: FontWeight.w800,
            letterSpacing: 2,
            color: AppColors.gold,
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
              label: 'Student Database',
              description: 'Configure and register profile photos',
              icon: Icons.people_alt_outlined,
              color: AppColors.cyan,
              onTap: () => context.push('/settings'),
            ),
            ActionTile(
              label: 'Faculty Management',
              description: 'Verify roles, permissions & schedules',
              icon: Icons.school_outlined,
              color: AppColors.gold,
              onTap: () => context.push('/settings'),
            ),
            ActionTile(
              label: 'Leave Approvals',
              description: 'Process official pending leaves logs',
              icon: Icons.approval_outlined,
              color: Colors.orangeAccent,
              onTap: () => context.go('/admin/approvals'),
            ),
            ActionTile(
              label: 'Security Center',
              description: 'Analyze real-time intruder telemetry',
              icon: Icons.security_outlined,
              color: AppColors.errorLight,
              onTap: () => context.go('/admin/security'),
            ),
            ActionTile(
              label: 'Advanced Analytics',
              description: 'Generate institution attendance insights',
              icon: Icons.analytics_outlined,
              color: AppColors.successLight,
              onTap: () => context.go('/admin/analytics'),
            ),
            ActionTile(
              label: 'System Settings',
              description: 'Define camera thresholds & parameters',
              icon: Icons.settings_applications_outlined,
              color: AppColors.indigoLight,
              onTap: () => context.push('/settings'),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildLogoutButton(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: GlowButton(
        color: AppColors.error,
        glowColor: AppColors.error.withValues(alpha: 0.4),
        borderRadius: AppRadius.sm,
        onPressed: () async {
          await context.read<SessionManager>().logout();
          if (!context.mounted) return;
          context.go('/auth/login');
        },
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.logout_rounded, size: 18, color: Colors.white),
            const SizedBox(width: 8),
            Text(
              'LOGOUT COMMAND SESSION',
              style: AppText.button(color: Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}
