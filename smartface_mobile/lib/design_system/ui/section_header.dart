import 'package:flutter/material.dart';

import 'app_colors.dart';

/// Section title row with an optional trailing action (e.g. "See all").
class SectionHeader extends StatelessWidget {
  final String title;
  final String? actionLabel;
  final VoidCallback? onAction;

  const SectionHeader({
    super.key,
    required this.title,
    this.actionLabel,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          title,
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w700,
            color: AppColors.heading(brightness),
          ),
        ),
        if (actionLabel != null)
          GestureDetector(
            onTap: onAction,
            child: Text(
              actionLabel!,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.primary,
              ),
            ),
          ),
      ],
    );
  }
}

/// A colored status pill (Present / Upcoming / Absent, etc.).
class StatusPill extends StatelessWidget {
  final String label;
  final Color color;
  final Color background;
  const StatusPill({
    super.key,
    required this.label,
    required this.color,
    required this.background,
  });

  factory StatusPill.present() => const StatusPill(
    label: 'Present',
    color: AppColors.success,
    background: AppColors.successSoft,
  );
  factory StatusPill.upcoming() => const StatusPill(
    label: 'Upcoming',
    color: AppColors.upcoming,
    background: AppColors.upcomingSoft,
  );
  factory StatusPill.absent() => const StatusPill(
    label: 'Absent',
    color: AppColors.error,
    background: AppColors.errorSoft,
  );

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: background,
        borderRadius: BorderRadius.circular(999),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11.5,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }
}
