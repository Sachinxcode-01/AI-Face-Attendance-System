/*
|--------------------------------------------------------------------------
| File: glassmorphic_card.dart
|--------------------------------------------------------------------------
| Project: Nexa AI
|
| Purpose:
| UI widgets implementing premium glassmorphism layouts and metric visual cards.
|
| Responsibilities:
| - Renders frosted glass container layouts utilizing BackdropFilter blurs.
| - Exposes custom border color, background color, gradient, and onTap actions.
| - Implements reusable MetricCard displaying icons, statistics, and descriptors.
|
| Dependencies:
| - package:smartface_attendance/core/constants.dart
|--------------------------------------------------------------------------
*/

import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';

export 'package:smartface_attendance/shared/widgets/premium_widgets.dart'
    show MetricCard;

// ======================================================
// Widgets: Glassmorphic Card Container
// ======================================================

/// Premium Frosted Glass Card Container
///
/// Builds a stylized canvas block with backdrop filters (blur),
/// semi-transparent border, and subtle inner gradients to match premium theme specs.
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

  /// Default constructor for creating a GlassmorphicCard widget.
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
    final effectiveBorder =
        borderColor ?? (isDark ? AppColors.white12 : const Color(0xFFE0E0E0));
    final effectiveBg =
        backgroundColor ??
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
