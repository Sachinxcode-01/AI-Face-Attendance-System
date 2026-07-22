import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_theme.dart';
import 'glass_card.dart';

/// ============================================================================
/// GradientCard — a premium gradient container with a soft colored glow.
///
/// Use for hero / summary tiles that need to pop against the page background.
/// Defaults to the brand primary gradient but any [gradient] can be supplied.
/// ============================================================================
class GradientCard extends StatelessWidget {
  final Widget child;
  final Gradient? gradient;
  final EdgeInsetsGeometry padding;
  final EdgeInsetsGeometry? margin;
  final double radius;
  final VoidCallback? onTap;
  final List<BoxShadow>? boxShadow;

  const GradientCard({
    super.key,
    required this.child,
    this.gradient,
    this.padding = const EdgeInsets.all(18),
    this.margin,
    this.radius = AppTheme.radiusLg,
    this.onTap,
    this.boxShadow,
  });

  @override
  Widget build(BuildContext context) {
    final resolvedGradient = gradient ?? AppColors.primaryGradient;
    final content = Container(
      padding: padding,
      margin: margin,
      decoration: BoxDecoration(
        gradient: resolvedGradient,
        borderRadius: BorderRadius.circular(radius),
        boxShadow:
            boxShadow ??
            [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.28),
                blurRadius: 24,
                offset: const Offset(0, 12),
              ),
            ],
      ),
      child: child,
    );

    if (onTap == null) return content;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(radius),
        child: content,
      ),
    );
  }
}

/// ============================================================================
/// StatCard — a compact KPI tile (icon + value + label + optional trend).
///
/// Theme aware so it stays a clean white card in light mode and a soft dark
/// surface in dark mode. Optional trend pill shows an up/down delta.
/// ============================================================================
class StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color? accent;
  final String? trend;
  final bool trendPositive;
  final VoidCallback? onTap;

  const StatCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.accent,
    this.trend,
    this.trendPositive = true,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final color = accent ?? AppColors.primary;

    return GlassCard(
      onTap: onTap,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(9),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const Spacer(),
              if (trend != null)
                _TrendChip(label: trend!, positive: trendPositive),
            ],
          ),
          const SizedBox(height: 14),
          Text(
            value,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.w800,
              color: AppColors.heading(brightness),
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: TextStyle(fontSize: 12, color: AppColors.muted(brightness)),
          ),
        ],
      ),
    );
  }
}

/// Small up/down trend pill used inside [StatCard].
class _TrendChip extends StatelessWidget {
  final String label;
  final bool positive;
  const _TrendChip({required this.label, required this.positive});

  @override
  Widget build(BuildContext context) {
    final color = positive ? AppColors.success : AppColors.error;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            positive
                ? Icons.arrow_upward_rounded
                : Icons.arrow_downward_rounded,
            color: color,
            size: 11,
          ),
          const SizedBox(width: 3),
          Text(
            label,
            style: TextStyle(
              fontSize: 10.5,
              fontWeight: FontWeight.w700,
              color: color,
            ),
          ),
        ],
      ),
    );
  }
}
