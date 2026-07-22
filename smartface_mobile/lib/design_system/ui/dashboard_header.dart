import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'premium_background.dart';

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
  final VoidCallback? onNotifications;
  final bool hasUnread;
  final VoidCallback? onAvatar;

  const DashboardHeader({
    super.key,
    required this.greeting,
    required this.name,
    required this.subtitle,
    this.avatarText,
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
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Decorative spheres.
          const Positioned(
            right: -20,
            top: -30,
            child: Opacity(
              opacity: 0.35,
              child: GlossySphere(size: 120, dark: true),
            ),
          ),
          const Positioned(
            right: 40,
            bottom: -14,
            child: Opacity(opacity: 0.5, child: GlossySphere(size: 46)),
          ),
          Column(
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
                  _Avatar(text: avatarText, onTap: onAvatar),
                ],
              ),
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
  final String? text;
  final VoidCallback? onTap;
  const _Avatar({this.text, this.onTap});

  @override
  Widget build(BuildContext context) {
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
        child: Text(
          (text == null || text!.isEmpty) ? 'U' : text!,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 14,
            fontWeight: FontWeight.w700,
          ),
        ),
      ),
    );
  }
}
