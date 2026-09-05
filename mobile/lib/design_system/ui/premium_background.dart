import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'app_colors.dart';

/// ============================================================================
/// PremiumBackground — Modern animated backdrop with floating glossy spheres
/// and organic liquid blobs. Theme-aware with smooth 12s looping animation.
///
/// Wrap any screen body:
///   PremiumBackground(child: SafeArea(child: ...))
/// ============================================================================
class PremiumBackground extends StatefulWidget {
  final Widget child;

  /// When true, shows a fuller set of larger spheres for splash/onboarding.
  final bool immersive;

  /// When true, gradient is slightly lighter for auth screens.
  final bool soft;

  const PremiumBackground({
    super.key,
    required this.child,
    this.immersive = false,
    this.soft = false,
  });

  @override
  State<PremiumBackground> createState() => _PremiumBackgroundState();
}

class _PremiumBackgroundState extends State<PremiumBackground>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 14),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final gradient = isDark
        ? const LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [Color(0xFF0D1226), Color(0xFF090D1C), Color(0xFF060914)],
            stops: [0.0, 0.5, 1.0],
          )
        : (widget.soft
              ? const LinearGradient(
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                  colors: [
                    Color(0xFFF0F3FF),
                    Color(0xFFF5F7FF),
                    Color(0xFFFAFBFF),
                  ],
                  stops: [0.0, 0.5, 1.0],
                )
              : const LinearGradient(
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                  colors: [
                    Color(0xFFE8ECFA),
                    Color(0xFFF0F3FD),
                    Color(0xFFF8FAFF),
                  ],
                  stops: [0.0, 0.5, 1.0],
                ));

    return Stack(
      fit: StackFit.expand,
      children: [
        // Base gradient
        DecoratedBox(decoration: BoxDecoration(gradient: gradient)),

        // Liquid blob organic shapes
        Positioned.fill(
          child: CustomPaint(painter: _LiquidBlobPainter(isDark: isDark)),
        ),

        // Animated floating spheres with smooth sine-based motion
        AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            // Use sine wave for smoother vertical motion
            final rawT = _controller.value;
            final t = (math.sin(rawT * math.pi * 2) + 1) / 2;

            return Stack(
              children: [
                _sphere(
                  top: -8 + (t * 16),
                  left: 36,
                  size: widget.immersive ? 90 : 72,
                  dark: true,
                ),
                _sphere(
                  top: (widget.immersive ? 110 : 70) - (t * 20),
                  right: 28,
                  size: widget.immersive ? 100 : 80,
                  dark: true,
                ),
                _sphere(
                  bottom: (widget.immersive ? 140 : 100) + (t * 18),
                  left: 20,
                  size: widget.immersive ? 80 : 64,
                  dark: true,
                ),
                _sphere(
                  top: (widget.immersive ? 250 : 200) + (t * 14),
                  left: -20,
                  size: 56,
                  dim: true,
                ),
                if (widget.immersive)
                  _sphere(
                    bottom: 50 - (t * 14),
                    right: 56,
                    size: 50,
                    dim: true,
                  ),
              ],
            );
          },
        ),

        // Subtle gradient overlay at bottom for depth
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          height: 120,
          child: IgnorePointer(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    Colors.transparent,
                    isDark
                        ? const Color(0xFF070A14).withValues(alpha: 0.6)
                        : const Color(0xFFF4F6FC).withValues(alpha: 0.6),
                  ],
                ),
              ),
            ),
          ),
        ),

        widget.child,
      ],
    );
  }

  Widget _sphere({
    double? top,
    double? bottom,
    double? left,
    double? right,
    required double size,
    bool dark = false,
    bool dim = false,
  }) {
    return Positioned(
      top: top,
      bottom: bottom,
      left: left,
      right: right,
      child: GlossySphere(size: size, dark: dark, dim: dim),
    );
  }
}

/// A glossy 3D-style sphere with a soft radial highlight and drop shadow.
class GlossySphere extends StatelessWidget {
  final double size;
  final bool dark;
  final bool dim;

  const GlossySphere({
    super.key,
    required this.size,
    this.dark = false,
    this.dim = false,
  });

  @override
  Widget build(BuildContext context) {
    List<Color> colors;
    if (dark) {
      colors = AppColors.sphereDark;
    } else if (dim) {
      colors = [
        Colors.white.withValues(alpha: 0.40),
        const Color(0xFFD0DBF5).withValues(alpha: 0.20),
        const Color(0xFF9EAFD8).withValues(alpha: 0.08),
      ];
    } else {
      colors = AppColors.sphereLight;
    }

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          center: const Alignment(-0.35, -0.45),
          radius: 1.0,
          colors: colors,
          stops: const [0.0, 0.55, 1.0],
        ),
        boxShadow: [
          BoxShadow(
            color: (dark ? const Color(0xFF0A0F2E) : const Color(0xFF9EAFD8))
                .withValues(alpha: dim ? 0.10 : 0.22),
            blurRadius: 28,
            spreadRadius: 2,
            offset: const Offset(0, 12),
          ),
        ],
      ),
    );
  }
}

/// Soft overlapping organic shapes that give a fluid "liquid" feel.
class _LiquidBlobPainter extends CustomPainter {
  final bool isDark;
  _LiquidBlobPainter({required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    void blob(Color color, double opacity, List<Offset> pts) {
      final paint = Paint()
        ..color = color.withValues(alpha: opacity)
        ..style = PaintingStyle.fill;
      final path = Path()..moveTo(pts.first.dx, pts.first.dy);
      for (int i = 1; i < pts.length; i++) {
        final prev = pts[i - 1];
        final cur = pts[i];
        final mid = Offset((prev.dx + cur.dx) / 2, (prev.dy + cur.dy) / 2);
        path.quadraticBezierTo(prev.dx, prev.dy, mid.dx, mid.dy);
      }
      path.close();
      canvas.drawPath(path, paint);
    }

    const primary = Color(0xFF6366F1);
    const accent = Color(0xFF4F46E5);
    const purple = Color(0xFF7C5CFC);
    final double m = isDark ? 0.65 : 1.0;

    // Top-right primary blob
    blob(primary, 0.22 * m, [
      Offset(w * 0.45, 0),
      Offset(w * 1.05, h * 0.03),
      Offset(w * 1.05, h * 0.35),
      Offset(w * 0.58, h * 0.25),
      Offset(w * 0.35, h * 0.08),
    ]);

    // Mid-right white/soft accent blob
    blob(isDark ? const Color(0xFF252E50) : Colors.white, 0.20 * m, [
      Offset(w * 0.55, h * 0.02),
      Offset(w * 1.05, h * 0.15),
      Offset(w * 0.95, h * 0.42),
      Offset(w * 0.62, h * 0.30),
    ]);

    // Bottom-left accent blob
    blob(accent, 0.28 * m, [
      Offset(0, h * 0.42),
      Offset(w * 0.42, h * 0.52),
      Offset(w * 0.28, h * 1.05),
      Offset(-0.05 * w, h * 1.05),
    ]);

    // Bottom-left purple accent
    blob(purple, 0.12 * m, [
      Offset(-0.02 * w, h * 0.28),
      Offset(w * 0.28, h * 0.35),
      Offset(w * 0.18, h * 0.65),
      Offset(-0.05 * w, h * 0.58),
    ]);
  }

  @override
  bool shouldRepaint(covariant _LiquidBlobPainter oldDelegate) =>
      oldDelegate.isDark != isDark;
}
