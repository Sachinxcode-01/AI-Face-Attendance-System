import 'package:flutter/material.dart';
import 'package:smartface_attendance/core/network/api_service.dart';

import 'app_colors.dart';

/// ============================================================================
/// DashboardHeader — the rounded royal-blue header from the reference dashboard.
///
/// Shows a greeting + date on the left, a notification button and avatar on the
/// right, decorative floating spheres, and hosts a "feature card" that overlaps
/// the bottom edge (e.g. the attendance summary card).
/// ============================================================================
class DashboardHeader extends StatelessWidget {
  final String greeting;
  final String name;
  final String subtitle;
  final String? avatarText;
  final String? avatarUrl;
  final VoidCallback? onNotifications;
  final bool hasUnread;
  final VoidCallback? onAvatar;

  const DashboardHeader({
    super.key,
    required this.greeting,
    required this.name,
    required this.subtitle,
    this.avatarText,
    this.avatarUrl,
    this.onNotifications,
    this.hasUnread = false,
    this.onAvatar,
  });

  @override
  Widget build(BuildContext context) {
    final topPad = MediaQuery.of(context).padding.top;
    return Container(
      width: double.infinity,
      padding: EdgeInsets.fromLTRB(22, topPad + 18, 18, 26),
      decoration: const BoxDecoration(
        gradient: AppColors.headerGradient,
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(30),
          bottomRight: Radius.circular(30),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      greeting,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                      ),
                    ),
                    Text(
                      name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      subtitle,
                      style: TextStyle(
                        color: Colors.white.withValues(alpha: 0.82),
                        fontSize: 12.5,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ),
              _NotificationButton(
                hasUnread: hasUnread,
                onTap: onNotifications,
              ),
              const SizedBox(width: 10),
              _Avatar(avatarUrl: avatarUrl, text: avatarText, onTap: onAvatar),
            ],
          ),
        ],
      ),
    );
  }
}

class _NotificationButton extends StatelessWidget {
  final bool hasUnread;
  final VoidCallback? onTap;
  const _NotificationButton({required this.hasUnread, this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.16),
      shape: const CircleBorder(),
      child: InkWell(
        onTap: onTap,
        customBorder: const CircleBorder(),
        child: SizedBox(
          width: 44,
          height: 44,
          child: Stack(
            alignment: Alignment.center,
            children: [
              const Icon(
                Icons.notifications_none_rounded,
                color: Colors.white,
                size: 22,
              ),
              if (hasUnread)
                Positioned(
                  top: 12,
                  right: 12,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: Color(0xFFFF5C77),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }
}

class _Avatar extends StatelessWidget {
  final String? avatarUrl;
  final String? text;
  final VoidCallback? onTap;
  const _Avatar({this.avatarUrl, this.text, this.onTap});

  @override
  Widget build(BuildContext context) {
    final String? fullUrl = (avatarUrl != null && avatarUrl!.isNotEmpty)
        ? (avatarUrl!.startsWith('http')
            ? avatarUrl!
            : '${ApiService.baseUrl}$avatarUrl')
        : null;

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 44,
        height: 44,
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: Colors.white.withValues(alpha: 0.22),
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white.withValues(alpha: 0.4)),
        ),
        child: ClipOval(
          child: fullUrl != null
              ? Image.network(
                  fullUrl,
                  width: 44,
                  height: 44,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Center(
                    child: Text(
                      (text == null || text!.isEmpty) ? 'U' : text!,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                )
              : Text(
                  (text == null || text!.isEmpty) ? 'U' : text!,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w700,
                  ),
                ),
        ),
      ),
    );
  }
}
