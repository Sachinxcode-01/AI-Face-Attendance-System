import 'package:flutter/material.dart';

import 'app_colors.dart';

/// ============================================================================
/// PremiumBackground — soft blue/navy liquid backdrop with animated floating
/// 3D glossy spheres, matching the reference images. Theme aware (light/dark).
///
/// Wrap any screen body:
///   PremiumBackground(child: SafeArea(child: ...))
/// ============================================================================
class PremiumBackground extends StatefulWidget {
  final Widget child;

  /// When true, shows a fuller set of large spheres (for splash / onboarding).
  final bool immersive;

  const PremiumBackground({
    super.key,
    required this.child,
    this.immersive = false,
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
      duration: const Duration(seconds: 12),
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
            colors: [Color(0xFF141B3A), Color(0xFF0D1226), Color(0xFF090D1C)],
            stops: [0.0, 0.55, 1.0],
          )
        : const LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [Color(0xFFE5ECFC), Color(0xFFF1F5FD), Color(0xFFFFFFFF)],
            stops: [0.0, 0.55, 1.0],
          );

    return Stack(
      fit: StackFit.expand,
      children: [
        DecoratedBox(decoration: BoxDecoration(gradient: gradient)),
        Positioned.fill(
          child: CustomPaint(painter: _LiquidBlobPainter(isDark: isDark)),
        ),
        // Animated floating spheres
        AnimatedBuilder(
          animation: _controller,
          builder: (context, _) {
            final t = _controller.value;
            return Stack(
              children: [
                _floating(
                  top: -10 + (t * 14),
                  left: 40,
                  size: widget.immersive ? 90 : 74,
                  dark: true,
                ),
                _floating(
                  top: (widget.immersive ? 120 : 80) - (t * 18),
                  right: 30,
                  size: widget.immersive ? 120 : 100,
                ),
                _floating(
                  bottom: (widget.immersive ? 150 : 120) + (t * 16),
                  left: 24,
                  size: widget.immersive ? 96 : 78,
                  dark: true,
                ),
                _floating(
                  top: (widget.immersive ? 260 : 220) + (t * 12),
                  left: -22,
                  size: 60,
                  dim: true,
                ),
                if (widget.immersive)
                  _floating(
                    bottom: 60 - (t * 10),
                    right: 60,
                    size: 54,
                    dim: true,
                  ),
              ],
            );
          },
        ),
        widget.child,
      ],
    );
  }

  Widget _floating({
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

/// A glossy 3D-style sphere with a soft highlight and drop shadow.
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
        Colors.white.withValues(alpha: 0.45),
        const Color(0xFFD1DBF6).withValues(alpha: 0.25),
        const Color(0xFF9EAFD8).withValues(alpha: 0.10),
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
          center: const Alignment(-0.4, -0.5),
          radius: 1.0,
          colors: colors,
          stops: const [0.0, 0.60, 1.0],
        ),
        boxShadow: [
          BoxShadow(
            color: (dark ? const Color(0xFF0C132E) : const Color(0xFF9EAFD8))
                .withValues(alpha: dim ? 0.12 : 0.25),
            blurRadius: 24,
            spreadRadius: 2,
            offset: const Offset(0, 10),
          ),
        ],
      ),
    );
  }
}

/// Soft overlapping organic shapes that give the fluid "liquid" feel.
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

    const cobalt = Color(0xFF5970EC);
    const navy = Color(0xFF3D4EB9);
    const purple = Color(0xFF7F6CE4);
    final double m = isDark ? 0.7 : 1.0;

    blob(cobalt, 0.28 * m, [
      Offset(w * 0.45, 0),
      Offset(w * 1.05, h * 0.05),
      Offset(w * 1.05, h * 0.40),
      Offset(w * 0.60, h * 0.28),
      Offset(w * 0.35, h * 0.10),
    ]);
    blob(isDark ? const Color(0xFF283264) : Colors.white, 0.22 * m, [
      Offset(w * 0.55, h * 0.02),
      Offset(w * 1.05, h * 0.18),
      Offset(w * 0.95, h * 0.46),
      Offset(w * 0.62, h * 0.34),
    ]);
    blob(navy, 0.32 * m, [
      Offset(0, h * 0.45),
      Offset(w * 0.45, h * 0.55),
      Offset(w * 0.30, h * 1.05),
      Offset(-0.05 * w, h * 1.05),
    ]);
    blob(purple, 0.15 * m, [
      Offset(0, h * 0.30),
      Offset(w * 0.30, h * 0.38),
      Offset(w * 0.20, h * 0.70),
      Offset(-0.05 * w, h * 0.62),
    ]);
  }

  @override
  bool shouldRepaint(covariant _LiquidBlobPainter oldDelegate) =>
      oldDelegate.isDark != isDark;
}
