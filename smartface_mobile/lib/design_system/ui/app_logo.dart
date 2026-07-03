import 'package:flutter/material.dart';

import 'app_colors.dart';

/// ============================================================================
/// AppLogo — the "Smart Attendance AI" logo mark inside a glossy circular case.
///
/// Falls back to a branded glyph if the image asset is missing so the UI never
/// shows a broken image. Never renders the retired "Smart Elite" name.
/// ============================================================================
class AppLogo extends StatelessWidget {
  final double size;
  final bool showRing;
  const AppLogo({super.key, this.size = 96, this.showRing = true});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      padding: EdgeInsets.all(size * 0.16),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white,
        border: showRing
            ? Border.all(color: AppColors.primary, width: 2)
            : null,
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.25),
            blurRadius: 18,
            spreadRadius: 1,
          ),
        ],
      ),
      child: ClipOval(
        child: Image.asset(
          'assets/images/logo.png',
          fit: BoxFit.cover,
          errorBuilder: (context, error, stack) => Icon(
            Icons.face_retouching_natural,
            size: size * 0.5,
            color: AppColors.primary,
          ),
        ),
      ),
    );
  }
}

/// Brand wordmark — always "Smart Attendance AI".
class AppWordmark extends StatelessWidget {
  final double fontSize;
  final Color? color;
  final bool showTagline;
  const AppWordmark({
    super.key,
    this.fontSize = 26,
    this.color,
    this.showTagline = true,
  });

  @override
  Widget build(BuildContext context) {
    final c = color ?? AppColors.heading(Theme.of(context).brightness);
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          'Smart Attendance AI',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: fontSize,
            fontWeight: FontWeight.w800,
            letterSpacing: 0.5,
            color: c,
          ),
        ),
        if (showTagline) ...[
          const SizedBox(height: 6),
          Text(
            'Precision Attendance, Powered by AI',
            style: TextStyle(
              fontSize: 11.5,
              letterSpacing: 1.5,
              fontWeight: FontWeight.w600,
              color: c.withValues(alpha: 0.6),
            ),
          ),
        ],
      ],
    );
  }
}
