import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:provider/provider.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/design_system/design_system.dart';
import 'package:smartface_attendance/core/network/api_service.dart';
import 'package:smartface_attendance/features/auth/controllers/session_manager.dart';
import 'package:smartface_attendance/shared/widgets/toast_system.dart';

class NotificationPreferencesScreen extends StatefulWidget {
  const NotificationPreferencesScreen({super.key});

  @override
  State<NotificationPreferencesScreen> createState() =>
      _NotificationPreferencesScreenState();
}

class _NotificationPreferencesScreenState
    extends State<NotificationPreferencesScreen> {
  bool _emailEnabled = true;
  bool _pushEnabled = true;
  bool _inAppEnabled = true;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  Future<void> _loadPreferences() async {
    final session = context.read<SessionManager>();
    final token = session.token;
    if (token == null || token.isEmpty) {
      setState(() => _isLoading = false);
      return;
    }

    try {
      final profile = await ApiService.getUserProfile(token);
      if (profile.containsKey('notification_preferences')) {
        final prefs = profile['notification_preferences'] as Map<String, dynamic>;
        setState(() {
          _emailEnabled = prefs['email'] ?? true;
          _pushEnabled = prefs['push'] ?? true;
          _inAppEnabled = prefs['in_app'] ?? true;
          _isLoading = false;
        });
      } else {
        setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error loading preferences: $e');
      setState(() => _isLoading = false);
    }
  }

  Future<void> _updatePreference(String key, bool value) async {
    final session = context.read<SessionManager>();
    final token = session.token;
    if (token == null) return;

    setState(() {
      if (key == 'email') _emailEnabled = value;
      if (key == 'push') _pushEnabled = value;
      if (key == 'in_app') _inAppEnabled = value;
    });

    final success = await ApiService.updateNotificationPreferences(
      email: _emailEnabled,
      push: _pushEnabled,
      inApp: _inAppEnabled,
      token: token,
    );

    if (mounted) {
      if (success) {
        AppToast.show(
          context,
          message: 'Preferences updated successfully!',
          type: ToastType.success,
        );
      } else {
        AppToast.show(
          context,
          message: 'Failed to update preferences.',
          type: ToastType.error,
        );
        // Revert UI state on failure
        setState(() {
          if (key == 'email') _emailEnabled = !value;
          if (key == 'push') _pushEnabled = !value;
          if (key == 'in_app') _inAppEnabled = !value;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return PremiumScaffold(
      child: Scaffold(
        backgroundColor: Colors.transparent,
        appBar: const PremiumAppBar(
          title: 'Notification Preferences',
        ),
        body: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  valueColor: AlwaysStoppedAnimation<Color>(AppColors.gold),
                ),
              )
            : Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Text(
                      'Customize your alerting preferences. Turn off channels you do not wish to be contacted on.',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        color: Colors.white70,
                      ),
                    ),
                    const SizedBox(height: 24),
                    GlassCard(
                      child: Column(
                        children: [
                          _buildPreferenceSwitch(
                            title: 'Email Alerts',
                            subtitle: 'Receive login OTPs, leave reviews & security warnings.',
                            icon: Icons.email_outlined,
                            value: _emailEnabled,
                            onChanged: (val) => _updatePreference('email', val),
                          ),
                          const Divider(color: Colors.white10),
                          _buildPreferenceSwitch(
                            title: 'Push Notifications',
                            subtitle: 'Instant alerts on device lock screen.',
                            icon: Icons.notifications_active_outlined,
                            value: _pushEnabled,
                            onChanged: (val) => _updatePreference('push', val),
                          ),
                          const Divider(color: Colors.white10),
                          _buildPreferenceSwitch(
                            title: 'In-App Alerts',
                            subtitle: 'Updates inside the notification hub nexus.',
                            icon: Icons.phonelink_ring_outlined,
                            value: _inAppEnabled,
                            onChanged: (val) => _updatePreference('in_app', val),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildPreferenceSwitch({
    required String title,
    required String subtitle,
    required IconData icon,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          CircleAvatar(
            backgroundColor: AppColors.gold.withValues(alpha: 0.1),
            child: Icon(icon, color: AppColors.gold),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: GoogleFonts.inter(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
                Text(
                  subtitle,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: Colors.white38,
                  ),
                ),
              ],
            ),
          ),
          Switch(
            value: value,
            activeThumbColor: AppColors.gold,
            activeTrackColor: AppColors.gold.withValues(alpha: 0.3),
            inactiveThumbColor: Colors.white30,
            inactiveTrackColor: Colors.white12,
            onChanged: onChanged,
          ),
        ],
      ),
    );
  }
}
