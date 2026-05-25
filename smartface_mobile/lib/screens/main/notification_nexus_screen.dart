import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import '../../core/constants.dart';
import '../../core/app_state.dart';
import '../../core/session_manager.dart';
import '../../services/api_service.dart';
import '../../services/notification_service.dart';
import '../../widgets/shimmer_loader.dart';
import '../../widgets/toast_system.dart';
import 'dart:async';

class NotificationNexusScreen extends StatefulWidget {
  const NotificationNexusScreen({super.key});

  @override
  State<NotificationNexusScreen> createState() =>
      _NotificationNexusScreenState();
}

class _NotificationNexusScreenState extends State<NotificationNexusScreen> {
  final NotificationService _notificationService = NotificationService();
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
    final notifs = await ApiService.getNotifications(email);
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
            'Notification Nexus',
            style: GoogleFonts.inter(fontWeight: FontWeight.bold),
          ),
          backgroundColor: Colors.transparent,
          elevation: 0,
          actions: [
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
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.notifications_off_outlined,
            color: Colors.white24,
            size: 64,
          ),
          const SizedBox(height: 16),
          Text(
            'Silence is Golden',
            style: GoogleFonts.inter(fontSize: 18, color: Colors.white54),
          ),
          const Text(
            'No new alerts at the moment.',
            style: TextStyle(color: Colors.white24, fontSize: 12),
          ),
        ],
      ),
    );
  }

  IconData _getIconForType(String? type) {
    switch (type) {
      case 'session_alert':
        return Icons.sensors_rounded;
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

    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: priorityColor.withValues(alpha: 0.1)),
      ),
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
                  ElevatedButton(
                    onPressed: () {
                      final args =
                          ModalRoute.of(context)?.settings.arguments as Map?;
                      Navigator.pushNamed(
                        context,
                        '/qr_scanner',
                        arguments: args,
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.gold,
                      foregroundColor: Colors.black,
                      minimumSize: const Size(double.infinity, 36),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10),
                      ),
                    ),
                    child: const Text(
                      'VERIFY ATTENDANCE',
                      style: TextStyle(
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
                if (type == 'leave_request') ...[
                  const SizedBox(height: 15),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () =>
                              _handleLeaveAction(notification, 'Rejected'),
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(
                              color: Colors.redAccent,
                              width: 1.2,
                            ),
                            foregroundColor: Colors.redAccent,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: const Text(
                            'DENY',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () =>
                              _handleLeaveAction(notification, 'Approved'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: Colors.greenAccent,
                            foregroundColor: Colors.black,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10),
                            ),
                          ),
                          child: const Text(
                            'APPROVE',
                            style: TextStyle(
                              fontSize: 10,
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
