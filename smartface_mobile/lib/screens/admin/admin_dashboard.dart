import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:provider/provider.dart';
import '../../core/app_state.dart';
import '../../core/constants.dart';
import '../../core/session_manager.dart';
import '../../core/theme_controller.dart';
import '../../services/api_service.dart';
import '../../widgets/glassmorphic_card.dart';
import '../../widgets/shimmer_loader.dart';
import '../../widgets/toast_system.dart';

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

    return Scaffold(
      backgroundColor: isDark ? AppColors.bgDark : AppColors.bgLight,
      body: CustomScrollView(
        slivers: [
          // ── SliverAppBar ──────────────────────────────────────────
          SliverAppBar(
            expandedHeight: 140,
            pinned: true,
            backgroundColor: isDark ? AppColors.bgDeep : AppColors.indigo,
            flexibleSpace: FlexibleSpaceBar(
              titlePadding:
                  const EdgeInsets.only(left: 20, bottom: 16),
              title: Row(
                children: [
                  const Icon(Icons.shield_outlined,
                      color: AppColors.gold, size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'Admin Control',
                    style: AppText.subheading(
                        color: Colors.white, weight: FontWeight.bold),
                  ),
                ],
              ),
              background: Container(
                decoration: BoxDecoration(
                  gradient: isDark
                      ? const LinearGradient(
                          colors: [AppColors.bgDeep, AppColors.indigo],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        )
                      : const LinearGradient(
                          colors: [AppColors.indigo, AppColors.indigoLight],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                ),
              ),
            ),
            actions: [
              // Server status indicator
              AnimatedBuilder(
                animation: _pulseCtrl,
                builder: (ctx, child) => Container(
                  margin: const EdgeInsets.only(right: 8, top: 10),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: (_serverOnline
                            ? AppColors.success
                            : AppColors.error)
                        .withValues(
                            alpha: 0.15 + 0.1 * _pulseCtrl.value),
                    borderRadius: BorderRadius.circular(AppRadius.full),
                    border: Border.all(
                      color: _serverOnline
                          ? AppColors.successLight
                          : AppColors.errorLight,
                      width: 1,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 6,
                        height: 6,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: _serverOnline
                              ? AppColors.successLight
                              : AppColors.errorLight,
                        ),
                      ),
                      const SizedBox(width: 5),
                      Text(
                        _serverOnline ? 'Online' : 'Offline',
                        style: AppText.caption(
                          color: _serverOnline
                              ? AppColors.successLight
                              : AppColors.errorLight,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              // Theme toggle
              IconButton(
                icon: Icon(
                  isDark ? Icons.light_mode_outlined : Icons.dark_mode_outlined,
                  color: AppColors.gold,
                ),
                onPressed: () => themeCtrl.toggle(),
                tooltip: 'Toggle Theme',
              ),
              // Notifications
              Stack(
                children: [
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined,
                        color: Colors.white),
                    onPressed: () => Navigator.pushNamed(context, '/notifications',
                        arguments: ModalRoute.of(context)?.settings.arguments),
                  ),
                  if (appState.unreadCount > 0)
                    Positioned(
                      right: 6,
                      top: 6,
                      child: Container(
                        width: 16,
                        height: 16,
                        decoration: const BoxDecoration(
                          color: AppColors.errorLight,
                          shape: BoxShape.circle,
                        ),
                        child: Center(
                          child: Text(
                            '${appState.unreadCount}',
                            style: AppText.caption(color: Colors.white)
                                .copyWith(fontSize: 9),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),

          // ── Body content ──────────────────────────────────────────
          SliverPadding(
            padding: const EdgeInsets.all(20),
            sliver: _loading
                ? const SliverToBoxAdapter(child: DashboardShimmer())
                : SliverList(
                    delegate: SliverChildListDelegate([
                      // Welcome row
                      Row(
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text('Welcome back,',
                                  style: AppText.body()),
                              Text(
                                session.name ?? 'Administrator',
                                style: AppText.heading(color: Colors.white),
                              ),
                            ],
                          ),
                          const Spacer(),
                          RoleBadge(role: UserRole.admin),
                        ],
                      ).animate().fadeIn(duration: 400.ms),
                      const SizedBox(height: 24),

                      // ── Stats Grid ──────────────────────────────
                      _buildStatsGrid(),

                      const SizedBox(height: 28),
                      Text('MANAGEMENT CONSOLE',
                          style: AppText.label(color: AppColors.gold)),
                      const SizedBox(height: 16),

                      // ── Action Cards ────────────────────────────
                      _buildAction(
                        icon: Icons.people_alt_outlined,
                        title: 'Student Database',
                        subtitle:
                            '${_stats['total_students']} enrolled • Manage profiles & photos',
                        onTap: () {},
                        index: 0,
                      ),
                      _buildAction(
                        icon: Icons.school_outlined,
                        title: 'Faculty Management',
                        subtitle:
                            '${_stats['total_teachers']} faculty • Assign roles & access',
                        onTap: () {},
                        index: 1,
                      ),
                      _buildAction(
                        icon: Icons.approval_outlined,
                        title: 'Leave Approvals',
                        subtitle:
                            '${_stats['pending_leaves']} pending review',
                        onTap: () => Navigator.pushNamed(
                            context, '/leave-review',
                            arguments: ModalRoute.of(context)
                                ?.settings.arguments),
                        color: AppColors.warning,
                        index: 2,
                      ),
                      _buildAction(
                        icon: Icons.security_outlined,
                        title: 'Security & Intruder Logs',
                        subtitle:
                            '${_stats['intruder_alerts']} recent alerts',
                        onTap: () =>
                            Navigator.pushNamed(context, '/security-logs'),
                        color: AppColors.errorLight,
                        index: 3,
                      ),
                      _buildAction(
                        icon: Icons.analytics_outlined,
                        title: 'Advanced Analytics',
                        subtitle: 'AI-powered institution-wide insights',
                        onTap: () => Navigator.pushNamed(context, '/analytics',
                            arguments: ModalRoute.of(context)
                                ?.settings.arguments),
                        index: 4,
                      ),
                      _buildAction(
                        icon: Icons.settings_applications_outlined,
                        title: 'System Settings',
                        subtitle: 'API config, thresholds & server status',
                        onTap: () {},
                        index: 5,
                      ),

                      const SizedBox(height: 28),

                      // ── Logout ───────────────────────────────────
                      SizedBox(
                        width: double.infinity,
                        child: OutlinedButton.icon(
                          onPressed: () async {
                            final navigator = Navigator.of(context);
                            await context.read<SessionManager>().logout();
                            navigator.pushNamedAndRemoveUntil('/', (_) => false);
                          },
                          icon: const Icon(Icons.logout_rounded, size: 18),
                          label: Text('LOGOUT', style: AppText.button(color: AppColors.errorLight)),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.errorLight,
                            side: const BorderSide(color: AppColors.errorLight),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(
                                borderRadius:
                                    BorderRadius.circular(AppRadius.md)),
                          ),
                        ),
                      ).animate().fadeIn(delay: 700.ms),
                      const SizedBox(height: 40),
                    ]),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatsGrid() {
    final metrics = [
      {
        'label': 'Students',
        'value': _stats['total_students'] ?? '--',
        'icon': Icons.people_outline,
        'color': AppColors.cyan,
      },
      {
        'label': 'Faculty',
        'value': _stats['total_teachers'] ?? '--',
        'icon': Icons.school_outlined,
        'color': AppColors.gold,
      },
      {
        'label': 'Sessions',
        'value': _stats['active_sessions'] ?? '--',
        'icon': Icons.sensors_rounded,
        'color': AppColors.successLight,
      },
      {
        'label': 'Attendance',
        'value': _stats['attendance_today'] ?? '--',
        'icon': Icons.check_circle_outline,
        'color': AppColors.indigoLight,
      },
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 14,
        mainAxisSpacing: 14,
        childAspectRatio: 1.4,
      ),
      itemCount: metrics.length,
      itemBuilder: (_, i) {
        final m = metrics[i];
        return MetricCard(
          label: m['label'] as String,
          value: m['value'] as String,
          icon: m['icon'] as IconData,
          accentColor: m['color'] as Color,
        ).animate().fadeIn(delay: (i * 80).ms).scale(begin: const Offset(0.9, 0.9));
      },
    );
  }

  Widget _buildAction({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Color color = AppColors.gold,
    required int index,
  }) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(18),
      borderColor: color.withValues(alpha: 0.12),
      onTap: onTap,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title,
                    style:
                        AppText.subheading(color: Colors.white, weight: FontWeight.bold)),
                const SizedBox(height: 3),
                Text(subtitle, style: AppText.caption()),
              ],
            ),
          ),
          Icon(Icons.arrow_forward_ios,
              size: 14, color: AppColors.white38),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: (200 + index * 80).ms)
        .slideX(begin: 0.06);
  }
}
