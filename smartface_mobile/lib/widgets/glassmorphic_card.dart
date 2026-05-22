import 'dart:ui';
import 'package:flutter/material.dart';
import '../core/constants.dart';

/// A premium frosted glass card with gradient border overlay.
class GlassmorphicCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double blurRadius;
  final double borderRadius;
  final Color? borderColor;
  final Color? backgroundColor;
  final List<BoxShadow>? boxShadow;
  final Gradient? gradient;
  final double borderWidth;
  final VoidCallback? onTap;

  const GlassmorphicCard({
    super.key,
    required this.child,
    this.padding,
    this.blurRadius = 16,
    this.borderRadius = AppRadius.lg,
    this.borderColor,
    this.backgroundColor,
    this.boxShadow,
    this.gradient,
    this.borderWidth = 1.0,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final effectiveBorder = borderColor ??
        (isDark ? AppColors.white12 : const Color(0xFFE0E0E0));
    final effectiveBg = backgroundColor ??
        (isDark
            ? Colors.white.withValues(alpha: 0.04)
            : Colors.white.withValues(alpha: 0.85));

    return GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(borderRadius),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blurRadius, sigmaY: blurRadius),
          child: Container(
            padding: padding ?? const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: effectiveBg,
              borderRadius: BorderRadius.circular(borderRadius),
              border: Border.all(color: effectiveBorder, width: borderWidth),
              gradient: gradient ?? AppGradients.cardGlass,
              boxShadow: boxShadow ?? AppShadows.card,
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}

/// A stat metric card with icon, value, and label.
class MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color? accentColor;
  final String? subtitle;

  const MetricCard({
    super.key,
    required this.label,
    required this.value,
    required this.icon,
    this.accentColor,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final color = accentColor ?? AppColors.gold;
    return GlassmorphicCard(
      padding: const EdgeInsets.all(AppSpacing.md),
      borderColor: color.withValues(alpha: 0.2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: AppText.heading(color: Colors.white),
          ),
          const SizedBox(height: 4),
          Text(label, style: AppText.caption()),
          if (subtitle != null) ...[
            const SizedBox(height: 4),
            Text(
              subtitle!,
              style: AppText.caption(color: color),
            ),
          ],
        ],
      ),
    );
  }
}
