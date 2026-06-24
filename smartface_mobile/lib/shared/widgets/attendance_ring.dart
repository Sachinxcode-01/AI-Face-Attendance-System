import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/app/theme/dark_theme.dart';

/// Premium animated circular progress ring for attendance analytics.
///
/// Features:
/// - Smooth load-in animation from 0.0 to target percentage via [TweenAnimationBuilder]
/// - Dynamic color-banding and box-shadow glows:
///   - Green (>75% attendance)
///   - Amber (50%-75% attendance)
///   - Red (<50% attendance)
/// - Center statistic readout with customizable text themes.
class AttendanceRing extends StatelessWidget {
  final double percentage; // Expected between 0.0 and 1.0 (e.g. 0.85 for 85%)
  final double size;
  final double strokeWidth;
  final Duration duration;
  final String? subtitle;

  const AttendanceRing({
    super.key,
    required this.percentage,
    this.size = 130.0,
    this.strokeWidth = 10.0,
    this.duration = const Duration(milliseconds: 1500),
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final appColors = theme.extension<DarkAppColors>();

    // Safeguard percentage bounds
    final targetPercentage = percentage.clamp(0.0, 1.0);

    // Determine colors and shadows based on target percentage
    final Color activeColor;
    final Color glowColor;

    if (targetPercentage > 0.75) {
      activeColor = appColors?.success ?? const Color(0xFF10B981);
      glowColor = appColors?.successGlow ?? const Color(0x3310B981);
    } else if (targetPercentage >= 0.50) {
      activeColor = appColors?.warning ?? const Color(0xFFF59E0B);
      glowColor = appColors?.warningGlow ?? const Color(0x33F59E0B);
    } else {
      activeColor = appColors?.error ?? const Color(0xFFEF4444);
      glowColor = appColors?.errorGlow ?? const Color(0x33EF4444);
    }

    final trackColor = theme.brightness == Brightness.dark
        ? Colors.white.withValues(alpha: 0.06)
        : Colors.black.withValues(alpha: 0.06);

    return TweenAnimationBuilder<double>(
      tween: Tween<double>(begin: 0.0, end: targetPercentage),
      duration: duration,
      curve: Curves.easeOutCubic,
      builder: (context, animatedValue, _) {
        final percentText = '${(animatedValue * 100).round()}%';

        return Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            boxShadow: [
              BoxShadow(color: glowColor, blurRadius: 28, spreadRadius: 1),
            ],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Circular progress CustomPainter
              SizedBox.expand(
                child: CustomPaint(
                  painter: _RingPainter(
                    progress: animatedValue,
                    trackColor: trackColor,
                    progressColor: activeColor,
                    strokeWidth: strokeWidth,
                  ),
                ),
              ),

              // Center display texts
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    percentText,
                    style: GoogleFonts.inter(
                      fontSize: size * 0.20,
                      fontWeight: FontWeight.bold,
                      color: theme.brightness == Brightness.dark
                          ? Colors.white.withValues(alpha: 0.87)
                          : theme.colorScheme.onSurface,
                    ),
                  ),
                  Text(
                    subtitle ?? 'Attendance',
                    style: GoogleFonts.inter(
                      fontSize: size * 0.08,
                      fontWeight: FontWeight.w500,
                      color: theme.brightness == Brightness.dark
                          ? Colors.white.withValues(alpha: 0.60)
                          : theme.colorScheme.onSurface.withValues(alpha: 0.6),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class _RingPainter extends CustomPainter {
  final double progress;
  final Color trackColor;
  final Color progressColor;
  final double strokeWidth;

  _RingPainter({
    required this.progress,
    required this.trackColor,
    required this.progressColor,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Draw background track circle
    final trackPaint = Paint()
      ..color = trackColor
      ..strokeWidth = strokeWidth
      ..style = PaintingStyle.stroke;
    canvas.drawCircle(center, radius, trackPaint);

    // Draw active progress path
    if (progress > 0) {
      final progressPaint = Paint()
        ..color = progressColor
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round
        ..style = PaintingStyle.stroke;

      // Start sweeping at top vertical (-pi / 2)
      const startAngle = -math.pi / 2;
      final sweepAngle = 2 * math.pi * progress;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle,
        false,
        progressPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _RingPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.trackColor != trackColor ||
        oldDelegate.progressColor != progressColor ||
        oldDelegate.strokeWidth != strokeWidth;
  }
}
