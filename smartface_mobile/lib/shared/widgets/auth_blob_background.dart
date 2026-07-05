import 'package:flutter/material.dart';

/// A modern fluid "blob" gradient backdrop with glossy floating spheres,
/// inspired by premium onboarding designs. Uses the project palette
/// (indigo / cobalt) in a modern theme adaptation (light / dark).
class AuthBlobBackground extends StatelessWidget {
  final Widget? child;
  const AuthBlobBackground({super.key, this.child});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final baseGradient = isDark
        ? const LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [
              Color(0xFF141B3A), // deep dark navy
              Color(0xFF0D1226), // slate midnight
              Color(0xFF090D1C), // solid void
            ],
            stops: [0.0, 0.55, 1.0],
          )
        : const LinearGradient(
            begin: Alignment.topRight,
            end: Alignment.bottomLeft,
            colors: [
              Color(0xFFE5ECFC), // light lavender-blue
              Color(0xFFF1F5FD), // light blue-gray
              Color(0xFFFFFFFF), // solid white
            ],
            stops: [0.0, 0.55, 1.0],
          );

    return Stack(
      fit: StackFit.expand,
      children: [
        DecoratedBox(
          decoration: BoxDecoration(
            gradient: baseGradient,
          ),
        ),

        // Organic translucent wave blobs (liquid style)
        Positioned.fill(
          child: CustomPaint(painter: _BlobPainter(isDark: isDark)),
        ),

        // Glossy floating 3D spheres
        Positioned(
          top: -20,
          left: 40,
          child: _GlossySphere(size: 80, isDark: true),
        ),
        Positioned(
          top: 90,
          right: 40,
          child: _GlossySphere(size: 110, isDark: isDark),
        ),
        Positioned(
          bottom: 140,
          left: 30,
          child: _GlossySphere(size: 90, isDark: true),
        ),
        Positioned(
          top: 240,
          left: -20,
          child: _GlossySphere(size: 64, dim: true, isDark: isDark),
        ),

        // ignore: use_null_aware_elements
        if (child != null) child!,
      ],
    );
  }
}

/// Soft overlapping organic shapes that give the fluid "liquid" feel.
class _BlobPainter extends CustomPainter {
  final bool isDark;
  _BlobPainter({required this.isDark});

  @override
  void paint(Canvas canvas, Size size) {
    final w = size.width;
    final h = size.height;

    final double multiplier = isDark ? 0.6 : 1.0;

    void blob(Color color, double opacity, List<Offset> pts) {
      final paint = Paint()
        ..color = color.withValues(alpha: opacity * multiplier)
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

    // Light cobalt sweep (top-right)
    blob(const Color(0xFF5970EC), 0.28, [
      Offset(w * 0.45, 0),
      Offset(w * 1.05, h * 0.05),
      Offset(w * 1.05, h * 0.40),
      Offset(w * 0.60, h * 0.28),
      Offset(w * 0.35, h * 0.10),
    ]);

    // Pale highlight wave
    blob(isDark ? const Color(0xFF283264) : Colors.white, 0.22, [
      Offset(w * 0.55, h * 0.02),
      Offset(w * 1.05, h * 0.18),
      Offset(w * 0.95, h * 0.46),
      Offset(w * 0.62, h * 0.34),
    ]);

    // Deep navy/blue wave (bottom-left)
    blob(const Color(0xFF3D4EB9), 0.32, [
      Offset(0, h * 0.45),
      Offset(w * 0.45, h * 0.55),
      Offset(w * 0.30, h * 1.05),
      Offset(-0.05 * w, h * 1.05),
    ]);

    // Subtle purple-ish mid accent
    blob(const Color(0xFF7F6CE4), 0.15, [
      Offset(0, h * 0.30),
      Offset(w * 0.30, h * 0.38),
      Offset(w * 0.20, h * 0.70),
      Offset(-0.05 * w, h * 0.62),
    ]);
  }

  @override
  bool shouldRepaint(covariant _BlobPainter oldDelegate) => oldDelegate.isDark != isDark;
}

/// A glossy 3D-style sphere with a soft highlight and drop shadow.
class _GlossySphere extends StatelessWidget {
  final double size;
  final bool dim;
  final bool isDark;
  const _GlossySphere({
    required this.size,
    this.dim = false,
    this.isDark = false,
  });

  @override
  Widget build(BuildContext context) {
    List<Color> colors;
    if (isDark) {
      colors = const [
        Color(0xFF2C3E75), // highlight reflection
        Color(0xFF1D2952), // base
        Color(0xFF0C132E), // shadow gradient
      ];
    } else if (dim) {
      colors = [
        Colors.white.withValues(alpha: 0.45),
        const Color(0xFFD1DBF6).withValues(alpha: 0.25),
        const Color(0xFF9EAFD8).withValues(alpha: 0.10),
      ];
    } else {
      colors = const [
        Colors.white,
        Color(0xFFE2EBFE),
        Color(0xFFB0C3EF),
      ];
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
            color: (isDark ? const Color(0xFF0C132E) : const Color(0xFF9EAFD8))
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
