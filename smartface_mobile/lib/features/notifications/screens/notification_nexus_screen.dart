/*
|--------------------------------------------------------------------------
| File: notification_nexus_screen.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| Renders the central Notification Hub (Nexus). Connects to WebSocket channels
| to capture real-time broadcast and targeted events (session alerts, intruders, leaves).
|
| Responsibilities:
| - Loads historical notifications on boot.
| - Listens to WebSocket events via NotificationService.
| - Performs list items swipe-dismissal linked with database state.
| - Triggers in-notification actions (e.g. approve/deny leaves directly from feed).
|
| Dependencies:
| - package:flutter/material.dart
| - package:flutter_animate/flutter_animate.dart
| - package:google_fonts/google_fonts.dart
| - package:provider/provider.dart
| - package:smartface_attendance/core/constants.dart
| - package:smartface_attendance/core/state/app_state.dart
| - package:smartface_attendance/core/state/session_manager.dart
| - package:smartface_attendance/data/services/api_service.dart
| - package:smartface_attendance/data/services/notification_service.dart
| - package:smartface_attendance/shared/widgets/shimmer_loader.dart
| - package:smartface_attendance/shared/widgets/toast_system.dart
|--------------------------------------------------------------------------
*/

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'dart:async';

// ======================================================
// Core & State Imports
// ======================================================
import 'package:smartface_attendance/design_system/components/motion_widgets.dart';
import 'package:smartface_attendance/core/animation/app_lottie_state.dart';
import 'package:smartface_attendance/app/config/app_state.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';

// ======================================================
// Services & Component Imports
// ======================================================
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/core/di/service_locator.dart';
import 'package:smartface_attendance/core/services/notification_service.dart';
import 'package:smartface_attendance/shared/widgets/shimmer_loader.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';
import 'package:smartface_attendance/shared/widgets/premium_widgets.dart';
import 'package:smartface_attendance/shared/widgets/glow_button.dart';
import 'package:smartface_attendance/design_system/design_system.dart';
import 'package:smartface_attendance/features/notifications/screens/notification_preferences_screen.dart';

/// Screen widget displaying historical notifications and listening to WebSocket logs.
class NotificationNexusScreen extends StatefulWidget {
  const NotificationNexusScreen({super.key});

  @override
  State<NotificationNexusScreen> createState() =>
      _NotificationNexusScreenState();
}

