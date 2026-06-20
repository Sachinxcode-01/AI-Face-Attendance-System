import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:smartface_attendance/app/theme/dark_theme.dart';

/// Slowly drifting animated mesh background.
///
/// Draws a solid base background (base color from [DarkAppColors.backgroundBase])
/// and renders a slowly moving radial gradient using [CustomPainter] and an [AnimationController].
/// The gradient utilizes the primary theme accent at a maximum opacity of 3-5%.
/// Wrapped in a [RepaintBoundary] to minimize redraw overhead and ensure 60fps performance.
class AnimatedMeshBackground extends StatefulWidget {
  final Widget? child;

  const AnimatedMeshBackground({
    super.key,
    this.child,
  });

  @override
  State<AnimatedMeshBackground> createState() => _AnimatedMeshBackgroundState();
}

class _AnimatedMeshBackgroundState extends State<AnimatedMeshBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    // Continuous loop with a slow cycle duration (18 seconds)
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 18),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final appColors = theme.extension<DarkAppColors>();
    final primaryColor = appColors?.primary ?? const Color(0xFF2563EB);
    final baseBg = appColors?.backgroundBase ?? const Color(0xFF020617);

    return Scaffold(
      body: RepaintBoundary(
        child: Stack(
          children: [
            // Layer 1: Solid base background color
            Container(color: baseBg),

            // Layer 2: Animated radial gradient mesh
            AnimatedBuilder(
              animation: _controller,
              builder: (context, _) {
                return CustomPaint(
                  painter: _MeshPainter(
                    progress: _controller.value,
                    gradientColor: primaryColor,
                  ),
                  size: Size.infinite,
                );
              },
            ),

            // Layer 3: Screen content
            if (widget.child != null) widget.child!,
          ],
        ),
      ),
    );
  }
}

class _MeshPainter extends CustomPainter {
  final double progress;
  final Color gradientColor;

  _MeshPainter({
    required this.progress,
    required this.gradientColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final paint = Paint()..style = PaintingStyle.fill;

    // Drifting coordinates computed using trigonometric functions to form a closed continuous loop
    final angle = progress * 2 * math.pi;

    // Drifting boundaries centered around the screen (offsetting 25% of width/height max)
    final cx = size.width * 0.5 + (size.width * 0.20) * math.cos(angle);
    final cy = size.height * 0.5 + (size.height * 0.15) * math.sin(2 * angle);

    final center = Offset(cx, cy);
    // Radial gradient coverage is 85% of maximum diagonal bounds
    final radius = math.max(size.width, size.height) * 0.85;

    final radialGradient = RadialGradient(
      center: Alignment.center,
      radius: 0.5,
      colors: [
        gradientColor.withValues(alpha: 0.045), // ~4.5% opacity (3-5% specification range)
        gradientColor.withValues(alpha: 0.015),
        Colors.transparent,
      ],
      stops: const [0.0, 0.6, 1.0],
    );

    // Apply the gradient shader onto the Canvas
    final shaderRect = Rect.fromCircle(center: center, radius: radius);
    paint.shader = radialGradient.createShader(shaderRect);

    canvas.drawRect(rect, paint);
  }

  @override
  bool shouldRepaint(covariant _MeshPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.gradientColor != gradientColor;
  }
}
