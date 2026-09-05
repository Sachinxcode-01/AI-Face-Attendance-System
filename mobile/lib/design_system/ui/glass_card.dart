import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_theme.dart';

/// ============================================================================
/// GlassCard — the rounded white "glass" card used across every screen.
///
/// Soft shadow, large radius, subtle border. Theme aware so it stays a clean
/// white card in light mode and a soft dark surface in dark mode.
/// ============================================================================
class GlassCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry padding;
  final double radius;
  final VoidCallback? onTap;
  final Color? color;
  final EdgeInsetsGeometry? margin;

  const GlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(18),
    this.radius = AppTheme.radiusLg,
    this.onTap,
    this.color,
    this.margin,
  });

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final isDark = brightness == Brightness.dark;

    final card = Container(
      padding: padding,
      margin: margin,
      decoration: BoxDecoration(
        color: color ?? AppColors.card(brightness),
        borderRadius: BorderRadius.circular(radius),
        border: Border.all(color: AppColors.border(brightness), width: 1),
        boxShadow: [
          BoxShadow(
            color: isDark
                ? Colors.black.withValues(alpha: 0.35)
                : const Color(0xFF9AA6D8).withValues(alpha: 0.18),
            blurRadius: 24,
            offset: const Offset(0, 12),
          ),
        ],
      ),
      child: child,
    );

    if (onTap == null) return card;
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(radius),
        child: card,
      ),
    );
  }
}

/// Small rounded icon chip used inside cards (light-blue square with blue icon).
class IconChip extends StatelessWidget {
  final IconData icon;
  final double size;
  final Color? color;
  const IconChip({super.key, required this.icon, this.size = 44, this.color});

  @override
  Widget build(BuildContext context) {
    final brightness = Theme.of(context).brightness;
    final accent = color ?? AppColors.primary;
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: brightness == Brightness.dark
            ? AppColors.iconChipDark
            : accent.withValues(alpha: 0.10),
        borderRadius: BorderRadius.circular(size * 0.32),
      ),
      child: Icon(icon, color: accent, size: size * 0.5),
    );
  }
}
