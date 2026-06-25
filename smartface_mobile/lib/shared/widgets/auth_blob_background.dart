import 'package:flutter/material.dart';
import 'package:smartface_attendance/app/constants/app_constants.dart';

/// A modern fluid "blob" gradient backdrop with glossy floating spheres,
/// inspired by premium onboarding designs. Uses the project palette
/// (indigo / cobalt) — no new brand colors introduced.
class AuthBlobBackground extends StatelessWidget {
  final Widget? child;
  const AuthBlobBackground({super.key, this.child});

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        // Base diagonal gradient
        const DecoratedBox(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topRight,
              end: Alignment.bottomLeft,
              colors: [
                AppColors.indigoLight, // cobalt (lighter, top-right)
                AppColors.indigo, // royal navy (mid)
                AppColors.bgDeep, // deep slate (bottom-left)
              ],
              stops: [0.0, 0.55, 1.0],
            ),
          ),
        ),

        // Organic translucent wave blobs
        Positioned.fill(
          child: CustomPaint(painter: _BlobPainter()),
        ),

        // Glossy floating spheres
        const Positioned(
          top: 90,
          right: 40,
          child: _GlossySphere(size: 120),
        ),
        const Positioned(
          bottom: 140,
          left: 30,
          child: _GlossySphere(size: 90),
        ),
        const Positioned(
          top: 240,
          left: -20,
          child: _GlossySphere(size: 64, dim: true),
        ),

        if (child != null) child!,
      ],
    );
  }
}

/// Soft overlapping organic shapes that give the fluid "liquid" feel.
class _BlobPainter extends CustomPainter {
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

    // Light cobalt sweep (top-right)
    blob(AppColors.accent, 0.30, [
      Offset(w * 0.45, 0),
      Offset(w * 1.05, h * 0.05),
      Offset(w * 1.05, h * 0.40),
      Offset(w * 0.60, h * 0.28),
      Offset(w * 0.35, h * 0.10),
    ]);

    // Pale highlight wave
    blob(Colors.white, 0.10, [
      Offset(w * 0.55, h * 0.02),
      Offset(w * 1.05, h * 0.18),
      Offset(w * 0.95, h * 0.46),
      Offset(w * 0.62, h * 0.34),
    ]);

    // Deep navy wave (bottom-left)
    blob(AppColors.indigo, 0.45, [
      Offset(0, h * 0.45),
      Offset(w * 0.45, h * 0.55),
      Offset(w * 0.30, h * 1.05),
      Offset(-0.05 * w, h * 1.05),
    ]);

    // Subtle purple-ish mid accent
    blob(const Color(0xFF6D5BD0), 0.18, [
      Offset(0, h * 0.30),
      Offset(w * 0.30, h * 0.38),
      Offset(w * 0.20, h * 0.70),
      Offset(-0.05 * w, h * 0.62),
    ]);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

/// A glossy 3D-style sphere with a soft highlight and drop shadow.
class _GlossySphere extends StatelessWidget {
  final double size;
  final bool dim;
  const _GlossySphere({required this.size, this.dim = false});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          center: const Alignment(-0.4, -0.5),
          radius: 1.0,
          colors: dim
              ? [
                  Colors.white.withValues(alpha: 0.30),
                  AppColors.indigoLight.withValues(alpha: 0.20),
                  AppColors.indigo.withValues(alpha: 0.10),
                ]
              : [
                  Colors.white,
                  AppColors.indigoLight,
                  AppColors.indigo,
                ],
          stops: const [0.0, 0.55, 1.0],
        ),
        boxShadow: [
          BoxShadow(
            color: AppColors.indigo.withValues(alpha: dim ? 0.15 : 0.35),
            blurRadius: 30,
            spreadRadius: 2,
            offset: const Offset(0, 12),
          ),
        ],
      ),
    );
  }
}
