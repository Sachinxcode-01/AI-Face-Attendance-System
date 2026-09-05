import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:smartface_attendance/app/theme/dark_theme.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';

/// Premium glassmorphic status badge.
///
/// Builds a clean pill-shaped tag (e.g. for "Live", "Late", "Present")
/// featuring a breathing glow dot that pulses dynamically to show activity.
class StatusBadge extends StatelessWidget {
  final String label;
  final Color? color;
  final bool animateDot;

  const StatusBadge({
    super.key,
    required this.label,
    this.color,
    this.animateDot = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final appColors = theme.extension<DarkAppColors>();
    final isDark = theme.brightness == Brightness.dark;

    final effectiveColor =
        color ?? appColors?.success ?? const Color(0xFF10B981);

    // Subtle background and border colors using opacities of status color
    final bg = effectiveColor.withValues(alpha: isDark ? 0.08 : 0.06);
    final border = effectiveColor.withValues(alpha: isDark ? 0.22 : 0.25);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppRadius.full),
        border: Border.all(color: border, width: 1.0),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          if (animateDot)
            _PulseDot(color: effectiveColor, size: 7.0)
          else
            Container(
              width: 7.0,
              height: 7.0,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: effectiveColor,
              ),
            ),
          const SizedBox(width: 6),
          Text(
            label.toUpperCase(),
            style: GoogleFonts.inter(
              fontSize: 10,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.8,
              color: effectiveColor,
            ),
          ),
        ],
      ),
    );
  }
}

/// A custom dot that pulses with a breathing effect.
class _PulseDot extends StatefulWidget {
  final Color color;
  final double size;

  const _PulseDot({required this.color, required this.size});

  @override
  State<_PulseDot> createState() => _PulseDotState();
}

class _PulseDotState extends State<_PulseDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    // 2-second cycle for a natural breathing speed
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) {
        final scale = 1.0 + _controller.value * 0.5;
        final opacity = 0.8 - _controller.value * 0.5;

        return Stack(
          alignment: Alignment.center,
          children: [
            // Pulsing outer glow ring
            Container(
              width: widget.size * scale,
              height: widget.size * scale,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: widget.color.withValues(alpha: opacity),
              ),
            ),
            // Solid center core dot
            Container(
              width: widget.size,
              height: widget.size,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: widget.color,
              ),
            ),
          ],
        );
      },
    );
  }
}