class _NotificationNexusScreenState extends State<NotificationNexusScreen> {
  final NotificationService _notificationService = sl<NotificationService>();
  StreamSubscription? _subscription;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadNotifications();
      _setupWebSocket();
    });
  }

  Future<void> _loadNotifications() async {
    final session = context.read<SessionManager>();
    final appState = context.read<AppState>();
    final email = session.email;
    if (email == null) {
      setState(() => _isLoading = false);
      return;
    }

    // Fetch notifications targeting this user/role
    final notifs = await ApiService.getNotifications(email, session.token);
    final List<Map<String, dynamic>> parsedNotifs = notifs.map((n) {
      final map = n as Map<String, dynamic>;
      return {
        'id': map['id'] ?? map['_id'] ?? '',
        'title': map['title'] ?? 'Alert',
        'message': map['message'] ?? '',
        'type': map['type'] ?? 'info',
        'time': map['created_at'] != null
            ? _formatTime(map['created_at'])
            : 'Just now',
        'priority': map['priority'] ?? 'Info',
        'is_read': map['is_read'] == true,
      };
    }).toList();

    appState.setNotifications(parsedNotifs);
    if (mounted) {
      setState(() => _isLoading = false);
    }
  }

  void _setupWebSocket() {
    final session = context.read<SessionManager>();
    _notificationService.connect(token: session.token);
    _subscription = _notificationService.stream.listen((data) {
      if (!mounted) return;
      final appState = context.read<AppState>();

      final targetUser = data['user_id'];
      final targetRole = data['role']; // Optional role routing

      bool isMatch =
          targetUser == session.email ||
          (targetUser == 'admin' && session.isAdmin) ||
          (targetRole == 'student' && session.isStudent) ||
          (targetRole == 'teacher' && session.isTeacher);

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

        AppToast.show(
          context,
          message: newNotif['title']!,
          type: ToastType.info,
        );
      }
    });
  }

  String _formatTime(String isoString) {
    try {
      final dt = DateTime.parse(isoString);
      final diff = DateTime.now().difference(dt);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      return '${diff.inDays}d ago';
    } catch (_) {
      return 'Just now';
    }
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  Future<void> _dismissNotification(String id) async {
    final session = context.read<SessionManager>();
    final appState = context.read<AppState>();
    final token = session.token;
    if (token != null) {
      await ApiService.markNotificationsRead([id], token);
    }
    appState.markNotificationRead(id);
  }

  Future<void> _clearAll() async {
    final session = context.read<SessionManager>();
    final appState = context.read<AppState>();
    final token = session.token;
    if (token != null) {
      await ApiService.markNotificationsRead([], token);
    }
    appState.setNotifications([]);
  }

  @override
  Widget build(BuildContext context) {
    final appState = context.watch<AppState>();
    final notificationsList = appState.notifications;

    return AuroraBackground(
      baseColor: AppColors.bgDeep,
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: PremiumAppBar(
          title: 'Notification Nexus',
          actions: [
            IconButton(
              icon: const Icon(Icons.settings_outlined),
              tooltip: 'Preferences',
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => const NotificationPreferencesScreen(),
                  ),
                );
              },
            ),
            if (notificationsList.isNotEmpty)
              IconButton(
                onPressed: _clearAll,
                icon: const Icon(Icons.done_all_rounded, color: AppColors.gold),
                tooltip: 'Clear all',
              ),
          ],
        ),
        body: _isLoading
            ? const NotificationShimmer()
            : notificationsList.isEmpty
            ? _buildEmptyState()
            : ListView.builder(
                padding: const EdgeInsets.symmetric(
                  horizontal: 20,
                  vertical: 10,
                ),
                itemCount: notificationsList.length,
                itemBuilder: (context, index) {
                  final notification = notificationsList[index];
                  final notifId = notification['id'] ?? '';
                  return Dismissible(
                        key: Key(notifId),
                        onDismissed: (direction) =>
                            _dismissNotification(notifId),
                        direction: DismissDirection.endToStart,
                        background: Container(
                          alignment: Alignment.centerRight,
                          padding: const EdgeInsets.symmetric(horizontal: 30),
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.transparent,
                                Colors.redAccent.withValues(alpha: 0.25),
                              ],
                              begin: Alignment.centerLeft,
                              end: Alignment.centerRight,
                            ),
                            borderRadius: BorderRadius.circular(25),
                          ),
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Text(
                                'Dismissing...  ',
                                style: GoogleFonts.inter(
                                  color: Colors.redAccent,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 12,
                                  letterSpacing: 1,
                                ),
                              ),
                              const Icon(
                                    Icons.delete_sweep_rounded,
                                    color: Colors.redAccent,
                                    size: 26,
                                  )
                                  .animate(onPlay: (c) => c.repeat())
                                  .shake(duration: 1.seconds),
                            ],
                          ),
                        ),
                        child: _buildNotificationCard(notification),
                      )
                      .animate()
                      .fadeIn(delay: (index * 100).ms)
                      .slideX(begin: 0.1);
                },
              ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return const Center(
      child: AppLottieState(
        assetPath: 'assets/animations/lottie/empty.json',
        width: 140,
        height: 140,
        fallbackIcon: Icons.notifications_off_outlined,
        fallbackColor: Colors.white24,
        message: 'Silence is Golden\nNo new alerts at the moment.',
      ),
    );
  }

  IconData _getIconForType(String? type) {
    switch (type) {
      case 'session_alert':
        return Icons.sensors_rounded;
      case 'announcement':
        return Icons.campaign_rounded;
      case 'intruder_alert':
        return Icons.warning_amber_rounded;
      case 'leave_request':
        return Icons.assignment_turned_in_rounded;
      case 'leave_status':
        return Icons.info_outline;
      case 'attendance':
        return Icons.check_circle_outline;
      default:
        return Icons.notifications_none_rounded;
    }
  }

  Widget _buildNotificationCard(Map<String, dynamic> notification) {
    Color priorityColor;
    switch (notification['priority']) {
      case 'Critical':
        priorityColor = Colors.redAccent;
        break;
      case 'Urgent':
        priorityColor = Colors.orangeAccent;
        break;
      case 'Success':
        priorityColor = Colors.greenAccent;
        break;
      case 'High':
        priorityColor = AppColors.gold;
        break;
      default:
        priorityColor = Colors.blueAccent;
    }

    final type = notification['type'] as String?;
    final iconData = _getIconForType(type);

    return GlassContainer(
      padding: const EdgeInsets.all(20),
      borderColor: priorityColor.withValues(alpha: 0.15),
      borderRadius: 25,
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: priorityColor.withValues(alpha: 0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(iconData, color: priorityColor, size: 20),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        notification['title'] ?? 'Alert',
                        style: const TextStyle(
                          fontWeight: FontWeight.bold,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    Text(
                      notification['time'] ?? 'Just now',
                      style: const TextStyle(
                        color: Colors.white24,
                        fontSize: 10,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  notification['message'] ?? '',
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
                if (type == 'session_alert') ...[
                  const SizedBox(height: 15),
                  GlowButton(
                    onPressed: () {
                      context.go('/student/scan');
                    },
                    color: AppColors.gold,
                    glowColor: AppColors.gold.withValues(alpha: 0.3),
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    borderRadius: 10,
                    child: SizedBox(
                      width: double.infinity,
                      child: Text(
                        'VERIFY ATTENDANCE',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: Colors.black,
                        ),
                      ),
                    ),
                  ),
                ],
                if (type == 'leave_request') ...[
                  const SizedBox(height: 15),
                  Row(
                    children: [
                      Expanded(
                        child: GlowButton(
                          onPressed: () =>
                              _handleLeaveAction(notification, 'Rejected'),
                          color: AppColors.surfaceElevated,
                          glowColor: Colors.redAccent.withValues(alpha: 0.2),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          borderRadius: 10,
                          child: Text(
                            'DENY',
                            style: GoogleFonts.inter(
                              color: Colors.redAccent,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: GlowButton(
                          onPressed: () =>
                              _handleLeaveAction(notification, 'Approved'),
                          color: Colors.greenAccent,
                          glowColor: Colors.greenAccent.withValues(alpha: 0.3),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          borderRadius: 10,
                          child: Text(
                            'APPROVE',
                            style: GoogleFonts.inter(
                              color: Colors.black,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _handleLeaveAction(
    Map<String, dynamic> notification,
    String status,
  ) async {
    final leaveId = notification['leave_id'] ?? notification['id'] ?? '';

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) =>
          const Center(child: CircularProgressIndicator(color: AppColors.gold)),
    );

    try {
      final res = await ApiService.actionLeave(
        leaveId,
        status,
        'Actioned from Notification Nexus',
      );
      if (mounted) Navigator.pop(context);

      if (res['detail'] == 'Connection failed') {
        if (mounted) {
          AppToast.show(
            context,
            message: 'Failed to connect to server',
            type: ToastType.error,
          );
        }
      } else {
        if (mounted) {
          AppToast.show(
            context,
            message: 'Leave request $status successfully!',
            type: ToastType.success,
          );
          _dismissNotification(notification['id'] ?? '');
        }
      }
    } catch (e) {
      if (mounted) {
        Navigator.pop(context);
        AppToast.show(
          context,
          message: 'Error processing action: $e',
          type: ToastType.error,
        );
      }
    }
  }
}
