import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';
import 'package:smartface_attendance/app/theme/dark_theme.dart';

/// Premium glassmorphic container widget.
///
/// Combines a [BackdropFilter] for frosted blur, a semi-transparent surface background,
/// and a custom-painted gradient border for card reflection highlights.
class GlassContainer extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final double blur;
  final double borderRadius;
  final Color? backgroundColor;
  final double borderWidth;
  final Gradient? borderGradient;
  final List<BoxShadow>? boxShadow;
  final VoidCallback? onTap;

  const GlassContainer({
    super.key,
    required this.child,
    this.padding,
    this.blur = 22.0,
    this.borderRadius = AppRadius.lg,
    this.backgroundColor,
    this.borderWidth = 1.0,
    this.borderGradient,
    this.boxShadow,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final appColors = theme.extension<DarkAppColors>();

    final effectiveBg =
        backgroundColor ??
        appColors?.surfaceCard ??
        (theme.brightness == Brightness.dark
            ? const Color(0xD9111827)
            : const Color(0xD9FFFFFF));

    final effectiveBorderGradient =
        borderGradient ??
        LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: theme.brightness == Brightness.dark
              ? [
                  Colors.white.withValues(alpha: 0.08),
                  Colors.white.withValues(alpha: 0.02),
                ]
              : [
                  Colors.black.withValues(alpha: 0.08),
                  Colors.black.withValues(alpha: 0.02),
                ],
        );

    Widget containerContent = Container(
      padding: padding ?? const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: effectiveBg,
        borderRadius: BorderRadius.circular(borderRadius),
        boxShadow: boxShadow,
      ),
      child: child,
    );

    // Apply custom paint for gradient border
    if (borderWidth > 0) {
      containerContent = CustomPaint(
        painter: GradientBorderPainter(
          strokeWidth: borderWidth,
          radius: borderRadius,
          gradient: effectiveBorderGradient,
        ),
        child: containerContent,
      );
    }

    if (onTap != null) {
      containerContent = InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(borderRadius),
        child: containerContent,
      );
    }

    return ClipRRect(
      borderRadius: BorderRadius.circular(borderRadius),
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
        child: containerContent,
      ),
    );
  }
}

class GradientBorderPainter extends CustomPainter {
  final double strokeWidth;
  final double radius;
  final Gradient gradient;

  GradientBorderPainter({
    required this.strokeWidth,
    required this.radius,
    required this.gradient,
  });

  @override
  void paint(Canvas canvas, Size size) {
    // Inset the rect slightly by half the stroke width to prevent outer edge clipping
    final rect =
        Offset(strokeWidth / 2, strokeWidth / 2) &
        Size(size.width - strokeWidth, size.height - strokeWidth);

    final paint = Paint()
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke
      ..shader = gradient.createShader(Offset.zero & size);

    final rrect = RRect.fromRectAndRadius(
      rect,
      Radius.circular(radius - strokeWidth / 2),
    );
    canvas.drawRRect(rrect, paint);
  }

  @override
  bool shouldRepaint(covariant GradientBorderPainter oldDelegate) {
    return oldDelegate.strokeWidth != strokeWidth ||
        oldDelegate.radius != radius ||
        oldDelegate.gradient != gradient;
  }
}
